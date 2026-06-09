import { useEffect } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { TimerFontStyle, TimerRingStyle } from "@/hooks/useSettings";
import { useTimer, type TimerDurations, type TimerPhase } from "@/hooks/useTimer";
import type { translations } from "@/lib/i18n";

function format(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function Timer({
  durations,
  lunchEnabled,
  onComplete,
  ringStyle,
  ringWidth,
  fontStyle,
  fontSize,
  copy,
}: {
  durations: TimerDurations;
  lunchEnabled: boolean;
  onComplete?: (phase: TimerPhase) => void;
  ringStyle: TimerRingStyle;
  ringWidth: number;
  fontStyle: TimerFontStyle;
  fontSize: number;
  copy: typeof translations.en;
}) {
  const { phase, remaining, running, total, start, pause, reset } = useTimer(
    durations,
    lunchEnabled,
    onComplete,
  );
  const progress = total > 0 ? 1 - remaining / total : 0;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = `${format(remaining)} • Earth Flow`;
  }, [remaining]);

  // viewBox-based responsive sizing; padding inside viewBox keeps neon glow visible
  const VB = 400;
  const stroke = ringWidth;
  const pad = 18; // space for drop-shadow glow
  const r = VB / 2 - stroke / 2 - pad;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-8 select-none w-full">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {phase === "focus" ? copy.deepFocus : copy.lunchBreak}
      </div>

      <div className="relative w-[min(78vw,360px)] aspect-square">
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          className="w-full h-full -rotate-90 overflow-visible"
        >
          <circle
            cx={VB / 2}
            cy={VB / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            style={{ stroke: "oklch(1 0 0 / 0.08)" }}
          />
          <circle
            cx={VB / 2}
            cy={VB / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
            style={{
              stroke: ringStyle.color,
              filter: `drop-shadow(0 0 ${ringWidth * 4}px ${ringStyle.glow})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`${fontStyle.className} leading-none tabular-nums`}
            style={{ fontSize: `clamp(3.5rem, 16vw, ${fontSize / 16}rem)` }}
          >
            {format(remaining)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="h-12 w-12 rounded-full glass flex items-center justify-center hover:text-primary transition-colors"
          aria-label={copy.resetTimer}
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={running ? pause : start}
          className="h-16 w-16 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform glow-ring"
          aria-label={running ? copy.pause : copy.start}
        >
          {running ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
        </button>
        <div className="h-12 w-12" />
      </div>
    </div>
  );
}
