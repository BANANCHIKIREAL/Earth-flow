import type { LucideIcon } from "lucide-react";
import { Bell, BookOpen, Bug, Bird, CloudLightning, CloudRain, Coffee, Droplet, Flame, Moon, Mountain, Plane, Leaf, Speaker, Sun, TreeDeciduous, Waves, Wind, Zap } from "lucide-react";
import type { SoundTrack, SoundIconType } from "@/hooks/useAudioMixer";

interface Props {
  tracks: SoundTrack[];
  onToggle: (id: string) => void;
  onVolume: (id: string, v: number) => void;
  compact?: boolean;
}

const SOUND_ICONS: Record<SoundIconType, LucideIcon> = {
  rain: CloudRain,
  thunder: Zap,
  cloudLightning: CloudLightning,
  forest: TreeDeciduous,
  waves: Waves,
  fire: Flame,
  birds: Bird,
  night: Moon,
  stream: Droplet,
  cafe: Coffee,
  wind: Wind,
  book: BookOpen,
  bug: Bug,
  sun: Sun,
  savannah: Leaf,
  plane: Plane,
  mountain: Mountain,
  bell: Bell,
  leaf: Leaf,
  default: Speaker,
};

function SoundIcon({ icon }: { icon: SoundIconType }) {
  const IconComponent = SOUND_ICONS[icon] ?? Speaker;

  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white">
      <IconComponent className="h-5 w-5" />
    </span>
  );
}

export function SoundMixer({ tracks, onToggle, onVolume, compact = false }: Props) {
  if (tracks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-background/80 p-6 text-center text-sm text-muted-foreground">
        Add audio files to <span className="font-mono text-xs">/public/sounds</span> and register them in <span className="font-mono text-xs">src/hooks/useAudioMixer.ts</span>.
      </div>
    );
  }

  return (
    <div
      className={`grid gap-3 ${
        compact
          ? "grid-cols-2 sm:grid-cols-3 min-[640px]:grid-cols-5"
          : "grid-cols-1 min-[420px]:grid-cols-2"
      }`}
    >
      {tracks.map((t) => (
        <SoundCard
          key={t.id}
          track={t}
          onToggle={onToggle}
          onVolume={onVolume}
          compact={compact}
        />
      ))}
    </div>
  );
}

function SoundCard({
  track,
  onToggle,
  onVolume,
  compact,
}: {
  track: SoundTrack;
  onToggle: (id: string) => void;
  onVolume: (id: string, v: number) => void;
  compact: boolean;
}) {
  const waveDelays = [0, 120, 240];

  return (
    <div
      className={`group relative glass rounded-3xl transition duration-300 ease-out ${
        compact ? "p-3 min-h-24" : "p-4 min-h-28"
      } ${
        track.enabled ? "glow-ring shadow-xl" : "hover:shadow-lg hover:border-foreground/20"
      }`}
    >
      <button
        onClick={() => onToggle(track.id)}
        className={`flex w-full text-left transition-transform duration-200 ease-out active:scale-[0.98] ${compact ? "items-center gap-2" : "items-center gap-3"}`}
        type="button"
      >
        <div
          className={`relative rounded-xl flex items-center justify-center transition duration-300 ease-out ${
            compact ? "h-9 w-9" : "h-10 w-10"
          } ${
            track.enabled ? "bg-primary/20" : "bg-foreground/5"
          }`}
        >
          <SoundIcon icon={track.icon} />
          {track.enabled && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`${compact ? "text-xs" : "text-sm"} font-semibold truncate`} title={track.name}>
            {track.name}
          </div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{track.enabled ? "Playing" : "Idle"}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5">{Math.round(track.volume * 100)}%</span>
            </div>
            <div className="flex items-end gap-1">
              {waveDelays.map((delay) => (
                <span
                  key={delay}
                  className={`h-3 w-1 rounded-full bg-white/60 ${
                    track.enabled ? "animate-sound-wave" : "bg-white/10"
                  }`}
                  style={track.enabled ? { animationDelay: `${delay}ms` } : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={track.volume}
        onChange={(e) => onVolume(track.id, parseFloat(e.target.value))}
        className="mt-3 w-full accent-primary cursor-pointer"
        aria-label={`${track.name} volume`}
      />
    </div>
  );
}
