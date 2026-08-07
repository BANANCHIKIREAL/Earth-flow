import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { Background } from "@/components/Background";
import { SoundDock } from "@/components/SoundDock";
import { Timer } from "@/components/Timer";
import { useAudioMixer } from "@/hooks/useAudioMixer";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useFinishSound } from "@/hooks/useFinishSound";
import { useSettings } from "@/hooks/useSettings";
import type { TimerPhase } from "@/hooks/useTimer";
import { translations } from "@/lib/i18n";

const SITE_URL = "https://earthflow.pro";

// Minimal, chrome-free version of the focus space meant to be embedded as an
// iframe widget (e.g. in Notion). No nav/header/footer/auth/tasks/custom
// tracks/settings panel — just the timer, a curated half of the built-in
// sounds, and the background. "Settings" opens the real site in a new tab
// instead of a local panel. Deliberately overrides the root route's OG meta
// so hosts that sniff og:* (like Notion) render an actual iframe instead of
// a bookmark card.
export const Route = createFileRoute("/embed")({
  component: EmbedWidget,
  head: () => ({
    meta: [
      { title: "Earth Flow" },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "" },
      { property: "og:description", content: "" },
      { property: "og:image", content: "" },
      { property: "og:url", content: "" },
      { property: "og:type", content: "" },
      { name: "twitter:card", content: "" },
      { name: "twitter:image", content: "" },
      { name: "description", content: "" },
    ],
  }),
});

function EmbedWidget() {
  const copy = translations.en;

  const {
    durations,
    lunchEnabled,
    bgVariant,
    bgImage,
    bgBlur,
    timerRingStyle,
    timerRingWidth,
    timerFontStyle,
    timerFontSize,
    stopSoundsOnTimerEnd,
  } = useSettings(undefined);

  const { tracks, toggle, setVolume, stopAll } = useAudioMixer();
  const { playFinishSound } = useFinishSound();
  const { notifyTimerComplete } = useBrowserNotifications();

  // Widget is compact — show half the built-in sounds so cards have room to
  // breathe instead of cramming all of them into a narrow iframe.
  const visibleTracks = useMemo(
    () => tracks.slice(0, Math.ceil(tracks.length / 2)),
    [tracks],
  );
  const activeCount = visibleTracks.filter((t) => t.enabled).length;

  const completeTimer = useCallback(
    (phase: TimerPhase) => {
      playFinishSound();
      notifyTimerComplete(phase);
      if (stopSoundsOnTimerEnd) stopAll();
    },
    [notifyTimerComplete, playFinishSound, stopAll, stopSoundsOnTimerEnd],
  );

  const openFullSite = useCallback(() => {
    window.open(SITE_URL, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="dark relative min-h-screen w-full flex flex-col items-center justify-center text-foreground overflow-hidden">
      <Background variant={bgVariant} image={bgImage} blur={bgBlur} />

      <main className="flex flex-col items-center gap-8 px-4 py-8 w-full max-w-2xl">
        <div className="w-full max-w-md mx-auto flex justify-center">
          <Timer
            durations={durations} lunchEnabled={lunchEnabled} onComplete={completeTimer}
            ringStyle={timerRingStyle} ringWidth={timerRingWidth}
            fontStyle={timerFontStyle} fontSize={timerFontSize}
            onOpenSettings={openFullSite} copy={copy}
          />
        </div>
        <SoundDock
          activeCount={activeCount} tracks={visibleTracks} onToggleTrack={toggle}
          onVolumeTrack={setVolume} onStopAll={stopAll} showCustom={false}
          showTrackStatus={false}
          copy={copy}
          columns={5}
        />
      </main>
    </div>
  );
}
