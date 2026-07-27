import { FFmpeg } from "@ffmpeg/ffmpeg";
import classWorkerURL from "@ffmpeg/ffmpeg/worker?url";
import { fetchFile } from "@ffmpeg/util";
import coreURL from "@ffmpeg/core?url";
import wasmURL from "@ffmpeg/core/wasm?url";

export const MAX_SYNC_AUDIO_BYTES = 4_500_000;
const AUDIO_METADATA_TIMEOUT_MS = 6_000;
const DEFAULT_AUDIO_BITRATE_KBPS = 48;
const MIN_AUDIO_BITRATE_KBPS = 24;
const MAX_AUDIO_BITRATE_KBPS = 48;
const CONTAINER_HEADROOM = 0.9;

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        ...(import.meta.env.DEV ? { classWorkerURL } : {}),
        coreURL,
        wasmURL,
      });
      return ffmpeg;
    })().catch((error) => {
      ffmpegPromise = null;
      throw error;
    });
  }
  return ffmpegPromise;
}

function getAudioDuration(file: File, timeoutMs = AUDIO_METADATA_TIMEOUT_MS) {
  return new Promise<number | null>((resolve) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    let settled = false;
    const finish = (duration: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      audio.removeAttribute("src");
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    const timeout = window.setTimeout(() => finish(null), timeoutMs);
    const cleanup = () => {
      const duration = audio.duration;
      finish(Number.isFinite(duration) && duration > 0 ? duration : null);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = cleanup;
    audio.onerror = () => finish(null);
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
  maxOutputBytes = MAX_SYNC_AUDIO_BYTES,
): Promise<CompressedSyncAudio> {
  onProgress?.(0.03);
  const detectedDurationSeconds = await getAudioDuration(file);
  const token = crypto.randomUUID();
  const inputName = `input-${token}.${inputExtension(file)}`;
  const outputName = `sync-${token}.m4a`;
  const ffmpeg = await getFFmpeg();
  onProgress?.(0.12);

  const progressHandler = ({ progress }: { progress: number }) => {
    if (!Number.isFinite(progress)) return;
    onProgress?.(0.12 + Math.min(1, Math.max(0, progress)) * 0.76);
  };
  const logLines: string[] = [];
  const logHandler = ({ message }: { message: string }) => {
    const line = message.trim();
    if (line) logLines.push(line);
    if (logLines.length > 12) logLines.shift();
  };
  ffmpeg.on("progress", progressHandler);
  ffmpeg.on("log", logHandler);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const encode = async (bitrate: number) => {
      try {
        await ffmpeg.deleteFile(outputName);
      } catch {}

      const durationArgs = detectedDurationSeconds
        ? ["-t", detectedDurationSeconds.toFixed(3)]
        : [];
      const exitCode = await ffmpeg.exec([
        "-i",
        inputName,
        "-vn",
        ...durationArgs,
        "-ac",
        "1",
        "-ar",
        "32000",
        "-c:a",
        "aac",
        "-b:a",
        `${bitrate}k`,
        "-movflags",
        "+faststart",
        "-f",
        "mp4",
        outputName,
      ]);
      if (exitCode !== 0) {
        const detail = logLines.at(-1);
        throw new Error(detail ? `Audio compression failed: ${detail}` : "Audio compression failed");
      }

      const output = await ffmpeg.readFile(outputName);
      const bytes = typeof output === "string" ? new TextEncoder().encode(output) : output;
      const blobBytes = new Uint8Array(bytes.byteLength);
      blobBytes.set(bytes);
      return new Blob([blobBytes], { type: "audio/mp4" });
    };

    const initialBitrate = detectedDurationSeconds
      ? Math.max(
          MIN_AUDIO_BITRATE_KBPS,
          Math.min(
            MAX_AUDIO_BITRATE_KBPS,
            Math.floor(
              (maxOutputBytes * 8 * CONTAINER_HEADROOM) /
                detectedDurationSeconds /
                1_000,
            ),
          ),
        )
      : DEFAULT_AUDIO_BITRATE_KBPS;
    let blob = await encode(initialBitrate);
    if (blob.size > maxOutputBytes && initialBitrate > MIN_AUDIO_BITRATE_KBPS) {
      const retryBitrate = Math.max(
        MIN_AUDIO_BITRATE_KBPS,
        Math.floor(initialBitrate * (maxOutputBytes / blob.size) * CONTAINER_HEADROOM),
      );
      blob = await encode(retryBitrate);
    }
    if (blob.size > maxOutputBytes) {
      throw new Error(
        `This compressed sound needs ${Math.ceil(blob.size / 1_000)} KB, but only ${Math.floor(maxOutputBytes / 1_000)} KB is available.`,
      );
    }

    const measuredOutputDuration = await getAudioDuration(
      new File([blob], outputName, { type: "audio/mp4" }),
      3_000,
    );
    const durationSeconds = measuredOutputDuration ?? detectedDurationSeconds;
    if (!durationSeconds) {
      throw new Error("Could not determine the compressed sound duration");
    }
    onProgress?.(1);
    return {
      blob,
      durationSeconds,
      originalDurationSeconds: detectedDurationSeconds ?? durationSeconds,
    };
  } finally {
    ffmpeg.off("progress", progressHandler);
    ffmpeg.off("log", logHandler);
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch {}
  }
}
