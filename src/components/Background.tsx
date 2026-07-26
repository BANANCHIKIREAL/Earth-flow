export type BackgroundVariant =
  | "aurora" | "dusk" | "forest" | "waves"
  | "ember" | "sakura" | "galaxy" | "arctic"
  | "mist" | "stone" | "mahogany" | "wine"
  | "iridescent" | "nebula" | "lagoon" | "ultraviolet"
  | "sunset" | "opal" | "moonbow" | "peacock";

export const BACKGROUNDS: { id: BackgroundVariant; label: string }[] = [
  { id: "galaxy",   label: "Galaxy" },
  { id: "aurora",   label: "Aurora" },
  { id: "dusk",     label: "Dusk" },
  { id: "forest",   label: "Forest" },
  { id: "waves",    label: "Waves" },
  { id: "ember",    label: "Ember" },
  { id: "sakura",   label: "Sakura" },
  { id: "arctic",   label: "Arctic" },
  { id: "mist",     label: "Mist" },
  { id: "stone",    label: "Stone" },
  { id: "mahogany", label: "Mahogany" },
  { id: "wine",     label: "Wine" },
  { id: "iridescent", label: "Iridescent" },
  { id: "nebula",     label: "Nebula" },
  { id: "lagoon",     label: "Lagoon" },
  { id: "ultraviolet", label: "Ultraviolet" },
  { id: "sunset",     label: "Sunset" },
  { id: "opal",       label: "Opal" },
  { id: "moonbow",    label: "Moonbow" },
  { id: "peacock",    label: "Peacock" },
];

const STATIC_VARIANTS = [
  "aurora", "dusk", "forest", "ember", "sakura", "galaxy",
  "arctic", "mist", "stone", "mahogany", "wine", "iridescent",
  "nebula", "lagoon", "ultraviolet", "sunset", "opal", "moonbow",
  "peacock",
] as const;

interface Props {
  variant: BackgroundVariant;
  image?: string | null;
  blur?: number;
}

export function Background({ variant, image, blur = 0 }: Props) {
  const blurPx = Math.max(0, Math.min(40, blur));
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Static gradient themes */}
      {STATIC_VARIANTS.map((v) => (
        <div
          key={v}
          className={`absolute inset-0 transition-opacity duration-1000 bg-${v} ${
            variant === v && !image ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Waves — animated */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          variant === "waves" && !image ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, oklch(0.4 0.1 220 / 0.7), transparent 60%), linear-gradient(180deg, oklch(0.15 0.04 240), oklch(0.2 0.06 220))",
        }}
      >
        <div
          className="absolute inset-0 animate-wave opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 70%, oklch(0.6 0.15 200 / 0.4), transparent 70%)",
          }}
        />
      </div>

      {/* Custom image layer */}
      <div
        className={`absolute transition-opacity duration-1000 ${image ? "opacity-100" : "opacity-0"}`}
        style={{
          inset: blurPx > 0 ? `-${Math.ceil(blurPx * 2)}px` : 0,
          backgroundImage: image ? `url(${image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          imageRendering: "auto",
          filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
          willChange: blurPx > 0 ? "filter" : undefined,
        }}
      />

      {/* Readability overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000"
        style={{
          background: image
            ? "linear-gradient(180deg, oklch(0 0 0 / 0.35), oklch(0 0 0 / 0.55))"
            : "radial-gradient(ellipse at center, transparent 40%, oklch(0 0 0 / 0.5) 100%)",
        }}
      />
    </div>
  );
}
