import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ef:tutorial_v1";
const PAD = 16;
const CARD_W = 308;

interface Step {
  target?: string;
  title: string;
  desc: string;
  icon: string;
  pos?: "top" | "bottom" | "left" | "right" | "center";
}

const STEPS: Step[] = [
  {
    title: "Welcome to Earth Flow",
    desc: "A calm space built for deep focus. Let's take a quick look around — it takes about 30 seconds.",
    icon: "🌍",
  },
  {
    target: "timer",
    title: "Focus Timer",
    desc: "The glowing ring tracks your session. When it completes, you'll hear a sound and get a notification.",
    icon: "⏱️",
    pos: "right",
  },
  {
    target: "timer-controls",
    title: "Session Controls",
    desc: "Press play to start. The left button resets the timer. The gear icon opens all settings.",
    icon: "▶️",
    pos: "top",
  },
  {
    target: "sound-dock",
    title: "Ambient Sounds",
    desc: "Layer rain, forest, waves, fire and more. Each track has its own volume. Upload your own music too.",
    icon: "🔊",
    pos: "bottom",
  },
  {
    target: "tasks",
    title: "Today's Tasks",
    desc: "Write down what you want to accomplish. Check things off as you go — your progress is tracked.",
    icon: "✅",
    pos: "left",
  },
  {
    title: "You're all set!",
    desc: "Start a session, set the mood with sounds, and get into your flow. Everything saves automatically.",
    icon: "🚀",
  },
];

export function useTutorial() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }, []);

  const restart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShow(true);
  }, []);

  return { show, complete, restart };
}

interface SpotRect { top: number; left: number; width: number; height: number }

function getCardStyle(
  spotlight: SpotRect | null,
  vw: number,
  vh: number,
  forcedPos?: Step["pos"],
): React.CSSProperties {
  const margin = 16;
  const cardH = 240;
  const gap = 16;

  if (forcedPos === "right") {
    if (spotlight) {
      const left = Math.min(spotlight.left + spotlight.width + gap, vw - CARD_W - margin);
      const top = Math.max(margin, spotlight.top);
      return { left, top };
    }
    return { right: margin, top: margin + 60 };
  }
  if (forcedPos === "left") {
    if (spotlight) {
      const left = Math.max(margin, spotlight.left - CARD_W - gap);
      const top = Math.max(margin, Math.min(spotlight.top + spotlight.height / 2 - cardH / 2, vh - cardH - margin));
      return { left, top };
    }
    return { right: margin, top: Math.max(margin, vh / 2 - cardH / 2) };
  }
  if (forcedPos === "top") {
    const hCenter = spotlight ? spotlight.left + spotlight.width / 2 : vw / 2;
    const topVal = spotlight
      ? Math.max(margin, spotlight.top - cardH - gap - 48)
      : margin;
    return { top: topVal, left: Math.max(margin, Math.min(hCenter - CARD_W / 2, vw - CARD_W - margin)) };
  }
  if (forcedPos === "bottom") {
    const hCenter = spotlight ? spotlight.left + spotlight.width / 2 : vw / 2;
    return { bottom: margin, left: Math.max(margin, Math.min(hCenter - CARD_W / 2, vw - CARD_W - margin)) };
  }
  if (forcedPos === "center") {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  if (!spotlight) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  const { top, left, width, height } = spotlight;
  const centeredLeft = Math.max(margin, Math.min(left + width / 2 - CARD_W / 2, vw - CARD_W - margin));

  // below?
  if (vh - (top + height) >= cardH + gap + margin) {
    return { top: top + height + gap, left: centeredLeft };
  }
  // above?
  if (top >= cardH + gap + margin) {
    return { top: top - gap - cardH, left: centeredLeft };
  }
  // right?
  if (vw - (left + width) >= CARD_W + gap + margin) {
    const t = Math.max(margin, Math.min(top + height / 2 - cardH / 2, vh - cardH - margin));
    return { left: left + width + gap, top: t };
  }
  // left?
  if (left >= CARD_W + gap + margin) {
    const t = Math.max(margin, Math.min(top + height / 2 - cardH / 2, vh - cardH - margin));
    return { left: left - gap - CARD_W, top: t };
  }

  // Element fills most of the screen — pin card to top of viewport, centered
  return { top: margin, left: centeredLeft };
}

export function Tutorial({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const [spot, setSpot] = useState<SpotRect | null>(null);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const step = STEPS[current];

  const findTarget = useCallback((target: string): Element | null => {
    const els = Array.from(document.querySelectorAll(`[data-tutorial="${target}"]`));
    return els.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }) ?? null;
  }, []);

  const measure = useCallback(() => {
    const vWidth = window.innerWidth;
    const vHeight = window.innerHeight;
    setVw(vWidth);
    setVh(vHeight);
    const s = STEPS[current];
    if (!s.target) { setSpot(null); return; }
    const el = findTarget(s.target);
    if (!el) { setSpot(null); return; }
    const r = el.getBoundingClientRect();
    // Clamp to visible viewport so spotlight never goes off-screen
    const top    = Math.max(0, r.top);
    const left   = Math.max(0, r.left);
    const bottom = Math.min(vHeight, r.bottom);
    const right  = Math.min(vWidth, r.right);
    if (bottom <= top || right <= left) { setSpot(null); return; }
    setSpot({ top, left, width: right - left, height: bottom - top });
  }, [current, findTarget]);

  // Scroll target into view when step changes, then re-measure after scroll settles
  useEffect(() => {
    const s = STEPS[current];
    if (!s.target) { setSpot(null); return; }
    const el = findTarget(s.target);
    if (!el) { setSpot(null); return; }
    // Always reset scroll to top first so elements near the top are fully visible
    window.scrollTo({ top: 0, behavior: "instant" });
    const r0 = el.getBoundingClientRect();
    const alreadyVisible = r0.top >= 0 && r0.bottom <= window.innerHeight && r0.width > 0;
    if (!alreadyVisible) {
      el.scrollIntoView({ behavior: "instant", block: "start", inline: "nearest" });
    }
    const t = setTimeout(measure, 200);
    return () => clearTimeout(t);
  }, [current, measure, findTarget]);

  // Re-measure on resize and any scroll (captures scrollable panels too)
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  const go = (delta: number) => {
    setCurrent((c) => Math.max(0, Math.min(STEPS.length - 1, c + delta)));
    setAnimKey((k) => k + 1);
  };

  const spotlightRect: SpotRect | null = spot
    ? { top: spot.top - PAD, left: spot.left - PAD, width: spot.width + PAD * 2, height: spot.height + PAD * 2 }
    : null;

  const cardStyle = getCardStyle(spotlightRect, vw, vh, step.pos);

  const isLast = current === STEPS.length - 1;
  const isFirst = current === 0;

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-[200]" style={{ background: spot ? "transparent" : "rgba(0,0,0,0.7)" }}>
        {spot && (
          <div
            className="absolute transition-all duration-300 ease-out"
            style={{
              top: spotlightRect!.top,
              left: spotlightRect!.left,
              width: spotlightRect!.width,
              height: spotlightRect!.height,
              borderRadius: 16,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
              border: "1.5px solid rgba(255,255,255,0.13)",
            }}
          />
        )}
      </div>

      {/* Tutorial card */}
      <div
        className="fixed z-[210] pointer-events-auto"
        style={{ width: CARD_W, ...cardStyle }}
      >
        <div
          key={animKey}
          className="glass rounded-2xl shadow-2xl overflow-hidden"
          style={{ animation: "tutorial-in 0.25s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          {/* Progress bar */}
          <div className="flex gap-1 p-4 pb-0">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-[3px] rounded-full transition-all duration-500"
                style={{
                  flex: i === current ? 2 : 1,
                  background: i <= current
                    ? "var(--color-primary)"
                    : "oklch(1 0 0 / 0.1)",
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <span
                className="text-3xl leading-none shrink-0 mt-0.5"
                style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.3))" }}
              >
                {step.icon}
              </span>
              <div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground mb-0.5">
                  {current + 1} of {STEPS.length}
                </div>
                <h3 className="font-display text-[1.25rem] leading-tight">{step.title}</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-[52px]">
              {step.desc}
            </p>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-border" />

          {/* Actions */}
          <div className="flex items-center gap-2 p-4">
            {isFirst ? (
              <button
                onClick={onComplete}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
              >
                Skip tour
              </button>
            ) : (
              <button
                onClick={() => go(-1)}
                className="h-9 px-4 rounded-full glass text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={isLast ? onComplete : () => go(1)}
              className="h-9 px-5 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: "var(--color-foreground)",
                color: "var(--color-background)",
              }}
            >
              {isLast ? "Let's go! 🎉" : "Next →"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tutorial-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
