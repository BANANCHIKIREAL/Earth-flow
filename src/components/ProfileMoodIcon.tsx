import {
  Circle,
  Focus,
  Minus,
  MoonStar,
  Sparkles,
  Waves,
} from "lucide-react";
import type { ProfileMood } from "@/lib/profileCustomization";

interface Props {
  mood: ProfileMood;
  size?: number;
  strokeWidth?: number;
}

export function ProfileMoodIcon({ mood, size = 15, strokeWidth = 1.8 }: Props) {
  const props = { size, strokeWidth, "aria-hidden": true as const };

  switch (mood) {
    case "focus":
      return <Focus {...props} />;
    case "calm":
      return <Circle {...props} />;
    case "night":
      return <MoonStar {...props} />;
    case "flow":
      return <Waves {...props} />;
    case "spark":
      return <Sparkles {...props} />;
    default:
      return <Minus {...props} />;
  }
}
