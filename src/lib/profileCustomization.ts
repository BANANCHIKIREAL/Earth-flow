export type ProfileScene = "cosmic" | "aurora" | "ocean" | "ember" | "dusk" | "noir";
export type ProfileBanner = "nebula" | "aurora" | "sunrise" | "waves" | "eclipse" | "prism";
export type ProfileFrame = "clean" | "halo" | "orbit" | "double" | "prism";
export type ProfileSurface = "glass" | "midnight" | "velvet" | "frost";
export type ProfileMood = "none" | "focus" | "calm" | "night" | "flow" | "spark";
export type ProfileHeaderSize = "compact" | "balanced" | "cinematic";
export type ProfileAvatarSize = "small" | "medium" | "large";
export type ProfileAvatarShape = "circle" | "soft" | "rounded";
export type ProfileWidth = "compact" | "standard" | "wide";
export type ProfileTextAlign = "left" | "center";

export interface ProfileCustomization {
  scene: ProfileScene;
  banner: ProfileBanner;
  frame: ProfileFrame;
  surface: ProfileSurface;
  mood: ProfileMood;
  accent: string;
  glow: number;
  sceneDepth: number;
  borderStrength: number;
  headerSize: ProfileHeaderSize;
  avatarSize: ProfileAvatarSize;
  avatarShape: ProfileAvatarShape;
  profileWidth: ProfileWidth;
  textAlign: ProfileTextAlign;
  motion: boolean;
  particles: boolean;
  showEmail: boolean;
  showMemberId: boolean;
  showMemberSince: boolean;
  title: string;
  bio: string;
}

export const DEFAULT_PROFILE_CUSTOMIZATION: ProfileCustomization = {
  scene: "cosmic",
  banner: "nebula",
  frame: "clean",
  surface: "glass",
  mood: "focus",
  accent: "#67e8f9",
  glow: 48,
  sceneDepth: 70,
  borderStrength: 42,
  headerSize: "balanced",
  avatarSize: "medium",
  avatarShape: "circle",
  profileWidth: "standard",
  textAlign: "center",
  motion: true,
  particles: true,
  showEmail: true,
  showMemberId: true,
  showMemberSince: true,
  title: "",
  bio: "",
};

export const PROFILE_ACCENTS = [
  "#67e8f9",
  "#a78bfa",
  "#f0abfc",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#f97316",
  "#e2e8f0",
  "#22d3ee",
  "#c084fc",
  "#4ade80",
];

const SCENES: ProfileScene[] = ["cosmic", "aurora", "ocean", "ember", "dusk", "noir"];
const BANNERS: ProfileBanner[] = ["nebula", "aurora", "sunrise", "waves", "eclipse", "prism"];
const FRAMES: ProfileFrame[] = ["clean", "halo", "orbit", "double", "prism"];
const SURFACES: ProfileSurface[] = ["glass", "midnight", "velvet", "frost"];
const MOODS: ProfileMood[] = ["none", "focus", "calm", "night", "flow", "spark"];
const HEADER_SIZES: ProfileHeaderSize[] = ["compact", "balanced", "cinematic"];
const AVATAR_SIZES: ProfileAvatarSize[] = ["small", "medium", "large"];
const AVATAR_SHAPES: ProfileAvatarShape[] = ["circle", "soft", "rounded"];
const PROFILE_WIDTHS: ProfileWidth[] = ["compact", "standard", "wide"];
const TEXT_ALIGNS: ProfileTextAlign[] = ["left", "center"];

const pick = <T extends string>(value: unknown, allowed: T[], fallback: T): T =>
  typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;

const percentage = (value: unknown, fallback: number): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? Math.max(0, Math.min(100, Math.round(numeric)))
    : fallback;
};

export function sanitizeProfileCustomization(value: unknown): ProfileCustomization {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const fallback = DEFAULT_PROFILE_CUSTOMIZATION;
  const accent =
    typeof source.accent === "string" && /^#[0-9a-f]{6}$/i.test(source.accent)
      ? source.accent.toLowerCase()
      : fallback.accent;

  return {
    scene: pick(source.scene, SCENES, fallback.scene),
    banner: pick(source.banner, BANNERS, fallback.banner),
    frame: pick(source.frame, FRAMES, fallback.frame),
    surface: pick(source.surface, SURFACES, fallback.surface),
    mood: pick(source.mood, MOODS, fallback.mood),
    accent,
    glow: percentage(source.glow, fallback.glow),
    sceneDepth: percentage(source.sceneDepth, fallback.sceneDepth),
    borderStrength: percentage(source.borderStrength, fallback.borderStrength),
    headerSize: pick(source.headerSize, HEADER_SIZES, fallback.headerSize),
    avatarSize: pick(source.avatarSize, AVATAR_SIZES, fallback.avatarSize),
    avatarShape: pick(source.avatarShape, AVATAR_SHAPES, fallback.avatarShape),
    profileWidth: pick(source.profileWidth, PROFILE_WIDTHS, fallback.profileWidth),
    textAlign: pick(source.textAlign, TEXT_ALIGNS, fallback.textAlign),
    motion: typeof source.motion === "boolean" ? source.motion : fallback.motion,
    particles: typeof source.particles === "boolean" ? source.particles : fallback.particles,
    showEmail: typeof source.showEmail === "boolean" ? source.showEmail : fallback.showEmail,
    showMemberId: typeof source.showMemberId === "boolean" ? source.showMemberId : fallback.showMemberId,
    showMemberSince: typeof source.showMemberSince === "boolean" ? source.showMemberSince : fallback.showMemberSince,
    title: typeof source.title === "string" ? source.title.slice(0, 32) : fallback.title,
    bio: typeof source.bio === "string" ? source.bio.slice(0, 90) : fallback.bio,
  };
}

export const PROFILE_MOODS: Record<ProfileMood, { label: string }> = {
  none: { label: "None" },
  focus: { label: "Focused" },
  calm: { label: "Calm" },
  night: { label: "Night" },
  flow: { label: "Flow" },
  spark: { label: "Spark" },
};
