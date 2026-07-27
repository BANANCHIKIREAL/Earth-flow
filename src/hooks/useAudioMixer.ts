import { useCallback, useEffect, useRef, useState } from "react";

export type SoundIconType =
  | "rain"
  | "thunder"
  | "cloudLightning"
  | "forest"
  | "waves"
  | "fire"
  | "birds"
  | "night"
  | "stream"
  | "cafe"
  | "wind"
  | "book"
  | "bug"
  | "sun"
  | "savannah"
  | "plane"
  | "mountain"
  | "bell"
  | "leaf"
  | "default";

export interface SoundTrack {
  id: string;
  name: string;
  icon: SoundIconType;
  src: string;
  volume: number;
  enabled: boolean;
}

export const AMBIENT_SOUNDS: SoundTrack[] = [
  {
    id: "strong-wave",
    name: "Strong Wave",
    icon: "waves",
    src: "/sounds/strong-ocean-waves.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "mountain-wind",
    name: "Mountain Wind",
    icon: "mountain",
    src: "/sounds/mountain-wind.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "jungle",
    name: "Jungle Night",
    icon: "night",
    src: "/sounds/jungle-night.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "rain-thunder",
    name: "Rain & Thunder",
    icon: "rain",
    src: "/sounds/rain-and-thunder.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "ireland-wind",
    name: "Ireland Grassland Wind",
    icon: "wind",
    src: "/sounds/irish-grassland-wind.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "horse-ride",
    name: "Horse Ride",
    icon: "bell",
    src: "/sounds/horse-ride-wind-chimes.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "forest",
    name: "Forest Ambience",
    icon: "forest",
    src: "/sounds/forest-birds.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "night-field",
    name: "Night Field",
    icon: "night",
    src: "/sounds/night-field.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "birds",
    name: "Birds",
    icon: "birds",
    src: "/sounds/blackbirds.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "savannah",
    name: "Savannah",
    icon: "savannah",
    src: "/sounds/savannah.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "airplane-cabin",
    name: "Airplane Cabin",
    icon: "plane",
    src: "/sounds/airplane-cabin.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "crickets",
    name: "Crickets",
    icon: "bug",
    src: "/sounds/crickets.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "owl",
    name: "Owl",
    icon: "night",
    src: "/sounds/owl-and-water.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "medium-waves",
    name: "Medium Waves",
    icon: "waves",
    src: "/sounds/calm-waves.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "book-pages",
    name: "Book Pages",
    icon: "book",
    src: "/sounds/book-pages.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "gentle-wave",
    name: "Gentle Wave",
    icon: "waves",
    src: "/sounds/gentle-waves.mp3",
    volume: 0.75,
    enabled: false,
  },
  {
    id: "morning",
    name: "Morning Birds",
    icon: "sun",
    src: "/sounds/dawn-birds.mp3",
    volume: 0.75,
    enabled: false,
  },
];

// Volume multiplier to boost all sounds significantly
const VOLUME_MULTIPLIER = 1.8;

export function useAudioMixer() {
  const [tracks, setTracks] = useState<SoundTrack[]>(AMBIENT_SOUNDS);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    tracks.forEach((t) => {
      if (!t.src) return;
      let el = audioRefs.current[t.id];
      if (!el) {
        el = new Audio(t.src);
        el.loop = true;
        audioRefs.current[t.id] = el;
      }
      el.volume = Math.min(1, t.volume * VOLUME_MULTIPLIER);
      if (t.enabled) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [tracks]);

  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((a) => a.pause());
    };
  }, []);

  const toggle = useCallback((id: string) => {
    setTracks((ts) => ts.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  }, []);

  const setVolume = useCallback((id: string, volume: number) => {
    setTracks((ts) => ts.map((t) => (t.id === id ? { ...t, volume } : t)));
  }, []);

  const stopAll = useCallback(() => {
    setTracks((ts) => ts.map((t) => ({ ...t, enabled: false })));
  }, []);

  return { tracks, toggle, setVolume, stopAll };
}
