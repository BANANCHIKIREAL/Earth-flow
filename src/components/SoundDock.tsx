import { Music, Plus, Trash2, VolumeX } from "lucide-react";
import { useState } from "react";
import { SoundMixer } from "./SoundMixer";
import { AddTrackModal } from "./AddTrackModal";
import type { SoundTrack } from "@/hooks/useAudioMixer";
import type { CustomTrack } from "@/hooks/useCustomTracks";
import type { translations } from "@/lib/i18n";

interface Props {
  activeCount: number;
  tracks: SoundTrack[];
  onToggleTrack: (id: string) => void;
  onVolumeTrack: (id: string, volume: number) => void;
  onStopAll: () => void;
  customTracks: CustomTrack[];
  onCustomToggle: (id: string) => void;
  onCustomVolume: (id: string, volume: number) => void;
  onCustomRemove: (id: string) => void;
  onAddFromFile: (file: File) => Promise<void>;
  copy: typeof translations.en;
}

export function SoundDock({
  activeCount,
  tracks,
  onToggleTrack,
  onVolumeTrack,
  onStopAll,
  customTracks,
  onCustomToggle,
  onCustomVolume,
  onCustomRemove,
  onAddFromFile,
  copy,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);

  const totalActive = activeCount + customTracks.filter((t) => t.enabled).length;

  return (
    <section className="w-full">
      <div className="mx-auto max-w-5xl glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {copy.soundMixer}
            </div>
            <div className="text-sm">
              {totalActive > 0 ? `${totalActive} ${copy.active}` : copy.ready}
            </div>
          </div>
          {totalActive > 0 && (
            <button
              onClick={onStopAll}
              className="h-9 px-3 rounded-full glass text-xs inline-flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <VolumeX size={14} />
              {copy.mute}
            </button>
          )}
        </div>

        <div className="border-t border-border p-3 md:p-4 space-y-3">
          <SoundMixer
            tracks={tracks}
            onToggle={onToggleTrack}
            onVolume={onVolumeTrack}
            compact
          />

          <div className="border-t border-border" />

          {/* Custom tracks + add button row */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {customTracks.map((t) => (
              <CustomSoundCard
                key={t.id}
                track={t}
                onToggle={onCustomToggle}
                onVolume={onCustomVolume}
                onRemove={onCustomRemove}
              />
            ))}
            <AddSoundCard onClick={() => setAddOpen(true)} />
          </div>
        </div>
      </div>

      <AddTrackModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAddFromFile={onAddFromFile}
      />
    </section>
  );
}

function AddSoundCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="group relative glass rounded-3xl p-3 min-h-24 flex flex-col items-center justify-center gap-2 hover:shadow-lg hover:border-primary/40 hover:text-primary transition duration-300 ease-out border-2 border-dashed border-border/40 text-muted-foreground"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white group-hover:bg-primary/20 transition duration-300">
        <Plus className="h-5 w-5" />
      </span>
      <div className="text-center">
        <div className="text-xs font-semibold text-foreground/80">Своя музыка</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Добавить</div>
      </div>
    </button>
  );
}

function CustomSoundCard({
  track,
  onToggle,
  onVolume,
  onRemove,
}: {
  track: CustomTrack;
  onToggle: (id: string) => void;
  onVolume: (id: string, v: number) => void;
  onRemove: (id: string) => void;
}) {
  const waveDelays = [0, 120, 240];

  return (
    <div
      className={`group relative glass rounded-3xl transition duration-300 ease-out overflow-hidden p-3 min-h-24 ${
        track.enabled ? "glow-ring shadow-xl" : "hover:shadow-lg hover:border-foreground/20"
      }`}
    >
      <button
        onClick={() => onRemove(track.id)}
        className="absolute top-2 right-2 h-5 w-5 rounded-full bg-foreground/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all z-10"
        title="Удалить"
        type="button"
      >
        <Trash2 size={10} />
      </button>

      <button
        onClick={() => onToggle(track.id)}
        className="flex w-full items-center gap-2 text-left transition-transform duration-200 ease-out active:scale-[0.98]"
        type="button"
      >
        <div
          className={`relative rounded-xl flex items-center justify-center h-9 w-9 transition duration-300 ease-out flex-shrink-0 ${
            track.enabled ? "bg-primary/20" : "bg-foreground/5"
          }`}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white">
            <Music className="h-5 w-5" />
          </span>
          {track.enabled && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate pr-4" title={track.name}>{track.name}</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{track.enabled ? "Playing" : "Idle"}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5">{Math.round(track.volume * 100)}%</span>
            </div>
            <div className="flex items-end gap-1">
              {waveDelays.map((delay) => (
                <span
                  key={delay}
                  className={`h-3 w-1 rounded-full ${
                    track.enabled ? "bg-white/60 animate-sound-wave" : "bg-white/10"
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
