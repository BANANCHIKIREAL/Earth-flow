/* eslint-disable react-refresh/only-export-components -- Intentional icon component barrel. */
import {
  forwardRef,
  useEffect,
  useId,
  useState,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import { MorphIcon as MorphIconPrimitive, type MorphIconProps } from "morphicons/react";
import {
  AlertCircle as AlertCircleData,
  ArrowLeft as ArrowLeftData,
  ArrowRight as ArrowRightData,
  AudioLines,
  AudioWaveform,
  BarChart3 as BarChart3Data,
  Bell as BellData,
  BellRing as BellRingData,
  Bird as BirdData,
  BookMarked,
  BookOpen as BookOpenData,
  Bug as BugData,
  CalendarCheck,
  CalendarDays as CalendarDaysData,
  Camera as CameraData,
  ChartNoAxesColumnIncreasing,
  ChartSpline,
  Check as CheckData,
  ChevronDown as ChevronDownData,
  ChevronLeft as ChevronLeftData,
  ChevronRight as ChevronRightData,
  ChevronUp as ChevronUpData,
  Circle as CircleData,
  CircleAlert,
  CircleArrowLeft,
  CircleArrowRight,
  CircleCheck,
  CircleChevronDown,
  CircleChevronLeft,
  CircleChevronRight,
  CircleChevronUp,
  CircleEllipsis,
  CircleMinus,
  CirclePlus,
  CircleX,
  Cloud as CloudData,
  CloudCheck,
  CloudCog,
  CloudLightning as CloudLightningData,
  CloudOff as CloudOffData,
  CloudRain as CloudRainData,
  CloudRainWind,
  CloudUpload as CloudUploadData,
  Coffee as CoffeeData,
  CupSoda,
  DoorOpen,
  Droplet as DropletData,
  Eye as EyeData,
  EyeClosed,
  EyeOff as EyeOffData,
  Feather,
  FileUp,
  Flame as FlameData,
  FlameKindling,
  Focus as FocusData,
  GripVertical as GripVerticalData,
  HardDrive as HardDriveData,
  Hash as HashData,
  Image as ImageData,
  Images,
  KeyRound as KeyRoundData,
  Layers3 as Layers3Data,
  Leaf as LeafData,
  ListChecks,
  ListTodo as ListTodoData,
  Loader2 as Loader2Data,
  LogOut as LogOutData,
  Mail as MailData,
  Minus as MinusData,
  Moon as MoonData,
  MoonStar as MoonStarData,
  MoreHorizontal as MoreHorizontalData,
  Mountain as MountainData,
  MountainSnow,
  Music as MusicData,
  Paintbrush,
  Palette as PaletteData,
  PanelLeft as PanelLeftData,
  PanelLeftOpen,
  PanelsTopLeft,
  Pause as PauseData,
  PenLine,
  Pencil as PencilData,
  PieChart as PieChartData,
  Plane as PlaneData,
  PlaneTakeoff,
  Play as PlayData,
  Plus as PlusData,
  RefreshCcw,
  RotateCcw as RotateCcwData,
  Scan,
  ScanEye,
  ScanSearch,
  Search as SearchData,
  Send,
  Settings as SettingsData,
  Shield,
  ShieldCheck as ShieldCheckData,
  SlidersHorizontal,
  Sparkles as SparklesData,
  Speaker as SpeakerData,
  Sprout,
  Sun as SunData,
  Tag as TagData,
  Tags,
  Timer as TimerData,
  TimerReset,
  Tornado,
  Trash2 as Trash2Data,
  TreeDeciduous as TreeDeciduousData,
  Trees,
  Upload as UploadData,
  User as UserData,
  UserRound,
  Users as UsersData,
  UsersRound,
  Volume2,
  VolumeOff,
  VolumeX as VolumeXData,
  WandSparkles as WandSparklesData,
  Waves as WavesData,
  Wind as WindData,
  X as XData,
  Zap as ZapData,
  type IconNode,
} from "lucide";

type AppIconProps = Omit<MorphIconProps, "icon" | "from" | "to" | "progress">;
export type LucideIcon = ForwardRefExoticComponent<AppIconProps & RefAttributes<SVGSVGElement>>;

const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  "[role='button']",
  "[role='menuitem']",
  "[role='option']",
  "[role='checkbox']",
  "[role='radio']",
  "[data-radix-collection-item]",
].join(",");

function createInteractiveIcon(name: string, icon: IconNode, hoverIcon: IconNode = icon) {
  const Component = forwardRef<SVGSVGElement, AppIconProps>(function InteractiveMorphIcon(
    { className, ...props },
    forwardedRef,
  ) {
    const instanceId = useId();
    const [engaged, setEngaged] = useState(false);

    useEffect(() => {
      const svg = document.querySelector<SVGSVGElement>(
        `[data-morph-icon-instance="${instanceId}"]`,
      );

      if (!svg) return;

      if (typeof forwardedRef === "function") forwardedRef(svg);
      else if (forwardedRef) forwardedRef.current = svg;

      const target = svg.closest<HTMLElement>(INTERACTIVE_SELECTOR);
      if (!target || hoverIcon === icon) {
        return () => {
          if (typeof forwardedRef === "function") forwardedRef(null);
          else if (forwardedRef) forwardedRef.current = null;
        };
      }

      const engage = () => {
        if (!target.matches(":disabled, [aria-disabled='true']")) setEngaged(true);
      };
      const disengage = () => setEngaged(false);
      const syncEngagement = () => {
        setEngaged(target.matches(":hover") || target.contains(document.activeElement));
      };
      const onFocusOut = (event: FocusEvent) => {
        if (!target.contains(event.relatedTarget as Node | null)) syncEngagement();
      };

      target.addEventListener("pointerenter", engage);
      target.addEventListener("pointerleave", disengage);
      target.addEventListener("pointerdown", engage);
      target.addEventListener("pointerup", syncEngagement);
      target.addEventListener("pointercancel", syncEngagement);
      target.addEventListener("focusin", engage);
      target.addEventListener("focusout", onFocusOut);

      return () => {
        target.removeEventListener("pointerenter", engage);
        target.removeEventListener("pointerleave", disengage);
        target.removeEventListener("pointerdown", engage);
        target.removeEventListener("pointerup", syncEngagement);
        target.removeEventListener("pointercancel", syncEngagement);
        target.removeEventListener("focusin", engage);
        target.removeEventListener("focusout", onFocusOut);
        if (typeof forwardedRef === "function") forwardedRef(null);
        else if (forwardedRef) forwardedRef.current = null;
      };
    }, [forwardedRef, instanceId]);

    return (
      <MorphIconPrimitive
        icon={engaged ? hoverIcon : icon}
        spring="smooth"
        reducedMotion="user"
        className={className}
        data-morph-icon-instance={instanceId}
        {...props}
      />
    );
  });

  Component.displayName = name;
  return Component;
}

export const AlertCircle = createInteractiveIcon("AlertCircle", AlertCircleData, CircleAlert);
export const ArrowLeft = createInteractiveIcon("ArrowLeft", ArrowLeftData, CircleArrowLeft);
export const ArrowRight = createInteractiveIcon("ArrowRight", ArrowRightData, CircleArrowRight);
export const BarChart3 = createInteractiveIcon("BarChart3", BarChart3Data, ChartNoAxesColumnIncreasing);
export const Bell = createInteractiveIcon("Bell", BellData, BellRingData);
export const BellRing = createInteractiveIcon("BellRing", BellRingData, BellData);
export const Bird = createInteractiveIcon("Bird", BirdData, Feather);
export const BookOpen = createInteractiveIcon("BookOpen", BookOpenData, BookMarked);
export const Bug = createInteractiveIcon("Bug", BugData, AudioWaveform);
export const CalendarDays = createInteractiveIcon("CalendarDays", CalendarDaysData, CalendarCheck);
export const Camera = createInteractiveIcon("Camera", CameraData, Images);
export const Check = createInteractiveIcon("Check", CheckData, CircleCheck);
export const ChevronDown = createInteractiveIcon("ChevronDown", ChevronDownData, CircleChevronDown);
export const ChevronDownIcon = ChevronDown;
export const ChevronLeft = createInteractiveIcon("ChevronLeft", ChevronLeftData, CircleChevronLeft);
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRight = createInteractiveIcon("ChevronRight", ChevronRightData, CircleChevronRight);
export const ChevronRightIcon = ChevronRight;
export const ChevronUp = createInteractiveIcon("ChevronUp", ChevronUpData, CircleChevronUp);
export const Circle = createInteractiveIcon("Circle", CircleData, CircleCheck);
export const Cloud = createInteractiveIcon("Cloud", CloudData, CloudCog);
export const CloudLightning = createInteractiveIcon("CloudLightning", CloudLightningData, CloudRainWind);
export const CloudOff = createInteractiveIcon("CloudOff", CloudOffData, CloudData);
export const CloudRain = createInteractiveIcon("CloudRain", CloudRainData, CloudRainWind);
export const CloudUpload = createInteractiveIcon("CloudUpload", CloudUploadData, CloudCheck);
export const Coffee = createInteractiveIcon("Coffee", CoffeeData, CupSoda);
export const Droplet = createInteractiveIcon("Droplet", DropletData, WavesData);
export const Eye = createInteractiveIcon("Eye", EyeData, ScanEye);
export const EyeOff = createInteractiveIcon("EyeOff", EyeOffData, EyeClosed);
export const Flame = createInteractiveIcon("Flame", FlameData, FlameKindling);
export const Focus = createInteractiveIcon("Focus", FocusData, Scan);
export const GripVertical = createInteractiveIcon("GripVertical", GripVerticalData, MoreHorizontalData);
export const HardDrive = createInteractiveIcon("HardDrive", HardDriveData, CloudUploadData);
export const Hash = createInteractiveIcon("Hash", HashData, Tags);
export const Image = createInteractiveIcon("Image", ImageData, Images);
export const KeyRound = createInteractiveIcon("KeyRound", KeyRoundData, Shield);
export const Layers3 = createInteractiveIcon("Layers3", Layers3Data, PanelsTopLeft);
export const Leaf = createInteractiveIcon("Leaf", LeafData, Sprout);
export const ListTodo = createInteractiveIcon("ListTodo", ListTodoData, ListChecks);
export const Loader2 = createInteractiveIcon("Loader2", Loader2Data);
export const LogOut = createInteractiveIcon("LogOut", LogOutData, DoorOpen);
export const Mail = createInteractiveIcon("Mail", MailData, Send);
export const Minus = createInteractiveIcon("Minus", MinusData, CircleMinus);
export const Moon = createInteractiveIcon("Moon", MoonData, MoonStarData);
export const MoonStar = createInteractiveIcon("MoonStar", MoonStarData, MoonData);
export const MoreHorizontal = createInteractiveIcon("MoreHorizontal", MoreHorizontalData, CircleEllipsis);
export const Mountain = createInteractiveIcon("Mountain", MountainData, MountainSnow);
export const Music = createInteractiveIcon("Music", MusicData, AudioLines);
export const Palette = createInteractiveIcon("Palette", PaletteData, Paintbrush);
export const PanelLeft = createInteractiveIcon("PanelLeft", PanelLeftData, PanelLeftOpen);
export const Pause = createInteractiveIcon("Pause", PauseData, PlayData);
export const Pencil = createInteractiveIcon("Pencil", PencilData, PenLine);
export const PieChart = createInteractiveIcon("PieChart", PieChartData, ChartSpline);
export const Plane = createInteractiveIcon("Plane", PlaneData, PlaneTakeoff);
export const Play = createInteractiveIcon("Play", PlayData, PauseData);
export const Plus = createInteractiveIcon("Plus", PlusData, CirclePlus);
export const RotateCcw = createInteractiveIcon("RotateCcw", RotateCcwData, RefreshCcw);
export const Search = createInteractiveIcon("Search", SearchData, ScanSearch);
export const Settings = createInteractiveIcon("Settings", SettingsData, SlidersHorizontal);
export const ShieldCheck = createInteractiveIcon("ShieldCheck", ShieldCheckData, Shield);
export const Sparkles = createInteractiveIcon("Sparkles", SparklesData, WandSparklesData);
export const Speaker = createInteractiveIcon("Speaker", SpeakerData, Volume2);
export const Sun = createInteractiveIcon("Sun", SunData, SparklesData);
export const Tag = createInteractiveIcon("Tag", TagData, Tags);
export const Timer = createInteractiveIcon("Timer", TimerData, TimerReset);
export const Trash2 = createInteractiveIcon("Trash2", Trash2Data, CircleX);
export const TreeDeciduous = createInteractiveIcon("TreeDeciduous", TreeDeciduousData, Trees);
export const Upload = createInteractiveIcon("Upload", UploadData, FileUp);
export const User = createInteractiveIcon("User", UserData, UserRound);
export const Users = createInteractiveIcon("Users", UsersData, UsersRound);
export const VolumeX = createInteractiveIcon("VolumeX", VolumeXData, VolumeOff);
export const WandSparkles = createInteractiveIcon("WandSparkles", WandSparklesData, SparklesData);
export const Waves = createInteractiveIcon("Waves", WavesData, AudioWaveform);
export const Wind = createInteractiveIcon("Wind", WindData, Tornado);
export const X = createInteractiveIcon("X", XData, CircleX);
export const Zap = createInteractiveIcon("Zap", ZapData, SparklesData);
