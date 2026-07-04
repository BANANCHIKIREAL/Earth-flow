import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  Music,
  Play,
  X,
  Upload,
  RotateCcw,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { BACKGROUNDS, type BackgroundVariant } from "./Background";
import type { FinishSound } from "@/hooks/useFinishSound";
import {
  DEFAULT_DURATIONS,
  MAX_SECONDS,
  MIN_SECONDS,
  type TimerDurations,
} from "@/hooks/useTimer";
import {
  MAX_BLUR,
  MAX_TIMER_FONT_SIZE,
  MAX_TIMER_RING_WIDTH,
  MIN_BLUR,
  MIN_TIMER_FONT_SIZE,
  MIN_TIMER_RING_WIDTH,
  TIMER_FONT_STYLES,
  TIMER_RING_STYLES,
} from "@/hooks/useSettings";
import { toColorInputValue } from "@/lib/color";
import type { translations } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

const MAX_BG_BYTES = 5 * 1024 * 1024;

interface Props {
  open: boolean;
  onClose: () => void;
  userId?: string;
  durations: TimerDurations;
  setDurations: (d: Partial<TimerDurations>) => void;
  lunchEnabled: boolean;
  setLunchEnabled: (enabled: boolean) => void;
  stopSoundsOnTimerEnd: boolean;
  setStopSoundsOnTimerEnd: (enabled: boolean) => void;
  bgVariant: BackgroundVariant;
  setBgVariant: (v: BackgroundVariant) => void;
  bgImage: string | null;
  setBgImage: (img: string | null) => void;
  bgBlur: number;
  setBgBlur: (n: number) => void;
  timerRingStyleId: string;
  customTimerRingColor: string;
  setCustomTimerRingColor: (color: string) => void;
  timerRingWidth: number;
  setTimerRingStyle: (id: string) => void;
  setTimerRingWidth: (n: number) => void;
  timerFontStyleId: string;
  setTimerFontStyle: (id: string) => void;
  timerFontSize: number;
  setTimerFontSize: (n: number) => void;
  finishSounds: FinishSound[];
  selectedFinishSoundId: string;
  customFinishSoundName: string | null;
  onSelectFinishSound: (id: string) => void;
  onUploadFinishSound: (file: File) => void;
  onClearCustomFinishSound: () => void;
  onPreviewFinishSound: () => void;
  notificationPermission: NotificationPermission | "unsupported";
  onRequestNotifications: () => void;
  layout: "classic" | "sidebar";
  setLayout: (l: "classic" | "sidebar") => void;
  copy: typeof translations.en;
}

export function SettingsPanel({
  open,
  onClose,
  userId,
  durations,
  setDurations,
  lunchEnabled,
  setLunchEnabled,
  stopSoundsOnTimerEnd,
  setStopSoundsOnTimerEnd,
  bgVariant,
  setBgVariant,
  bgImage,
  setBgImage,
  bgBlur,
  setBgBlur,
  timerRingStyleId,
  customTimerRingColor,
  setCustomTimerRingColor,
  timerRingWidth,
  setTimerRingStyle,
  setTimerRingWidth,
  timerFontStyleId,
  setTimerFontStyle,
  timerFontSize,
  setTimerFontSize,
  finishSounds,
  selectedFinishSoundId,
  customFinishSoundName,
  onSelectFinishSound,
  onUploadFinishSound,
  onClearCustomFinishSound,
  onPreviewFinishSound,
  notificationPermission,
  onRequestNotifications,
  layout,
  setLayout,
  copy,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadError(null);
    const isLarge = file.size > MAX_BG_BYTES;
    if (userId && !isLarge) {
      setUploading(true);
      const path = `${userId}/bg`;
      const { error } = await supabase.storage
        .from("user-backgrounds")
        .upload(path, file, { upsert: true, contentType: file.type });
      setUploading(false);
      if (error) {
        setUploadError("Upload failed, try again");
        return;
      }
      const { data } = supabase.storage.from("user-backgrounds").getPublicUrl(path);
      setBgImage(data.publicUrl);
    } else {
      if (isLarge) setUploadError("Image over 5 MB — saved locally only, won't sync across devices");
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") setBgImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`settings-panel fixed top-0 z-50 h-full glass transition-transform duration-300 ease-out ${
          layout === "classic"
            ? `right-0 border-l border-border ${open ? "translate-x-0" : "translate-x-full"}`
            : `left-0 border-r border-border ${open ? "translate-x-0" : "-translate-x-full"}`
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {copy.settings}
            </div>
            <h2 className="font-display text-2xl">{copy.yourFocusSpace}</h2>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full glass flex items-center justify-center hover:text-primary transition-colors"
            aria-label={copy.closeSettings}
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-89px)] px-6 py-6 space-y-8">
          {/* Timer */}
          <section className="space-y-4">
            <SectionTitle>{copy.timer}</SectionTitle>
            <TimeStepper
              label={copy.focusTime}
              value={durations.focus}
              onChange={(v) => setDurations({ focus: v })}
            />
            <label className="flex items-center justify-between gap-3 rounded-2xl glass px-4 py-3">
              <span>
                <span className="block text-sm">{copy.lunchAfterTimer}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {copy.lunchDescription}
                </span>
              </span>
              <input
                type="checkbox"
                checked={lunchEnabled}
                onChange={(e) => setLunchEnabled(e.target.checked)}
                className="h-5 w-5 accent-primary cursor-pointer"
                aria-label={copy.enableLunch}
              />
            </label>
            {lunchEnabled && (
              <TimeStepper
                label={copy.lunchTime}
                value={durations.lunch}
                onChange={(v) => setDurations({ lunch: v })}
              />
            )}
            <label className="flex items-center justify-between gap-3 rounded-2xl glass px-4 py-3">
              <span>
                <span className="block text-sm">Stop sounds when timer ends</span>
                <span className="block text-[11px] text-muted-foreground">
                  Ambient music will play only while the timer is running.
                </span>
              </span>
              <input
                type="checkbox"
                checked={stopSoundsOnTimerEnd}
                onChange={(e) => setStopSoundsOnTimerEnd(e.target.checked)}
                className="h-5 w-5 accent-primary cursor-pointer"
                aria-label="Stop sounds when timer ends"
              />
            </label>
            <button
              onClick={() => setDurations(DEFAULT_DURATIONS)}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              <RotateCcw size={12} /> Reset to 25 min
            </button>
          </section>

          {/* Countdown font */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <SectionTitle>{copy.countdownFont}</SectionTitle>
              <span className="text-xs tabular-nums text-muted-foreground">{timerFontSize}px</span>
            </div>
            <div className="grid grid-cols-2 min-[600px]:grid-cols-3 panel:grid-cols-4 gap-2">
              {TIMER_FONT_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setTimerFontStyle(style.id)}
                  className={`h-10 rounded-lg glass px-2 text-center transition-all ${
                    timerFontStyleId === style.id
                      ? "text-foreground glow-ring"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`${style.className} block text-sm leading-none tabular-nums`}>
                    25:00
                  </span>
                  <span className="block text-[8px] uppercase tracking-wide truncate">
                    {style.name}
                  </span>
                </button>
              ))}
            </div>
            <input
              type="range"
              min={MIN_TIMER_FONT_SIZE}
              max={MAX_TIMER_FONT_SIZE}
              step={4}
              value={timerFontSize}
              onChange={(e) => setTimerFontSize(parseInt(e.target.value, 10))}
              className="w-full accent-primary cursor-pointer"
              aria-label="Countdown font size"
            />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{copy.small}</span>
              <span>{copy.large}</span>
            </div>
          </section>

          {/* Timer ring */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <SectionTitle>{copy.timerRing}</SectionTitle>
              <span className="text-xs tabular-nums text-muted-foreground">{timerRingWidth}px</span>
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
              {TIMER_RING_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setTimerRingStyle(style.id)}
                  className={`h-12 rounded-2xl glass px-4 text-sm inline-flex items-center gap-3 text-left transition-all ${
                    timerRingStyleId === style.id
                      ? "text-foreground glow-ring"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full shrink-0"
                    style={{
                      backgroundColor: style.color,
                      boxShadow: `0 0 18px ${style.glow}`,
                    }}
                  />
                  {style.name}
                </button>
              ))}
              <button
                key="custom"
                onClick={() => setTimerRingStyle("custom")}
                className={`relative h-12 rounded-2xl glass px-4 text-sm inline-flex items-center gap-3 text-left transition-all ${
                  timerRingStyleId === "custom"
                    ? "text-foreground glow-ring"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className="h-5 w-5 rounded-full shrink-0"
                  style={{
                    backgroundColor: customTimerRingColor,
                    boxShadow: `0 0 18px ${customTimerRingColor}`,
                  }}
                />
                {copy.customColor}
                <input
                  ref={colorInputRef}
                  type="color"
                  value={toColorInputValue(customTimerRingColor)}
                  onChange={(e) => setCustomTimerRingColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label={copy.customColor}
                />
              </button>
            </div>
            <input
              type="range"
              min={MIN_TIMER_RING_WIDTH}
              max={MAX_TIMER_RING_WIDTH}
              step={1}
              value={timerRingWidth}
              onChange={(e) => setTimerRingWidth(parseInt(e.target.value, 10))}
              className="w-full accent-primary cursor-pointer"
              aria-label="Timer ring width"
            />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{copy.thin}</span>
              <span>{copy.bold}</span>
            </div>
          </section>

          {/* Finish sound */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle>{copy.finishSound}</SectionTitle>
              <button
                onClick={onPreviewFinishSound}
                className="h-8 px-3 rounded-full glass text-xs inline-flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Play size={12} fill="currentColor" />
                {copy.preview}
              </button>
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
              {finishSounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => onSelectFinishSound(sound.id)}
                  className={`h-12 rounded-2xl glass px-4 text-sm inline-flex items-center gap-3 text-left transition-all ${
                    selectedFinishSoundId === sound.id
                      ? "text-foreground glow-ring"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bell size={16} />
                  {sound.name}
                </button>
              ))}
              <button
                onClick={() => {
                  if (customFinishSoundName) onSelectFinishSound("custom");
                  else audioFileRef.current?.click();
                }}
                className={`h-12 rounded-2xl glass px-4 text-sm inline-flex items-center gap-3 text-left transition-all ${
                  selectedFinishSoundId === "custom"
                    ? "text-foreground glow-ring"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Music size={16} />
                <span className="min-w-0 truncate">
                  {customFinishSoundName ?? copy.customAudio}
                </span>
              </button>
            </div>
            <input
              ref={audioFileRef}
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadFinishSound(f);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => audioFileRef.current?.click()}
                className="h-10 px-4 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <Upload size={14} />
                {copy.uploadAudio}
              </button>
              {customFinishSoundName && (
                <button
                  onClick={onClearCustomFinishSound}
                  className="h-10 px-4 rounded-full glass text-sm inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <RotateCcw size={14} /> {copy.resetCustom}
                </button>
              )}
            </div>
            <button
              onClick={onRequestNotifications}
              disabled={notificationPermission === "granted" || notificationPermission === "unsupported"}
              className="h-10 w-full rounded-full glass text-sm inline-flex items-center justify-center gap-2 hover:text-primary transition-colors disabled:cursor-default disabled:text-muted-foreground"
            >
              <BellRing size={14} />
              {notificationPermission === "granted"
                ? copy.notificationsEnabled
                : notificationPermission === "denied"
                  ? copy.notificationsBlocked
                  : notificationPermission === "unsupported"
                    ? copy.notificationsUnsupported
                    : copy.enableNotifications}
            </button>
          </section>

          {/* Atmosphere */}
          <section className="space-y-4">
            <SectionTitle>{copy.atmosphere}</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBgVariant(b.id);
                    setBgImage(null);
                  }}
                  className={`h-9 px-4 rounded-full text-xs glass transition-all ${
                    bgVariant === b.id && !bgImage
                      ? "text-foreground glow-ring"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </section>

          {/* Custom image */}
          <section className="space-y-4">
            <SectionTitle>{copy.customBackground}</SectionTitle>

            <div
              className="aspect-video w-full rounded-2xl overflow-hidden glass flex items-center justify-center relative"
              style={
                bgImage
                  ? {
                      backgroundImage: `url(${bgImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              {!bgImage && (
                <span className="text-xs text-muted-foreground">{copy.noImageSelected}</span>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { if (!uploading) fileRef.current?.click(); }}
                disabled={uploading}
                className="flex-1 h-10 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Uploading…" : bgImage ? copy.changeBackground : copy.uploadImage}
              </button>
              {bgImage && !uploading && (
                <button
                  onClick={() => { setBgImage(null); setUploadError(null); }}
                  className="h-10 px-4 rounded-full glass text-sm inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <RotateCcw size={14} /> {copy.reset}
                </button>
              )}
            </div>
            {uploadError && (
              <p className="text-xs text-yellow-400/80">{uploadError}</p>
            )}
          </section>

          {/* Background blur */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <SectionTitle>{copy.backgroundBlur}</SectionTitle>
              <span className="text-xs tabular-nums text-muted-foreground">{bgBlur}px</span>
            </div>
            <input
              type="range"
              min={MIN_BLUR}
              max={MAX_BLUR}
              step={1}
              value={bgBlur}
              onChange={(e) => setBgBlur(parseInt(e.target.value, 10))}
              className="w-full accent-primary cursor-pointer"
              aria-label="Background blur"
            />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{copy.sharp}</span>
              <span>{copy.dreamy}</span>
            </div>
          </section>

          {/* Layout */}
          <section className="space-y-3">
            <SectionTitle>Layout</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLayout("classic")}
                className={`rounded-2xl glass p-3 text-left transition-all space-y-2.5 ${layout === "classic" ? "glow-ring text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <div className="space-y-1 opacity-60">
                  <div className="h-1 w-full rounded-sm bg-current" />
                  <div className="flex gap-1">
                    <div className="flex-1 h-5 rounded-sm bg-current opacity-70" />
                    <div className="flex-1 h-5 rounded-sm bg-current opacity-70" />
                  </div>
                  <div className="h-2 w-full rounded-sm bg-current opacity-50" />
                </div>
                <div className="text-xs font-medium">Classic</div>
              </button>
              <button
                onClick={() => setLayout("sidebar")}
                className={`rounded-2xl glass p-3 text-left transition-all space-y-2.5 ${layout === "sidebar" ? "glow-ring text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <div className="flex gap-1 h-8 opacity-60">
                  <div className="w-3 rounded-sm bg-current opacity-80" />
                  <div className="flex-1 rounded-sm bg-current opacity-50" />
                  <div className="w-4 rounded-sm bg-current opacity-70" />
                </div>
                <div className="text-xs font-medium">Sidebar</div>
              </button>
            </div>
          </section>

        </div>
      </aside>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
      {children}
    </div>
  );
}


function MinuteStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState<string>(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    if (raw === "") {
      onChange(MIN_SECONDS);
      setDraft(String(MIN_SECONDS));
      return;
    }
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, n));
    onChange(clamped);
    setDraft(String(clamped));
  };

  const dec = () => onChange(Math.max(MIN_SECONDS, value - 1));
  const inc = () => onChange(Math.min(MAX_SECONDS, value + 1));

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm">{label}</div>
        <div className="text-[11px] text-muted-foreground">
          {Math.ceil(MIN_SECONDS / 60)}–{Math.floor(MAX_SECONDS / 60)} minutes
        </div>
      </div>
      <div className="flex items-center gap-1 glass rounded-full p-1">
        <button
          onClick={dec}
          className="h-8 w-8 rounded-full hover:bg-foreground/10 flex items-center justify-center"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={14} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="w-14 bg-transparent text-center text-sm tabular-nums focus:outline-none"
        />
        <button
          onClick={inc}
          className="h-8 w-8 rounded-full hover:bg-foreground/10 flex items-center justify-center"
          aria-label={`Increase ${label}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function TimeStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  const [draftMin, setDraftMin] = useState<string>(String(minutes));
  const [draftSec, setDraftSec] = useState<string>(String(seconds).padStart(2, "0"));

  useEffect(() => {
    setDraftMin(String(Math.floor(value / 60)));
    setDraftSec(String(value % 60).padStart(2, "0"));
  }, [value]);

  const commit = (minStr: string, secStr: string) => {
    const min = minStr === "" ? 0 : parseInt(minStr, 10);
    const sec = secStr === "" ? 0 : parseInt(secStr, 10);
    if (Number.isNaN(min) || Number.isNaN(sec)) return;
    const totalSec = Math.max(MIN_SECONDS, min * 60 + Math.min(59, sec));
    const clamped = Math.min(MAX_SECONDS, totalSec);
    onChange(clamped);
    setDraftMin(String(Math.floor(clamped / 60)));
    setDraftSec(String(clamped % 60).padStart(2, "0"));
  };

  const handleMinChange = (val: string) => {
    setDraftMin(val.replace(/[^0-9]/g, ""));
  };

  const handleSecChange = (val: string) => {
    setDraftSec(val.replace(/[^0-9]/g, "").slice(0, 2));
  };

  const decMin = () => {
    if (minutes > 0) {
      const newValue = value - 60;
      onChange(Math.max(MIN_SECONDS, newValue));
    }
  };

  const incMin = () => {
    const newValue = value + 60;
    onChange(Math.min(MAX_SECONDS, newValue));
  };

  const decSec = () => {
    const newValue = value - 1;
    onChange(Math.max(MIN_SECONDS, newValue));
  };

  const incSec = () => {
    const newValue = value + 1;
    onChange(Math.min(MAX_SECONDS, newValue));
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm">{label}</div>
      </div>
      <div className="flex items-center gap-2 glass rounded-full p-1">
        <button
          onClick={decMin}
          className="h-8 w-8 rounded-full hover:bg-foreground/10 flex items-center justify-center"
          aria-label="Decrease minutes"
        >
          <Minus size={14} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draftMin}
          onChange={(e) => handleMinChange(e.target.value)}
          onBlur={() => commit(draftMin, draftSec)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(draftMin, draftSec);
          }}
          className="w-10 bg-transparent text-center text-sm tabular-nums focus:outline-none"
          placeholder="0"
        />
        <span className="text-xs text-muted-foreground px-1">m</span>
        <button
          onClick={incMin}
          className="h-8 w-8 rounded-full hover:bg-foreground/10 flex items-center justify-center"
          aria-label="Increase minutes"
        >
          <Plus size={14} />
        </button>

        <div className="w-px h-6 bg-foreground/10 mx-1" />

        <button
          onClick={decSec}
          className="h-8 w-8 rounded-full hover:bg-foreground/10 flex items-center justify-center"
          aria-label="Decrease seconds"
        >
          <Minus size={14} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draftSec}
          onChange={(e) => handleSecChange(e.target.value)}
          onBlur={() => commit(draftMin, draftSec)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(draftMin, draftSec);
          }}
          className="w-10 bg-transparent text-center text-sm tabular-nums focus:outline-none"
          placeholder="00"
        />
        <span className="text-xs text-muted-foreground px-1">s</span>
        <button
          onClick={incSec}
          className="h-8 w-8 rounded-full hover:bg-foreground/10 flex items-center justify-center"
          aria-label="Increase seconds"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
