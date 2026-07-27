import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BellRing,
  Bird,
  BookOpen,
  Bug,
  Cloud,
  CloudRain,
  Flame,
  Image,
  Leaf,
  ListTodo,
  Mountain,
  Moon,
  Music,
  PieChart,
  Plane,
  Play,
  Sparkles,
  Sun,
  Timer,
  TreeDeciduous,
  Waves,
  Wind,
} from "lucide-react";
import { BACKGROUNDS, Background, type BackgroundVariant } from "@/components/Background";
import { useAuth } from "@/context/AuthContext";
import { AMBIENT_SOUNDS, type SoundIconType } from "@/hooks/useAudioMixer";
import { APP_VERSION_LABEL } from "@/lib/version";

const KEY_BG_VARIANT = "focus-space:bg-variant";

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [{ title: "Earth Flow — Your calm focus space" }] }),
  component: WelcomePage,
});

const SOUND_ICONS: Record<SoundIconType, typeof Music> = {
  rain: CloudRain,
  thunder: CloudRain,
  cloudLightning: CloudRain,
  forest: TreeDeciduous,
  waves: Waves,
  fire: Flame,
  birds: Bird,
  night: Moon,
  stream: Waves,
  cafe: Music,
  wind: Wind,
  book: BookOpen,
  bug: Bug,
  sun: Sun,
  savannah: Leaf,
  plane: Plane,
  mountain: Mountain,
  bell: BellRing,
  leaf: Leaf,
  default: Music,
};

const SOUNDS = AMBIENT_SOUNDS.map(({ icon, name }) => ({
  icon: SOUND_ICONS[icon],
  name,
}));

const PRESET_SWATCHES: BackgroundVariant[] = BACKGROUNDS.map(({ id }) => id);

const SOUND_COUNT = SOUNDS.length;
const BACKGROUND_COUNT = PRESET_SWATCHES.length;

const FEATURES: {
  icon: typeof Music;
  title: string;
  text: string;
}[] = [
  {
    icon: Music,
    title: "Ambient Sound Mixer",
    text: `${SOUND_COUNT} layered ambient sounds with individual volume controls, plus your own locally saved tracks.`,
  },
  {
    icon: Timer,
    title: "Focus Timer",
    text: "Configurable Pomodoro with optional lunch break, custom ring styles and fonts.",
  },
  {
    icon: ListTodo,
    title: "Daily Tasks",
    text: "Task list with categories, live time tracking, and completion history.",
  },
  {
    icon: PieChart,
    title: "Time Analytics",
    text: "Donut chart showing time spent per category — day, week, month, or year.",
  },
  {
    icon: Image,
    title: "Backgrounds",
    text: `${BACKGROUND_COUNT} atmosphere presets, plus custom image upload, adjustable blur, and account sync.`,
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    text: "Settings, tasks, and custom backgrounds sync across devices. Your music stays local unless you enable private compressed cloud copies.",
  },
  {
    icon: Flame,
    title: "Streak System",
    text: "Daily visit streak with a flame badge that grows the longer you keep it.",
  },
  {
    icon: Sparkles,
    title: "Interactive Tutorial",
    text: "Spotlight-guided onboarding tour covering all key features.",
  },
];

/* ── Starfield overlay ── */
function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const stars = Array.from({ length: 110 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      tw: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.35 + 0.08,
      drift: (Math.random() - 0.5) * 0.008,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.x = (s.x + s.drift / 100 + 1) % 1;
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.sp + s.tw));
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 235, 245, ${a})`;
        ctx.fill();
      }
      t += 0.016;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 opacity-70"
      aria-hidden
    />
  );
}

/* ── Tilt wrapper for the timer card ── */
function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(700px) rotateY(0deg) rotateX(0deg)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="transition-transform duration-200 ease-out will-change-transform"
    >
      {children}
    </div>
  );
}

const MOCK_TOTAL = 25 * 60;

function TimerMock() {
  const R = 88;
  const C = 2 * Math.PI * R;
  const [left, setLeft] = useState(18 * 60 + 34);

  useEffect(() => {
    const id = setInterval(() => {
      setLeft((s) => (s <= 1 ? MOCK_TOTAL : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const progress = 1 - left / MOCK_TOTAL;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
        <circle
          cx="110" cy="110" r={R}
          fill="none"
          stroke="oklch(1 0 0 / 0.08)"
          strokeWidth="4"
        />
        <circle
          cx="110" cy="110" r={R}
          fill="none"
          stroke="oklch(0.82 0.12 200)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * progress}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          style={{ filter: "drop-shadow(0 0 10px oklch(0.82 0.12 200 / 0.7))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl tabular-nums text-foreground">
          {mm}:{ss}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Deep focus
        </span>
      </div>
    </div>
  );
}

/* ── Fake equalizer under the timer ── */
function Equalizer() {
  return (
    <div className="ef-eq mt-6 flex h-8 items-end justify-center gap-[3px]">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary/60"
          style={{
            height: `${30 + Math.round(60 * Math.abs(Math.sin(i * 0.9)))}%`,
            animationDelay: `${(i % 8) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("ef-revealed");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function WelcomePage() {
  useReveal();

  const { user } = useAuth();
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const avatarLetter = (displayName || user?.email || "?").charAt(0).toUpperCase();

  const [bg, setBg] = useState<BackgroundVariant>(() => {
    if (typeof window === "undefined") return "galaxy";
    const saved = localStorage.getItem(KEY_BG_VARIANT) as BackgroundVariant | null;
    return saved && PRESET_SWATCHES.includes(saved) ? saved : "galaxy";
  });

  const [vanished, setVanished] = useState<Set<BackgroundVariant>>(new Set());

  const enterApp = () => {
    try { sessionStorage.setItem("ef-app-entered", "1"); } catch {}
  };

  const applyBg = (v: BackgroundVariant) => {
    setBg(v);
    try { localStorage.setItem(KEY_BG_VARIANT, v); } catch {}
    setVanished((prev) => new Set(prev).add(v));
    setTimeout(() => {
      setVanished((prev) => {
        const next = new Set(prev);
        next.delete(v);
        return next;
      });
    }, 5000);
  };

  return (
    <div className="dark relative min-h-screen overflow-x-hidden text-foreground">
      <style>{`
        @keyframes ef-fade-up {
          from { opacity: 0; transform: translateY(26px); }
          to { opacity: 1; transform: none; }
        }
        .ef-in { opacity: 0; animation: ef-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .ef-in-1 { animation-delay: 0.05s; }
        .ef-in-2 { animation-delay: 0.18s; }
        .ef-in-3 { animation-delay: 0.32s; }
        .ef-in-4 { animation-delay: 0.46s; }
        .ef-in-5 { animation-delay: 0.6s; }

        [data-reveal] {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ef-revealed { opacity: 1 !important; transform: none !important; }

        @keyframes ef-shimmer { to { background-position: -200% center; } }
        .ef-title {
          display: inline-block;
          background: linear-gradient(
            100deg,
            oklch(0.97 0.005 220) 35%,
            oklch(0.82 0.12 200) 50%,
            oklch(0.97 0.005 220) 65%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: ef-shimmer 7s linear infinite;
        }

        @keyframes ef-eq-bounce {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .ef-eq span {
          transform-origin: bottom;
          animation: ef-eq-bounce 1.15s ease-in-out infinite;
        }

        @keyframes ef-marquee { to { transform: translateX(-50%); } }
        .ef-marquee-track {
          width: max-content;
          animation: ef-marquee 36s linear infinite;
        }
        .ef-marquee-track:hover { animation-play-state: paused; }

        @keyframes ef-glow-pulse {
          0%, 100% { box-shadow: 0 0 22px oklch(0.82 0.12 200 / 0.18); }
          50% { box-shadow: 0 0 46px oklch(0.82 0.12 200 / 0.42); }
        }
        .ef-cta-glow { animation: ef-glow-pulse 3.2s ease-in-out infinite; }

        @keyframes ef-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .ef-float { animation: ef-float 6s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .ef-in, .ef-title, .ef-eq span, .ef-marquee-track, .ef-cta-glow, .ef-float {
            animation: none !important;
          }
          .ef-in { opacity: 1; }
          [data-reveal] { opacity: 1; transform: none; transition: none; }
        }
      `}</style>

      <Background variant={bg} />
      <Starfield />

      <div className="relative z-10">
        {/* Nav */}
        <header className="ef-in ef-in-1 flex w-full items-center justify-between px-6 py-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl tracking-tight">Earth Flow</span>
            <span className="text-[10px] text-muted-foreground/50 tabular-nums">
              {APP_VERSION_LABEL}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <a
                href="/"
                className="flex items-center gap-2.5 rounded-full glass py-1.5 pl-1.5 pr-4 hover:bg-white/[0.08] transition-colors"
                title="Open app"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[11px] font-semibold">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </span>
                <span className="max-w-[150px] truncate text-sm text-muted-foreground">
                  {displayName || user.email}
                </span>
                <ArrowRight size={13} className="text-muted-foreground" />
              </a>
            ) : (
              <>
                <a
                  href="/login"
                  className="h-9 px-4 rounded-full glass text-sm inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </a>
                <a
                  href="/register"
                  className="h-9 px-4 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center hover:scale-[1.03] transition-transform"
                >
                  Sign up
                </a>
              </>
            )}
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto grid w-full max-w-5xl items-center gap-12 px-6 pt-14 pb-16 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="ef-in ef-in-2 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              earthflow.pro
            </div>
            <h1 className="ef-in ef-in-3 mt-6 font-display text-5xl leading-[1.08] tracking-tight md:text-6xl">
              <span className="ef-title">
                Your calm
                <br />
                focus space
              </span>
            </h1>
            <p className="ef-in ef-in-4 mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Ambient sound mixer, Pomodoro timer, task tracker, and time
              analytics — in one minimal interface designed for deep work.
            </p>
            <div className="ef-in ef-in-5 mt-8 flex flex-wrap items-center gap-3">
              <a
                href="/"
                onClick={enterApp}
                className="ef-cta-glow h-11 px-6 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center gap-2 hover:scale-[1.04] transition-transform"
              >
                <Play size={14} fill="currentColor" /> Start focusing
              </a>
              <span className="text-xs text-muted-foreground/60">
                Free · No account required to try
              </span>
            </div>
            <div className="ef-in ef-in-5 mt-10 flex gap-8 text-center">
              <div>
                <div className="font-display text-2xl">{SOUND_COUNT}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sounds</div>
              </div>
              <div>
                <div className="font-display text-2xl">{BACKGROUND_COUNT}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Atmospheres</div>
              </div>
              <div>
                <div className="font-display text-2xl">∞</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Focus</div>
              </div>
            </div>
          </div>

          <div className="ef-in ef-in-4 hidden justify-center md:flex">
            <div className="ef-float">
              <TiltCard>
                <div className="glass rounded-[2.5rem] p-10 glow-ring">
                  <TimerMock />
                  <Equalizer />
                </div>
              </TiltCard>
            </div>
          </div>
        </section>

        {/* Sounds marquee */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-16" data-reveal>
          <div className="mb-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Sounds included
          </div>
          <div
            className="overflow-hidden"
            style={{
              maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
            }}
          >
            <div className="ef-marquee-track flex gap-3 pr-3">
              {[...SOUNDS, ...SOUNDS].map((s, i) => (
                <span
                  key={`${s.name}-${i}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full glass px-4 py-2 text-xs text-muted-foreground"
                >
                  <s.icon size={13} className="text-primary" />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-20" data-reveal>
          <div className="mb-8 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Everything for deep work
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                data-reveal
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="group glass h-full rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.07]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-foreground transition-all duration-300 group-hover:bg-primary/20 group-hover:text-primary group-hover:scale-110">
                    <f.icon size={18} />
                  </span>
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold">{f.title}</h3>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {f.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Backgrounds strip */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-20" data-reveal>
          <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Pick your atmosphere
          </div>
          <p className="mb-6 text-xs text-muted-foreground/60">
            Click a tile — the page changes live. Your choice carries into the app.
          </p>
          <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-7 lg:grid-cols-10">
            {PRESET_SWATCHES.map((v) => (
              <button
                key={v}
                onClick={() => applyBg(v)}
                className={`aspect-square rounded-2xl border bg-${v} transition-all duration-700 cursor-pointer ${
                  vanished.has(v)
                    ? "opacity-0 translate-y-7 scale-75 pointer-events-none"
                    : "opacity-100 hover:scale-110 hover:rotate-2"
                } ${
                  bg === v ? "border-white/70 glow-ring" : "border-white/10"
                }`}
                title={v}
                aria-label={`Apply ${v} background`}
              />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-24" data-reveal>
          <div className="glass relative overflow-hidden rounded-[2.5rem] px-8 py-16 text-center">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 70% at 50% 100%, oklch(0.82 0.12 200 / 0.12), transparent 70%)",
              }}
            />
            <h2 className="font-display text-3xl tracking-tight md:text-4xl">
              Ready to focus?
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
              Open the app, mix your sounds, set the timer — and let the world
              fade out.
            </p>
            <a
              href="/"
              onClick={enterApp}
              className="ef-cta-glow relative mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background hover:scale-[1.04] transition-transform"
            >
              Open Earth Flow <ArrowRight size={14} />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="mx-auto flex w-full max-w-5xl items-center justify-center px-6 pb-10 text-xs text-muted-foreground/50">
          <span>Earth Flow · {APP_VERSION_LABEL}</span>
        </footer>
      </div>
    </div>
  );
}
