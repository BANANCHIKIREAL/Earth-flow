import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Camera, CalendarDays, Check, Hash, KeyRound, LogOut, Mail, Palette, Plus, RotateCcw, Settings, Trash2, User, Users, X, Zap } from "@/components/MorphIcon";
import type { StreakStats } from "@/hooks/useStreak";
import { useProfileCustomization } from "@/hooks/useProfileCustomization";
import { STREAK_ENABLED } from "@/lib/flags";
import { isBossStreak } from "@/lib/streakBoss";
import { PROFILE_MOODS } from "@/lib/profileCustomization";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { ProfileCustomizationPanel } from "@/components/ProfileCustomizationPanel";
import { ProfileMoodIcon } from "@/components/ProfileMoodIcon";
import { GoogleIcon } from "@/components/AuthLayout";

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

function FlameDisplay({ streak, boss = false }: { streak: number; boss?: boolean }) {
  const { m, idx, next } = getMilestone(streak);
  const progress = next ? Math.min(1, (streak - m.days) / (next.days - m.days)) : 1;
  const anim =
    m.anim === "rainbow" ? "animate-flame-rainbow" :
    m.anim === "pulse"   ? "animate-pulse-soft" :
    m.anim === "bounce"  ? "animate-bounce-subtle" : "";

  if (boss) {
    return (
      <div className="boss-streak-showcase" aria-label={`Boss streak: ${streak} days`}>
        <span className="boss-streak-royal-aura" aria-hidden="true" />
        <div className="boss-streak-stars" aria-hidden="true">
          <span>✦</span><span>✧</span><span>✦</span><span>✧</span>
          <span>✦</span><span>✧</span><span>✦</span><span>✧</span>
        </div>
        <div className="boss-streak-emblem" aria-hidden="true">
          <span className="boss-streak-radiance" />
          <span className="boss-streak-orbit boss-streak-orbit-a"><i /></span>
          <span className="boss-streak-orbit boss-streak-orbit-b"><i /></span>
          <span className="boss-streak-orbit boss-streak-orbit-c"><i /></span>
          <span className="boss-streak-jewels">
            <i /><i /><i /><i />
          </span>
          <span className="boss-streak-crown">♛</span>
          <span className="boss-streak-flame">🔥</span>
          <span className="boss-streak-core" />
        </div>
        <div className="boss-streak-title">BOSS STREAK</div>
        <div className="boss-streak-subtitle">
          <span>USER #0005 EXCLUSIVE</span>
          <span className="boss-streak-divider" />
          <span>{streak} DAYS</span>
        </div>
        <div className="boss-streak-max">MAXIMUM OVERDRIVE</div>
      </div>
    );
  }

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
  const {
    resetPassword, removeAvatar, updateEmail, requestDeleteCode, verifyDeleteCode, deleteAccount, user,
    savedAccounts, switchAccount, forgetSavedAccount, signIn, signInWithGoogle,
  } = useAuth();
  const [draft, setDraft] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [switchEmail, setSwitchEmail] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [switchBusy, setSwitchBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [pwStatus, setPwStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [tab, setTab] = useState<"profile" | "customize" | "settings">("profile");
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [avatarRemoveConfirm, setAvatarRemoveConfirm] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "editing" | "sending" | "sent" | "error">("idle");
  const [emailDraft, setEmailDraft] = useState("");
  const [deleteState, setDeleteState] = useState<"idle" | "confirm" | "sending-code" | "code" | "deleting" | "error">("idle");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteCodeError, setDeleteCodeError] = useState<string | null>(null);
  const [hasAccountPassword, setHasAccountPassword] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    customization,
    updateCustomization,
    resetCustomization,
  } = useProfileCustomization(user?.id, Boolean(user));

  useEffect(() => {
    if (!open) return;
    setTab("profile");
    setPwStatus("idle");
    setEmailStatus("idle");
    setEmailDraft("");
    setDeleteState("idle");
    setDeleteCode("");
    setDeleteCodeError(null);
    setAvatarRemoveConfirm(false);
  }, [open]);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const signInProviders = new Set([
    ...(typeof user?.app_metadata?.provider === "string"
      ? [user.app_metadata.provider]
      : []),
    ...((user?.app_metadata?.providers as string[] | undefined) ?? []),
    ...(user?.identities?.map((identity) => identity.provider) ?? []),
  ]);
  const hasGoogleSignIn = signInProviders.has("google");
  const hasPasswordSignIn =
    hasAccountPassword ?? signInProviders.has("email");
  const needsPassword =
    hasAccountPassword === false && !signInProviders.has("email");
  const provider = hasGoogleSignIn
    ? hasPasswordSignIn
      ? "Google + Email"
      : "Google"
    : "Email";

  useEffect(() => { setDraft(displayName); }, [displayName]);
  useEffect(() => { setImgError(false); }, [avatarUrl]);

  useEffect(() => {
    if (!open || !user) {
      setHasAccountPassword(null);
      return;
    }

    let cancelled = false;
    setHasAccountPassword(null);
    void supabase
      .from("user_profiles")
      .select("has_password")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setHasAccountPassword(
          typeof data?.has_password === "boolean" ? data.has_password : null,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [open, user]);

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
    setUploadError(null);
    setUploading(true);
    const { error } = await onUploadAvatar(file);
    setUploading(false);
    if (error) setUploadError(error.message || "Failed to upload photo. Please try again.");
  };

  const handleChangePassword = async () => {
    if (pwStatus === "sending" || pwStatus === "sent") return;
    setPwStatus("sending");
    const { error } = await resetPassword(
      email,
      needsPassword ? "add" : "change",
    );
    setPwStatus(error ? "error" : "sent");
  };

  const handleRemoveAvatar = async () => {
    if (removingAvatar) return;
    setRemovingAvatar(true);
    await removeAvatar();
    setRemovingAvatar(false);
  };

  const handleSendEmailChange = async () => {
    const next = emailDraft.trim();
    if (!next || next === email) return;
    setEmailStatus("sending");
    const { error } = await updateEmail(next);
    setEmailStatus(error ? "error" : "sent");
  };

  const handleSwitchTo = async (id: string) => {
    if (switchBusy) return;
    setSwitchBusy(true);
    setSwitchError(null);
    const { error } = await switchAccount(id);
    setSwitchBusy(false);
    if (error) setSwitchError("Couldn't switch accounts — try signing in again.");
  };

  const handleAddAccountSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (switchBusy) return;
    setSwitchBusy(true);
    setSwitchError(null);
    const { error } = await signIn(switchEmail, switchPassword);
    setSwitchBusy(false);
    if (error) {
      setSwitchError("Invalid email or password");
      return;
    }
    setAddAccountOpen(false);
    setSwitchEmail("");
    setSwitchPassword("");
  };

  const handleSendDeleteCode = async () => {
    setDeleteState("sending-code");
    setDeleteCode("");
    setDeleteCodeError(null);
    const { error } = await requestDeleteCode();
    setDeleteState(error ? "error" : "code");
  };

  const handleConfirmDelete = async () => {
    const code = deleteCode.trim();
    if (code.length < 6) return;
    setDeleteCodeError(null);
    setDeleteState("deleting");
    const { error: verifyError } = await verifyDeleteCode(code);
    if (verifyError) {
      setDeleteCodeError("Invalid or expired code");
      setDeleteState("code");
      return;
    }
    const { error } = await deleteAccount();
    if (error) setDeleteState("error");
    // On success the auth listener signs the user out and the modal unmounts
  };

  if (!open) return null;

  const { currentStreak, longestStreak, totalDays, isStreakBroken, canRestore, monthlyRestoresUsed } = streak;
  const restoresLeft = 3 - monthlyRestoresUsed;
  const bossStreak = isBossStreak(userNumber, currentStreak);
  const selectedMood = PROFILE_MOODS[customization.mood];
  const tabIndex = tab === "profile" ? 0 : tab === "customize" ? 1 : 2;
  const profileStyle = {
    "--profile-accent": customization.accent,
    "--profile-glow": customization.glow,
    "--profile-scene-depth": customization.sceneDepth,
    "--profile-border-strength": customization.borderStrength,
  } as CSSProperties;
  const profileModalClass = [
    bossStreak
      ? "boss-profile-modal glass"
      : "glass border border-border",
    "profile-customized-modal",
    `profile-scene-${customization.scene}`,
    `profile-surface-${customization.surface}`,
    "profile-header-balanced",
    "profile-avatar-size-medium",
    "profile-avatar-shape-circle",
    "profile-width-standard",
    "profile-text-left",
    customization.motion ? "" : "profile-motion-off",
    "ef-pm-in rounded-3xl w-full max-w-sm pointer-events-auto overflow-hidden max-h-[90vh] flex flex-col",
  ].filter(Boolean).join(" ");

  return (
    <>
      <style>{`
        @keyframes ef-pm-in {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        .ef-pm-in { animation: ef-pm-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes ef-pm-tab {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        .ef-pm-tab { animation: ef-pm-tab 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
        @media (prefers-reduced-motion: reduce) {
          .ef-pm-in, .ef-pm-tab { animation: none; }
        }
      `}</style>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className={profileModalClass} style={profileStyle}>

          {/* Banner */}
          <div className={`${bossStreak ? "boss-profile-banner " : ""}profile-custom-banner profile-banner-${customization.banner} relative h-24 shrink-0`}>
            {customization.particles && (
              <span className="profile-custom-particles" aria-hidden="true">
                <i /><i /><i /><i /><i /><i />
              </span>
            )}
            <div className="absolute left-5 top-5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {tab === "profile" ? "Profile" : tab === "customize" ? "Profile studio" : "Profile settings"}
            </div>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 h-8 w-8 rounded-full glass flex items-center justify-center hover:text-primary transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Avatar — overlaps banner, persists across tabs (photo changes via Settings) */}
          <div className="profile-custom-avatar-row relative z-10 -mt-11 flex justify-center">
            <div className={`profile-custom-avatar-shell profile-frame-${customization.frame} relative h-[88px] w-[88px] rounded-full`}>
              <div className="relative h-full w-full rounded-full overflow-hidden border-2 border-border shadow-[0_0_30px_oklch(0.82_0.12_200_/_0.2)]">
                {avatarUrl && !imgError ? (
                  <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                ) : (
                  <div className="profile-avatar-fallback w-full h-full flex items-center justify-center text-3xl font-semibold">{avatarLetter}</div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAvatarFile(f); e.target.value = ""; }} />
          </div>

          {/* Identity */}
          <div className="profile-custom-identity px-6 pt-3 pb-1 text-center shrink-0">
            <div className="font-display text-xl text-foreground">{displayName || "Anonymous"}</div>
            {customization.title && (
              <div className="profile-custom-identity-title">{customization.title}</div>
            )}
            {customization.showEmail && (
              <div className="mt-0.5 text-xs text-muted-foreground">{email}</div>
            )}
            {customization.bio && (
              <div className="profile-custom-bio">{customization.bio}</div>
            )}
            <div className="profile-custom-identity-meta">
              {customization.mood !== "none" && (
                <span className="profile-custom-mood">
                  <b><ProfileMoodIcon mood={customization.mood} size={12} /></b>
                  {selectedMood.label}
                </span>
              )}
            {customization.showMemberId && userNumber != null && (
              <span className={bossStreak ? "boss-profile-id mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-mono" : "mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground"}>
                {bossStreak && <span aria-hidden="true">♛</span>}
                <Hash size={9} /> {bossStreak ? "0005 · BOSS CLASS" : userNumber}
              </span>
            )}
            </div>
            {uploadError && <div className="text-[11px] text-red-400 mt-1.5">{uploadError}</div>}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {tab === "profile" && (
              <div key="profile" className="ef-pm-tab space-y-4">

          {/* Account info */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06]">
            {customization.showEmail && <div className="flex items-center gap-3 px-4 py-3">
              <Mail size={13} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 text-xs text-muted-foreground">Email</span>
              <span className="max-w-[170px] truncate text-xs text-foreground">{email}</span>
            </div>}
            {customization.showMemberId && <div className="flex items-center gap-3 px-4 py-3">
              <User size={13} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 text-xs text-muted-foreground">Member</span>
              <span className="text-xs font-mono text-foreground">{userNumber != null ? `#${userNumber}` : "—"}</span>
            </div>}
            {customization.showMemberSince && memberSince && (
              <div className="flex items-center gap-3 px-4 py-3">
                <CalendarDays size={13} className="shrink-0 text-muted-foreground" />
                <span className="flex-1 text-xs text-muted-foreground">Member since</span>
                <span className="text-xs text-foreground">{memberSince}</span>
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-3">
              <KeyRound size={13} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 text-xs text-muted-foreground">Sign-in method</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                {hasGoogleSignIn && (
                  <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                {provider}
              </span>
            </div>
          </div>

          {/* ── Streak section ── */}
          {STREAK_ENABLED && <div className={bossStreak ? "boss-streak-panel p-4 space-y-4" : "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4"}>

            {/* Flame upgrade display */}
            <FlameDisplay streak={currentStreak} boss={bossStreak} />

            {/* Activate streak prompt (only when streak = 0) */}
            {currentStreak === 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 space-y-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-foreground/80">Start your streak!</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    Visit every day and your flame will grow stronger.
                    Miss 3 days and the streak resets, but you can restore it — up to 3 times a month.
                  </div>
                </div>
                <button
                  onClick={() => streak.recordSession()}
                  className="w-full h-9 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/15 hover:border-primary/35 transition-all"
                >
                  Start streak 🔥
                </button>
              </div>
            )}

            {/* Stats row */}
            <div className={bossStreak ? "boss-streak-stats grid grid-cols-2 gap-px rounded-xl overflow-hidden" : "grid grid-cols-2 gap-px bg-white/[0.06] rounded-xl overflow-hidden"}>
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
                    <div className="text-xs font-medium text-foreground/80">Streak broken</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {canRestore
                        ? `${restoresLeft} of 3 restores left this month.`
                        : "Restore limit reached (3/3). Streak will start fresh."}
                    </div>
                  </div>
                </div>
                {canRestore && (
                  <button
                    onClick={() => streak.restoreStreak()}
                    className="w-full h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 font-medium inline-flex items-center justify-center gap-1.5 hover:bg-amber-500/20 transition-colors"
                  >
                    <RotateCcw size={12} /> Restore streak
                  </button>
                )}
              </div>
            )}

          </div>}

              </div>
            )}

            {tab === "customize" && (
              <ProfileCustomizationPanel
                value={customization}
                onChange={updateCustomization}
                onReset={resetCustomization}
              />
            )}

            {tab === "settings" && (
              <div key="settings" className="ef-pm-tab profile-settings-layout">

          <div className="profile-settings-intro">
            <div>
              <div className="profile-settings-eyebrow">PROFILE CONTROL</div>
              <div className="profile-settings-title">Account settings</div>
              <div className="profile-settings-copy">Manage your identity, access and session in one place.</div>
            </div>
          </div>

          <section className="profile-settings-card">
            <div className="profile-settings-card-header">
              <span className="profile-settings-card-icon"><User size={13} /></span>
              <div>
                <div className="profile-settings-card-title">Personal details</div>
                <div className="profile-settings-card-copy">Your public name and profile picture.</div>
              </div>
            </div>

          {/* Display name */}
          <div className="profile-settings-field space-y-2">
            <label className="profile-settings-label">
              Display name
            </label>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setSaved(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
                placeholder="Add name"
                className="flex-1 min-w-0 rounded-xl border border-border bg-foreground/5 px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
              <button
                onClick={() => void handleSave()}
                disabled={saving || draft === displayName}
                className="h-9 w-9 shrink-0 rounded-xl glass border border-border inline-flex items-center justify-center transition-colors hover:border-primary disabled:opacity-40"
              >
                {saved ? <Check size={14} className="text-green-400" /> : <Check size={14} />}
              </button>
            </div>
          </div>

          {/* Photo */}
          <div className="profile-settings-field space-y-2">
            <label className="profile-settings-label">
              Profile photo
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex-1 h-9 rounded-xl glass border border-border text-xs inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                <Camera size={13} /> {uploading ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
              </button>
              {avatarUrl && !avatarRemoveConfirm && (
                <button
                  onClick={() => setAvatarRemoveConfirm(true)}
                  disabled={removingAvatar}
                  className="h-9 px-4 rounded-xl border border-red-400/15 bg-red-400/[0.05] text-xs inline-flex items-center justify-center gap-1.5 text-red-400/80 hover:text-red-400 hover:border-red-400/35 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={13} /> {removingAvatar ? "Removing…" : "Remove"}
                </button>
              )}
              {avatarUrl && avatarRemoveConfirm && (
                <>
                  <button
                    onClick={() => { setAvatarRemoveConfirm(false); void handleRemoveAvatar(); }}
                    className="h-9 px-4 rounded-xl bg-red-500/80 text-xs font-medium text-white hover:bg-red-500 transition-colors"
                  >
                    Sure?
                  </button>
                  <button
                    onClick={() => setAvatarRemoveConfirm(false)}
                    className="h-9 w-9 shrink-0 rounded-xl glass border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
          </section>

          <section className="profile-settings-card">
            <div className="profile-settings-card-header">
              <span className="profile-settings-card-icon"><KeyRound size={13} /></span>
              <div>
                <div className="profile-settings-card-title">Account access</div>
                <div className="profile-settings-card-copy">Update your sign-in email and password.</div>
              </div>
            </div>

          {/* Email */}
          <div className="profile-settings-field space-y-2">
            <label className="profile-settings-label">
              <Mail size={11} /> Email address
            </label>
            <div className="profile-settings-row space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-foreground">Email address</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {emailStatus === "sent" ? (
                      <span className="break-all text-green-400">
                        Confirm both {email} and {emailDraft}
                      </span>
                    ) : emailStatus === "error" ? (
                      <span className="text-red-400">Failed to send. Try again.</span>
                    ) : (
                      <span className="truncate">{email}</span>
                    )}
                  </div>
                </div>
                {emailStatus === "idle" || emailStatus === "error" ? (
                  <button
                    onClick={() => setEmailStatus("editing")}
                    className="h-8 shrink-0 rounded-full glass border border-border px-4 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-all"
                  >
                    {emailStatus === "error" ? "Retry" : "Change"}
                  </button>
                ) : emailStatus === "sent" ? (
                  <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-green-400/30 bg-green-400/10 px-4 text-xs font-medium text-green-400">
                    <Check size={12} /> Sent
                  </span>
                ) : null}
              </div>
              {(emailStatus === "editing" || emailStatus === "sending") && (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleSendEmailChange(); }}
                    placeholder="new@email.com"
                    autoFocus
                    className="flex-1 min-w-0 rounded-xl border border-border bg-foreground/5 px-3 py-1.5 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  />
                  <button
                    onClick={() => void handleSendEmailChange()}
                    disabled={emailStatus === "sending" || !emailDraft.trim() || emailDraft.trim() === email}
                    className="h-8 shrink-0 rounded-full bg-foreground px-4 text-xs font-medium text-background transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:scale-100"
                  >
                    {emailStatus === "sending" ? "Sending…" : "Send"}
                  </button>
                  <button
                    onClick={() => { setEmailStatus("idle"); setEmailDraft(""); }}
                    className="h-8 w-8 shrink-0 rounded-full glass border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="profile-settings-field space-y-2">
            <label className="profile-settings-label">
              <KeyRound size={11} /> Password
            </label>
            <div className="profile-settings-row flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-foreground">
                  {needsPassword ? "No password added" : "Password"}
                </div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  {pwStatus === "sent" ? (
                    <>Link sent to <span className="text-foreground">{email}</span></>
                  ) : pwStatus === "error" ? (
                    <span className="text-red-400">Failed to send email. Try again.</span>
                  ) : (
                    needsPassword
                      ? "We'll email you a secure link to add one"
                      : "We'll email you a confirmation link"
                  )}
                </div>
              </div>
              <button
                onClick={() => void handleChangePassword()}
                disabled={pwStatus === "sending" || pwStatus === "sent"}
                className={`h-8 shrink-0 rounded-full px-4 text-xs font-medium transition-all ${
                  pwStatus === "sent"
                    ? "bg-green-400/10 border border-green-400/30 text-green-400"
                    : "glass border border-border text-foreground hover:border-primary hover:text-primary disabled:opacity-60"
                }`}
              >
                {pwStatus === "sending" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border-2 border-foreground/25 border-t-foreground animate-spin" />
                    Sending
                  </span>
                ) : pwStatus === "sent" ? (
                  <span className="inline-flex items-center gap-1"><Check size={12} /> Sent</span>
                ) : pwStatus === "error" ? (
                  "Retry"
                ) : (
                  needsPassword ? "Add password" : "Change password"
                )}
              </button>
            </div>
          </div>
          </section>

          {/* Switch account */}
          <section className="profile-settings-card">
            <div className="profile-settings-card-header">
              <span className="profile-settings-card-icon"><Users size={13} /></span>
              <div>
                <div className="profile-settings-card-title">Switch account</div>
                <div className="profile-settings-card-copy">Move between accounts on this device.</div>
              </div>
            </div>

            <div className="space-y-2.5">
            {switchError && <div className="text-[11px] text-red-400">{switchError}</div>}

            {savedAccounts.length > 0 && (
              <div className="space-y-1.5">
                {savedAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-medium text-foreground/70">
                      {acc.avatarUrl ? (
                        <img src={acc.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (acc.displayName?.[0] ?? acc.email[0] ?? "?").toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-foreground">{acc.displayName || acc.email}</div>
                      {acc.displayName && (
                        <div className="truncate text-[10px] text-muted-foreground">{acc.email}</div>
                      )}
                    </div>
                    {acc.id === user?.id ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <Check size={10} /> Current
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => void handleSwitchTo(acc.id)}
                          disabled={switchBusy}
                          className="shrink-0 h-7 rounded-full glass border border-border px-3 text-[11px] font-medium text-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                        >
                          Switch
                        </button>
                        <button
                          onClick={() => forgetSavedAccount(acc.id)}
                          title="Forget this account"
                          className="shrink-0 h-7 w-7 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {addAccountOpen ? (
              <form onSubmit={(e) => void handleAddAccountSubmit(e)} className="space-y-2">
                <input
                  type="email"
                  value={switchEmail}
                  onChange={(e) => setSwitchEmail(e.target.value)}
                  placeholder="Email"
                  required
                  autoComplete="email"
                  autoFocus
                  className="w-full rounded-xl border border-border bg-foreground/5 px-3 py-2 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
                <input
                  type="password"
                  value={switchPassword}
                  onChange={(e) => setSwitchPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-border bg-foreground/5 px-3 py-2 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={switchBusy}
                    className="flex-1 h-8 rounded-full bg-foreground text-xs font-medium text-background transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                  >
                    {switchBusy ? "Signing in…" : "Sign in"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddAccountOpen(false); setSwitchError(null); }}
                    className="h-8 w-8 shrink-0 rounded-full glass border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="w-full h-8 rounded-full glass border border-border text-[11px] font-medium text-foreground hover:border-primary transition-all inline-flex items-center justify-center gap-2"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAddAccountOpen(true)}
                className="w-full h-8 rounded-full glass border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-all inline-flex items-center justify-center gap-1.5"
              >
                <Plus size={13} /> Add another account
              </button>
            )}
            </div>
          </section>

          {/* Sign out */}
          <section className="profile-settings-card profile-settings-session">
            <div className="min-w-0">
              <div className="profile-settings-card-title">Current session</div>
              <div className="profile-settings-card-copy">Sign out securely on this device.</div>
            </div>
            <button
              onClick={() => void onSignOut()}
              className="profile-settings-signout"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </section>

          {/* Danger zone */}
          <section className="profile-settings-danger">
            <div className="profile-settings-danger-label">DANGER ZONE</div>
            <div className="flex items-start gap-2.5">
              <Trash2 size={14} className="mt-0.5 shrink-0 text-red-400/70" />
              <div>
                <div className="text-xs font-medium text-red-400/90">Delete account</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  Permanently removes your account, settings, tasks and files. This cannot be undone.
                </div>
              </div>
            </div>
            {deleteState === "idle" && (
              <button
                onClick={() => setDeleteState("confirm")}
                className="mt-5 w-full h-8 rounded-lg border border-red-400/20 bg-red-400/[0.06] text-xs font-medium text-red-400/90 hover:bg-red-400/10 hover:border-red-400/40 transition-colors"
              >
                Delete account
              </button>
            )}
            {deleteState === "confirm" && (
              <div className="space-y-2">
                <div className="text-center text-[11px] font-medium text-red-400">
                  Are you sure? We'll email you a confirmation code.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteState("idle")}
                    className="flex-1 h-8 rounded-lg glass border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleSendDeleteCode()}
                    className="flex-1 h-8 rounded-lg bg-red-500/80 text-xs font-medium text-white hover:bg-red-500 transition-colors"
                  >
                    Send code
                  </button>
                </div>
              </div>
            )}
            {deleteState === "sending-code" && (
              <div className="flex h-8 items-center justify-center gap-2 text-xs text-red-400/80">
                <span className="h-3 w-3 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
                Sending code…
              </div>
            )}
            {deleteState === "code" && (
              <div className="space-y-2">
                <div className="text-center text-[11px] text-muted-foreground leading-relaxed">
                  We sent a 6-digit code to <span className="text-foreground">{email}</span>.
                  <br />Enter it to permanently delete your account.
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={deleteCode}
                  onChange={(e) => setDeleteCode(e.target.value.replace(/[^0-9]/g, ""))}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleConfirmDelete(); }}
                  placeholder="000000"
                  autoFocus
                  className="w-full rounded-lg border border-red-400/20 bg-foreground/5 px-3 py-2 text-center text-base font-mono tracking-[0.5em] text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-red-400/50"
                />
                {deleteCodeError && (
                  <div className="text-center text-[11px] text-red-400">{deleteCodeError}</div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDeleteState("idle"); setDeleteCode(""); setDeleteCodeError(null); }}
                    className="flex-1 h-8 rounded-lg glass border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleConfirmDelete()}
                    disabled={deleteCode.trim().length < 6}
                    className="flex-1 h-8 rounded-lg bg-red-500/80 text-xs font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-40"
                  >
                    Confirm deletion
                  </button>
                </div>
              </div>
            )}
            {deleteState === "deleting" && (
              <div className="flex h-8 items-center justify-center gap-2 text-xs text-red-400/80">
                <span className="h-3 w-3 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
                Deleting account…
              </div>
            )}
            {deleteState === "error" && (
              <div className="space-y-2">
                <div className="text-center text-[11px] text-red-400">
                  Failed to delete account. Try again later.
                </div>
                <button
                  onClick={() => setDeleteState("confirm")}
                  className="w-full h-8 rounded-lg border border-red-400/20 bg-red-400/[0.06] text-xs font-medium text-red-400/90 hover:bg-red-400/10 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </section>

              </div>
            )}
          </div>

          {/* Bottom tabs — sliding segmented control */}
          <div className="shrink-0 p-4 pt-2">
            <div className="profile-custom-tabs relative flex rounded-full p-1">
              <span
                className="profile-custom-tab-indicator absolute top-1 bottom-1 left-1 rounded-full transition-transform duration-300 ease-out"
                style={{
                  width: "calc((100% - 8px) / 3)",
                  transform: `translateX(${tabIndex * 100}%)`,
                }}
              />
              <button
                onClick={() => setTab("profile")}
                className={`profile-custom-tab relative z-10 h-8 flex-1 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 ${tab === "profile" ? "is-active" : ""}`}
              >
                <User size={13} /> Profile
              </button>
              <button
                onClick={() => setTab("customize")}
                className={`profile-custom-tab relative z-10 h-8 flex-1 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 ${tab === "customize" ? "is-active" : ""}`}
              >
                <Palette size={13} /> Customize
              </button>
              <button
                onClick={() => setTab("settings")}
                className={`profile-custom-tab relative z-10 h-8 flex-1 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 ${tab === "settings" ? "is-active" : ""}`}
              >
                <Settings size={13} /> Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
