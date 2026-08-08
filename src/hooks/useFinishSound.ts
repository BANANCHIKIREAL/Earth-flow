import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { safeStorage } from "@/lib/safe-storage";

export interface FinishSound {
  id: string;
  name: string;
  tone: "bell" | "digital" | "calm";
}

export interface CustomFinishSound {
  name: string;
  dataUrl: string;
}

const KEY_FINISH_SOUND = "focus-space:finish-sound";
const KEY_CUSTOM_FINISH_SOUND = "focus-space:custom-finish-sound";

export const FINISH_SOUNDS: FinishSound[] = [
  { id: "bell", name: "Bell", tone: "bell" },
  { id: "digital", name: "Digital", tone: "digital" },
  { id: "calm", name: "Calm", tone: "calm" },
];

const DEFAULT_FINISH_SOUND = FINISH_SOUNDS[0].id;

function readCustomSound(): CustomFinishSound | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = safeStorage.getItem(KEY_CUSTOM_FINISH_SOUND);
    return raw ? (JSON.parse(raw) as CustomFinishSound) : null;
  } catch {
    return null;
  }
}

function playTone(tone: FinishSound["tone"]) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(0.28, context.currentTime + 0.03);
  master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.35);
  master.connect(context.destination);

  const patterns = {
    bell: [
      { at: 0, freq: 880, duration: 0.8 },
      { at: 0.08, freq: 1320, duration: 0.55 },
    ],
    digital: [
      { at: 0, freq: 740, duration: 0.16 },
      { at: 0.22, freq: 940, duration: 0.16 },
      { at: 0.44, freq: 1180, duration: 0.22 },
    ],
    calm: [
      { at: 0, freq: 523.25, duration: 0.75 },
      { at: 0.28, freq: 659.25, duration: 0.7 },
      { at: 0.56, freq: 783.99, duration: 0.65 },
    ],
  } satisfies Record<FinishSound["tone"], Array<{ at: number; freq: number; duration: number }>>;

  patterns[tone].forEach((note) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + note.at;
    const end = start + note.duration;

    oscillator.type = tone === "digital" ? "square" : "sine";
    oscillator.frequency.setValueAtTime(note.freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.7, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(end + 0.03);
  });

  window.setTimeout(() => void context.close().catch(() => {}), 1600);
}

export function useFinishSound() {
  const [selectedSoundId, setSelectedSoundIdState] = useState(DEFAULT_FINISH_SOUND);
  const [customSound, setCustomSoundState] = useState<CustomFinishSound | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = safeStorage.getItem(KEY_FINISH_SOUND);
    if (stored && (stored === "custom" || FINISH_SOUNDS.some((sound) => sound.id === stored))) {
      setSelectedSoundIdState(stored);
    }
    setCustomSoundState(readCustomSound());
  }, []);

  useEffect(() => {
    if (!customSound) {
      customAudioRef.current = null;
      return;
    }
    customAudioRef.current = new Audio(customSound.dataUrl);
  }, [customSound]);

  const selectedSound = useMemo(
    () => FINISH_SOUNDS.find((sound) => sound.id === selectedSoundId) ?? FINISH_SOUNDS[0],
    [selectedSoundId],
  );

  const setSelectedSoundId = useCallback((id: string) => {
    setSelectedSoundIdState(id);
    try {
      safeStorage.setItem(KEY_FINISH_SOUND, id);
    } catch {}
  }, []);

  const setCustomSound = useCallback((sound: CustomFinishSound | null) => {
    setCustomSoundState(sound);
    try {
      if (sound) safeStorage.setItem(KEY_CUSTOM_FINISH_SOUND, JSON.stringify(sound));
      else safeStorage.removeItem(KEY_CUSTOM_FINISH_SOUND);
    } catch {}
  }, []);

  const uploadCustomSound = useCallback(
    (file: File) => {
      const allowedTypes = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/wave"];
      const allowedExtension = /\.(mp3|wav)$/i.test(file.name);
      if (!allowedTypes.includes(file.type) && !allowedExtension) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") return;
        setCustomSound({ name: file.name, dataUrl: reader.result });
        setSelectedSoundId("custom");
      };
      reader.readAsDataURL(file);
    },
    [setCustomSound, setSelectedSoundId],
  );

  const clearCustomSound = useCallback(() => {
    setCustomSound(null);
    setSelectedSoundId(DEFAULT_FINISH_SOUND);
  }, [setCustomSound, setSelectedSoundId]);

  const playFinishSound = useCallback(() => {
    if (selectedSoundId === "custom" && customSound) {
      const audio = customAudioRef.current ?? new Audio(customSound.dataUrl);
      customAudioRef.current = audio;
      audio.pause();
      audio.currentTime = 0;
      void audio.play().catch(() => playTone("bell"));
      return;
    }

    playTone(selectedSound.tone);
  }, [customSound, selectedSound.tone, selectedSoundId]);

  return {
    finishSounds: FINISH_SOUNDS,
    selectedSoundId,
    customSound,
    setSelectedSoundId,
    uploadCustomSound,
    clearCustomSound,
    playFinishSound,
  };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
