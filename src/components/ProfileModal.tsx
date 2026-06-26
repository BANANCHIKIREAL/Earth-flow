import { useEffect, useRef, useState } from "react";
import { Camera, Check, LogOut, RotateCcw, User, X, Zap } from "lucide-react";
import type { StreakStats } from "@/hooks/useStreak";
import { STREAK_ENABLED } from "@/lib/flags";

interface Props {
  open: boolean;
  onClose: () => void;
  userNumber?: number | null;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  streak: StreakStats;
  onUpdateDisplayName: (name: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<{ error: Error | null }>;
  onSignOut: () => Promise<void>;
}

// ── Upgrade milestones ────────────────────────────────────────────────────────
// Single 🔥 evolves via CSS filter (hue-rotate, saturate, brightness) + drop-shadow glow

interface Milestone {
  days: number;
  size: number;         // font-size px
  label: string;
  color: string;        // display label color
  filter: string;       // full CSS filter (color + glow combined)
  anim: "" | "pulse" | "bounce" | "rainbow";
}

const MILESTONES: Milestone[] = [
  { days: 0,   size: 28, label: "Day 0",             color: "#64748b",
    filter: "grayscale(0.9) brightness(0.5)", anim: "" },
  { days: 1,   size: 30, label: "Day one",           color: "#fb923c",
    filter: "drop-shadow(0 0 5px rgba(251,146,60,0.5))", anim: "" },
  { days: 2,   size: 32, label: "Keep it up",        color: "#fb923c",
    filter: "drop-shadow(0 0 7px rgba(251,146,60,0.6))", anim: "" },
  { days: 3,   size: 34, label: "3 days strong",     color: "#f97316",
    filter: "saturate(1.2) drop-shadow(0 0 9px rgba(249,115,22,0.7))", anim: "" },
  { days: 4,   size: 36, label: "4 days in",         color: "#f97316",
    filter: "saturate(1.3) drop-shadow(0 0 11px rgba(249,115,22,0.78))", anim: "" },
  { days: 5,   size: 38, label: "Warming up",        color: "#f97316",
    filter: "saturate(1.4) drop-shadow(0 0 13px rgba(249,115,22,0.85))", anim: "" },
  { days: 6,   size: 40, label: "Almost a week",     color: "#ea580c",
    filter: "saturate(1.5) drop-shadow(0 0 14px rgba(234,88,12,0.87))", anim: "" },
  { days: 7,   size: 43, label: "One week!",         color: "#ea580c",
    filter: "saturate(1.6) drop-shadow(0 0 16px rgba(234,88,12,0.9)) drop-shadow(0 0 30px rgba(234,88,12,0.3))",
    anim: "pulse" },
  { days: 8,   size: 45, label: "8 days",            color: "#ea580c",
    filter: "saturate(1.65) drop-shadow(0 0 17px rgba(234,88,12,0.92)) drop-shadow(0 0 34px rgba(234,88,12,0.32))",
    anim: "pulse" },
  { days: 10,  size: 47, label: "Double digits",     color: "#ea580c",
    filter: "saturate(1.7) drop-shadow(0 0 18px rgba(234,88,12,1)) drop-shadow(0 0 40px rgba(234,88,12,0.4))",
    anim: "pulse" },
  { days: 12,  size: 49, label: "12 days",           color: "#f59e0b",
    filter: "saturate(1.75) brightness(1.05) drop-shadow(0 0 19px rgba(245,158,11,1)) drop-shadow(0 0 42px rgba(245,158,11,0.45))",
    anim: "pulse" },
  { days: 14,  size: 51, label: "Two weeks",         color: "#f59e0b",
    filter: "saturate(1.8) brightness(1.1) drop-shadow(0 0 20px rgba(245,158,11,1)) drop-shadow(0 0 44px rgba(245,158,11,0.5))",
    anim: "bounce" },
  { days: 15,  size: 52, label: "15 days",           color: "#f59e0b",
    filter: "saturate(1.85) brightness(1.1) drop-shadow(0 0 21px rgba(245,158,11,1)) drop-shadow(0 0 46px rgba(245,158,11,0.52))",
    anim: "bounce" },
  { days: 17,  size: 54, label: "Unstoppable",       color: "#f59e0b",
    filter: "saturate(2.0) brightness(1.12) drop-shadow(0 0 22px rgba(245,158,11,1)) drop-shadow(0 0 50px rgba(245,158,11,0.55))",
    anim: "bounce" },
  { days: 20,  size: 56, label: "20 days",           color: "#eab308",
    filter: "saturate(2.1) brightness(1.12) drop-shadow(0 0 22px rgba(234,179,8,1)) drop-shadow(0 0 52px rgba(234,179,8,0.57))",
    anim: "bounce" },
  { days: 21,  size: 57, label: "Three weeks",       color: "#eab308",
    filter: "saturate(2.2) brightness(1.15) drop-shadow(0 0 22px rgba(234,179,8,1)) drop-shadow(0 0 55px rgba(234,179,8,0.6))",
    anim: "bounce" },
  { days: 25,  size: 59, label: "On a roll!",        color: "#eab308",
    filter: "saturate(2.4) brightness(1.2) drop-shadow(0 0 24px rgba(234,179,8,1)) drop-shadow(0 0 60px rgba(234,179,8,0.65))",
    anim: "bounce" },
  { days: 30,  size: 62, label: "One month",         color: "#fde047",
    filter: "saturate(2.6) brightness(1.25) drop-shadow(0 0 26px rgba(253,224,71,1)) drop-shadow(0 0 64px rgba(253,224,71,0.7)) drop-shadow(0 0 90px rgba(253,224,71,0.3))",
    anim: "pulse" },
  { days: 35,  size: 63, label: "35 days",           color: "#fde047",
    filter: "saturate(2.7) brightness(1.27) drop-shadow(0 0 27px rgba(253,224,71,1)) drop-shadow(0 0 67px rgba(253,224,71,0.72))",
    anim: "bounce" },
  { days: 40,  size: 64, label: "Electric!",         color: "#fde047",
    filter: "saturate(2.8) brightness(1.3) drop-shadow(0 0 28px rgba(253,224,71,1)) drop-shadow(0 0 70px rgba(253,224,71,0.75))",
    anim: "bounce" },
  { days: 45,  size: 65, label: "45 days",           color: "#fde047",
    filter: "saturate(2.9) brightness(1.32) drop-shadow(0 0 29px rgba(250,204,21,1)) drop-shadow(0 0 72px rgba(250,204,21,0.77))",
    anim: "bounce" },
  { days: 50,  size: 66, label: "Shooting star",     color: "#fde047",
    filter: "saturate(3.0) brightness(1.35) drop-shadow(0 0 30px rgba(250,204,21,1)) drop-shadow(0 0 75px rgba(250,204,21,0.8))",
    anim: "bounce" },
  { days: 55,  size: 67, label: "55 days",           color: "#fde047",
    filter: "saturate(3.1) brightness(1.37) drop-shadow(0 0 28px rgba(250,204,21,1)) drop-shadow(0 0 72px rgba(250,204,21,0.78))",
    anim: "pulse" },
  { days: 60,  size: 69, label: "Blue flame",        color: "#38bdf8",
    filter: "sepia(1) saturate(4) hue-rotate(195deg) drop-shadow(0 0 28px rgba(56,189,248,1)) drop-shadow(0 0 70px rgba(56,189,248,0.7))",
    anim: "pulse" },
  { days: 75,  size: 71, label: "Mystic flame",      color: "#a78bfa",
    filter: "sepia(1) saturate(4.5) hue-rotate(240deg) drop-shadow(0 0 30px rgba(167,139,250,1)) drop-shadow(0 0 75px rgba(167,139,250,0.75))",
    anim: "bounce" },
  { days: 80,  size: 72, label: "80 days",           color: "#a78bfa",
    filter: "sepia(1) saturate(4.7) hue-rotate(245deg) drop-shadow(0 0 31px rgba(167,139,250,1)) drop-shadow(0 0 77px rgba(167,139,250,0.77))",
    anim: "bounce" },
  { days: 90,  size: 74, label: "3 months",          color: "#8b5cf6",
    filter: "sepia(1) saturate(5) hue-rotate(250deg) drop-shadow(0 0 32px rgba(139,92,246,1)) drop-shadow(0 0 80px rgba(139,92,246,0.8)) drop-shadow(0 0 110px rgba(139,92,246,0.35))",
    anim: "pulse" },
  { days: 100, size: 75, label: "100 days",          color: "#818cf8",
    filter: "sepia(1) saturate(5.0) hue-rotate(255deg) brightness(1.1) drop-shadow(0 0 32px rgba(99,102,241,1)) drop-shadow(0 0 82px rgba(99,102,241,0.82))",
    anim: "bounce" },
  { days: 120, size: 76, label: "4 months",          color: "#818cf8",
    filter: "sepia(1) saturate(5.0) hue-rotate(260deg) brightness(1.2) drop-shadow(0 0 34px rgba(99,102,241,1)) drop-shadow(0 0 85px rgba(99,102,241,0.85))",
    anim: "bounce" },
  { days: 150, size: 77, label: "5 months",          color: "#818cf8",
    filter: "sepia(1) saturate(5.2) hue-rotate(262deg) brightness(1.25) drop-shadow(0 0 35px rgba(99,102,241,1)) drop-shadow(0 0 88px rgba(99,102,241,0.87))",
    anim: "bounce" },
  { days: 180, size: 78, label: "Half a year",       color: "#818cf8",
    filter: "sepia(1) saturate(5.5) hue-rotate(265deg) brightness(1.3) drop-shadow(0 0 36px rgba(99,102,241,1)) drop-shadow(0 0 90px rgba(99,102,241,0.9)) drop-shadow(0 0 130px rgba(99,102,241,0.4))",
    anim: "bounce" },
  { days: 200, size: 79, label: "200 days",          color: "#ec4899",
    filter: "sepia(1) saturate(5.8) hue-rotate(280deg) brightness(1.3) drop-shadow(0 0 37px rgba(236,72,153,1)) drop-shadow(0 0 90px rgba(236,72,153,0.88))",
    anim: "pulse" },
  { days: 270, size: 80, label: "9 months",          color: "#ec4899",
    filter: "sepia(1) saturate(6) hue-rotate(290deg) brightness(1.3) drop-shadow(0 0 38px rgba(236,72,153,1)) drop-shadow(0 0 90px rgba(236,72,153,0.9))",
    anim: "pulse" },
  { days: 365, size: 82, label: "ONE YEAR",          color: "#fde047",
    filter: "", anim: "rainbow" },
  { days: 500, size: 84, label: "500 DAYS",          color: "#fde047",
    filter: "", anim: "rainbow" },
  { days: 1000, size: 88, label: "1000 DAYS",        color: "#fde047",
    filter: "", anim: "rainbow" },
];

export function getMilestone(streak: number) {
  let idx = 0;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (streak >= MILESTONES[i].days) idx = i; else break;
  }
  return { m: MILESTONES[idx], idx, next: MILESTONES[idx + 1] ?? null };
}

function FlameDisplay({ streak }: { streak: number }) {
  const { m, idx, next } = getMilestone(streak);
  const progress = next ? Math.min(1, (streak - m.days) / (next.days - m.days)) : 1;
  const anim =
    m.anim === "rainbow" ? "animate-flame-rainbow" :
    m.anim === "pulse"   ? "animate-pulse-soft" :
    m.anim === "bounce"  ? "animate-bounce-subtle" : "";

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        className={`${anim} transition-all duration-700 leading-none select-none`}
        style={{ fontSize: m.size, filter: m.anim !== "rainbow" ? m.filter : undefined }}
      >
        🔥
      </div>

      <div className="text-xs font-semibold tracking-wide transition-all duration-700" style={{ color: m.color }}>
        {m.label}
      </div>

      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/40">
          <span>{idx === 0 ? "Level —" : `Level ${idx} / ${MILESTONES.length - 1}`}</span>
          {next ? <span>{streak} / {next.days} days</span> : <span style={{ color: m.color }}>MAX</span>}
        </div>
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress * 100}%`, background: m.color, boxShadow: `0 0 8px ${m.color}` }}
          />
        </div>
        {next && (
          <div className="text-[9px] text-muted-foreground/30 text-right">
            next: {next.label} at day {next.days}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileModal({
  open, onClose, userNumber, email, displayName, avatarUrl, streak,
  onUpdateDisplayName, onUploadAvatar, onSignOut,
}: Props) {
  const [draft, setDraft] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(displayName); }, [displayName]);
  useEffect(() => { setImgError(false); }, [avatarUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const avatarLetter = (displayName || email).charAt(0).toUpperCase();

  const handleSave = async () => {
    if (draft === displayName) return;
    setSaving(true);
    await onUpdateDisplayName(draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadError(null);
    setUploading(true);
    const { error } = await onUploadAvatar(file);
    setUploading(false);
    if (error) setUploadError("Не удалось загрузить фото. Попробуйте ещё раз.");
  };

  if (!open) return null;

  const { currentStreak, longestStreak, totalDays, isStreakBroken, canRestore, monthlyRestoresUsed } = streak;
  const restoresLeft = 3 - monthlyRestoresUsed;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="glass border border-border rounded-3xl p-6 w-full max-w-sm pointer-events-auto overflow-y-auto max-h-[90vh] space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Профиль</div>
            <button onClick={onClose} className="h-8 w-8 rounded-full glass flex items-center justify-center hover:text-primary transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <button
                onClick={() => fileRef.current?.click()}
                className="h-20 w-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors relative block"
              >
                {avatarUrl && !imgError ? (
                  <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                ) : (
                  <div className="w-full h-full bg-foreground/10 flex items-center justify-center text-2xl font-semibold">{avatarLetter}</div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading ? <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Camera size={18} className="text-white" />}
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAvatarFile(f); e.target.value = ""; }} />
            </div>
            <div className="text-center">
              {displayName && <div className="text-sm font-medium text-foreground">{displayName}</div>}
              <div className="text-xs text-muted-foreground">{email}</div>
              {userNumber != null && <div className="text-[10px] text-muted-foreground/50 font-mono mt-1">#{userNumber}</div>}
              {uploadError && <div className="text-[11px] text-red-400 mt-1">{uploadError}</div>}
            </div>
          </div>

          {/* ── Streak section ── */}
          {STREAK_ENABLED && <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">

            {/* Flame upgrade display */}
            <FlameDisplay streak={currentStreak} />

            {/* Activate streak prompt (only when streak = 0) */}
            {currentStreak === 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 space-y-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-foreground/80">Активируй свой огонёк!</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    Заходи каждый день и огонёк будет расти и становиться круче.
                    Пропустишь 3 дня — стрик сбросится, но его можно вернуть — до 3 раз в месяц.
                  </div>
                </div>
                <button
                  onClick={() => streak.recordSession()}
                  className="w-full h-9 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/15 hover:border-primary/35 transition-all"
                >
                  Начать огонёк 🔥
                </button>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
              <div className="bg-background/40 px-3 py-2.5 text-center">
                <div className="text-lg font-bold tabular-nums">{currentStreak}</div>
                <div className="text-[10px] text-muted-foreground">current</div>
              </div>
              <div className="bg-background/40 px-3 py-2.5 text-center">
                <div className="text-lg font-bold tabular-nums flex items-center justify-center gap-1">
                  <Zap size={12} className="text-muted-foreground" />{longestStreak}
                </div>
                <div className="text-[10px] text-muted-foreground">best</div>
              </div>
            </div>

            {/* Streak broken / restore */}
            {isStreakBroken && (
              <div className={`rounded-xl border px-3 py-3 space-y-2.5 ${canRestore ? "border-amber-500/20 bg-amber-500/[0.04]" : "border-red-500/20 bg-red-500/[0.04]"}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">{canRestore ? "💔" : "😢"}</span>
                  <div>
                    <div className="text-xs font-medium text-foreground/80">Стрик прерван</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {canRestore
                        ? `Осталось ${restoresLeft} из 3 восстановлений в этом месяце.`
                        : "Лимит восстановлений исчерпан (3/3). Стрик начнётся заново."}
                    </div>
                  </div>
                </div>
                {canRestore && (
                  <button
                    onClick={() => streak.restoreStreak()}
                    className="w-full h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 font-medium inline-flex items-center justify-center gap-1.5 hover:bg-amber-500/20 transition-colors"
                  >
                    <RotateCcw size={12} /> Восстановить стрик
                  </button>
                )}
              </div>
            )}

          </div>}

          {/* Display name */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <User size={11} /> Имя
            </label>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setSaved(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
                placeholder="Добавить имя"
                className="flex-1 min-w-0 rounded-full border border-border bg-foreground/5 px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
              <button
                onClick={() => void handleSave()}
                disabled={saving || draft === displayName}
                className="h-9 w-9 rounded-full glass border border-border inline-flex items-center justify-center transition-colors hover:border-primary disabled:opacity-40"
              >
                {saved ? <Check size={14} className="text-green-400" /> : <Check size={14} />}
              </button>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => void onSignOut()}
            className="w-full h-9 rounded-full glass border border-border text-sm inline-flex items-center justify-center gap-2 text-muted-foreground hover:text-red-400 hover:border-red-400/40 transition-colors"
          >
            <LogOut size={14} />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </>
  );
}
