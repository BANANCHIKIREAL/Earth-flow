import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

function EarthGraphic({ className = "w-64 h-64" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" fill="none" className={`${className} text-foreground`}>
      <defs>
        <clipPath id="earth-clip">
          <circle cx="160" cy="160" r="118" />
        </clipPath>
      </defs>

      <style>{`
        @keyframes earth-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes arc-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes globe-breathe {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        .e-meridians {
          transform-origin: 160px 160px;
          animation: earth-spin 22s linear infinite;
        }
        .e-orbit {
          transform-origin: 160px 160px;
          animation: arc-orbit 7s linear infinite;
        }
        .e-border {
          animation: globe-breathe 5s ease-in-out infinite;
        }
      `}</style>

      <circle cx="160" cy="160" r="156" stroke="currentColor" strokeOpacity="0.04" strokeWidth="1" />
      <circle cx="160" cy="160" r="138" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />
      <circle cx="160" cy="160" r="118" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" className="e-border" />

      <g clipPath="url(#earth-clip)" stroke="currentColor" fill="none">
        <line x1="42" y1="100" x2="278" y2="100" strokeOpacity="0.06" strokeWidth="0.75" />
        <line x1="42" y1="130" x2="278" y2="130" strokeOpacity="0.08" strokeWidth="0.75" />
        <line x1="42" y1="160" x2="278" y2="160" strokeOpacity="0.10" strokeWidth="0.75" />
        <line x1="42" y1="190" x2="278" y2="190" strokeOpacity="0.08" strokeWidth="0.75" />
        <line x1="42" y1="220" x2="278" y2="220" strokeOpacity="0.06" strokeWidth="0.75" />
      </g>

      <g clipPath="url(#earth-clip)" stroke="currentColor" fill="none" className="e-meridians">
        <ellipse cx="160" cy="160" rx="16"  ry="118" strokeOpacity="0.07" strokeWidth="0.75" />
        <ellipse cx="160" cy="160" rx="55"  ry="118" strokeOpacity="0.09" strokeWidth="0.75" />
        <ellipse cx="160" cy="160" rx="94"  ry="118" strokeOpacity="0.08" strokeWidth="0.75" />
      </g>

      <g className="e-orbit">
        <path
          d="M 42 160 A 118 118 0 0 1 160 42"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="87" cy="86" r="2.5" fill="currentColor" fillOpacity="0.6" />
      </g>

      <circle cx="160" cy="160" r="2" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark min-h-screen flex animate-page-enter">
      <div className="hidden min-[900px]:flex w-[44%] xl:w-[40%] shrink-0 flex-col items-center justify-center p-16 relative overflow-hidden" style={{ background: "#0c0c0e" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center gap-10">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-sm text-muted-foreground tracking-widest uppercase">
              <span className="font-display text-base normal-case text-foreground">Earth</span>{" "}Flow
            </span>
          </Link>
          <EarthGraphic />
          <div className="space-y-2.5 max-w-[260px]">
            <p className="font-display text-[1.6rem] leading-snug text-foreground">
              Focus on<br />what matters
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ambient sounds and Pomodoro timer for deep focus
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 min-h-screen" style={{ background: "#111115" }}>
        <Link to="/" className="min-[900px]:hidden flex items-center gap-2 mb-10 hover:opacity-80 transition-opacity">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
          <span className="text-sm text-muted-foreground">
            <span className="font-display text-base text-foreground">Earth</span> Flow
          </span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
      <path d="M43.611 20.083H42V20H24v8h11.303C33.988 32.657 29.455 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.435 0-9.957-3.621-11.297-8.571l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a11.986 11.986 0 01-4.087 5.571l6.19 5.238C42.012 35.67 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
  );
}

export const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-white/[0.06]";

export const btnCls =
  "w-full h-11 rounded-lg bg-foreground text-background text-sm font-semibold tracking-wide hover:bg-foreground/90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed";

export const ghostBtnCls =
  "w-full h-11 rounded-lg border border-white/10 bg-transparent text-sm inline-flex items-center justify-center gap-2.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors";

export const errorCls =
  "rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400";

export function Divider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 border-t border-white/10" />
      <span className="text-[11px] text-muted-foreground/50">or</span>
      <div className="flex-1 border-t border-white/10" />
    </div>
  );
}
