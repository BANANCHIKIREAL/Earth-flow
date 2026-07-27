import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import coreURL from "@ffmpeg/core?url";
import wasmURL from "@ffmpeg/core/wasm?url";

export const MAX_SYNC_AUDIO_BYTES = 900_000;
export const MAX_SYNC_AUDIO_SECONDS = 90;

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({ coreURL, wasmURL });
      return ffmpeg;
    })().catch((error) => {
      ffmpegPromise = null;
      throw error;
    });
  }
  return ffmpegPromise;
}

function getAudioDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    const cleanup = () => {
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      cleanup();
      if (Number.isFinite(duration) && duration > 0) resolve(duration);
      else reject(new Error("Could not read audio duration"));
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("Unsupported or damaged audio file"));
    };
    audio.src = url;
  });
}

function inputExtension(file: File) {
  const match = file.name.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  if (match?.[1]) return match[1];
  const mimeExtensions: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
  };
  return mimeExtensions[file.type] ?? "audio";
}

export interface CompressedSyncAudio {
  blob: Blob;
  durationSeconds: number;
  originalDurationSeconds: number;
}

export async function compressAudioForSync(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<CompressedSyncAudio> {
  onProgress?.(0.03);
  const originalDurationSeconds = await getAudioDuration(file);
  const clipDuration = Math.min(originalDurationSeconds, MAX_SYNC_AUDIO_SECONDS);
  const fadeDuration = clipDuration >= 4 ? Math.min(1.5, clipDuration / 6) : 0;
  const outputDuration = Math.max(0.1, clipDuration - fadeDuration);
  const token = crypto.randomUUID();
  const inputName = `input-${token}.${inputExtension(file)}`;
  const outputName = `sync-${token}.webm`;
  const ffmpeg = await getFFmpeg();
  onProgress?.(0.12);

  const progressHandler = ({ progress }: { progress: number }) => {
    if (!Number.isFinite(progress)) return;
    onProgress?.(0.12 + Math.min(1, Math.max(0, progress)) * 0.76);
  };
  ffmpeg.on("progress", progressHandler);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const encode = async (bitrate: 64 | 48) => {
      try {
        await ffmpeg.deleteFile(outputName);
      } catch {}

      const audioArgs =
        fadeDuration > 0
          ? [
              "-filter_complex",
              `[0:a]atrim=start=${fadeDuration.toFixed(3)}:end=${clipDuration.toFixed(3)},asetpts=PTS-STARTPTS[body];[0:a]atrim=start=0:end=${fadeDuration.toFixed(3)},asetpts=PTS-STARTPTS[head];[body][head]acrossfade=d=${fadeDuration.toFixed(3)}:c1=tri:c2=tri[out]`,
              "-map",
              "[out]",
            ]
          : ["-t", clipDuration.toFixed(3)];

      const exitCode = await ffmpeg.exec([
        "-i",
        inputName,
        "-vn",
        ...audioArgs,
        "-ac",
        "2",
        "-ar",
        "48000",
        "-c:a",
        "libopus",
        "-b:a",
        `${bitrate}k`,
        "-vbr",
        "constrained",
        "-application",
        "audio",
        "-f",
        "webm",
        outputName,
      ]);
      if (exitCode !== 0) throw new Error("Audio compression failed");

      const output = await ffmpeg.readFile(outputName);
      const bytes = typeof output === "string" ? new TextEncoder().encode(output) : output;
      const blobBytes = new Uint8Array(bytes.byteLength);
      blobBytes.set(bytes);
      return new Blob([blobBytes], { type: "audio/webm" });
    };

    let blob = await encode(64);
    if (blob.size > MAX_SYNC_AUDIO_BYTES) blob = await encode(48);
    if (blob.size > MAX_SYNC_AUDIO_BYTES) {
      throw new Error("Compressed audio is still larger than 900 KB");
    }

    onProgress?.(1);
    return { blob, durationSeconds: outputDuration, originalDurationSeconds };
  } finally {
    ffmpeg.off("progress", progressHandler);
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch {}
  }
}
