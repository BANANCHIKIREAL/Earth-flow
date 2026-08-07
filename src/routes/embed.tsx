import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Background } from "@/components/Background";
import { SoundDock } from "@/components/SoundDock";
import { Timer } from "@/components/Timer";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useAudioMixer } from "@/hooks/useAudioMixer";
import { useCustomTracks } from "@/hooks/useCustomTracks";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useFinishSound } from "@/hooks/useFinishSound";
import { useSettings } from "@/hooks/useSettings";
import type { TimerPhase } from "@/hooks/useTimer";
import { translations } from "@/lib/i18n";

// Minimal, chrome-free version of the focus space meant to be embedded as an
// iframe widget (e.g. in Notion). No nav/header/footer/auth/tasks — just the
// timer, sound mixer, timer settings, and background. Deliberately overrides
// the root route's OG meta so hosts that sniff og:* (like Notion) render an
// actual iframe instead of a bookmark card.
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const copy = translations.en;

  const {
    durations, setDurations,
    lunchEnabled, setLunchEnabled,
    bgVariant, setBgVariant,
    bgImage, setBgImage,
    bgBlur, setBgBlur,
    timerRingStyle, setTimerRingStyle,
    customTimerRingColor, setCustomTimerRingColor,
    timerRingWidth, setTimerRingWidth,
    timerFontStyle, setTimerFontStyle,
    timerFontSize, setTimerFontSize,
    stopSoundsOnTimerEnd, setStopSoundsOnTimerEnd,
    layout, setLayout,
  } = useSettings(undefined);

  const { tracks, toggle, setVolume, stopAll } = useAudioMixer();
  const {
    tracks: customTracks,
    toggle: customToggle,
    setVolume: customSetVolume,
    removeTrack: customRemove,
    addFromFile: customAddFromFile,
    stopAll: customStopAll,
    syncEnabled: customSoundSyncEnabled,
    setSyncEnabled: setCustomSoundSyncEnabled,
    syncTrack: syncCustomTrack,
    cloudCount: customSoundCloudCount,
    cloudBytes: customSoundCloudBytes,
    maxCloudBytes: customSoundMaxCloudBytes,
    isSyncBusy: customSoundSyncBusy,
  } = useCustomTracks(undefined);

  const {
    finishSounds,
    selectedSoundId,
    customSound,
    setSelectedSoundId,
    uploadCustomSound,
    clearCustomSound,
    playFinishSound,
  } = useFinishSound();
  const {
    notificationPermission,
    requestNotificationPermission,
    notifyTimerComplete,
    previewNotification,
  } = useBrowserNotifications();

  const activeCount = tracks.filter((t) => t.enabled).length;

  const completeTimer = useCallback(
    (phase: TimerPhase) => {
      playFinishSound();
      notifyTimerComplete(phase);
      if (stopSoundsOnTimerEnd) {
        stopAll();
        customStopAll();
      }
    },
    [customStopAll, notifyTimerComplete, playFinishSound, stopAll, stopSoundsOnTimerEnd],
  );

  return (
    <div className="dark relative min-h-screen w-full flex flex-col items-center justify-center text-foreground overflow-hidden">
      <Background variant={bgVariant} image={bgImage} blur={bgBlur} />

      <main className="flex flex-col items-center gap-8 px-4 py-8 w-full max-w-md">
        <Timer
          durations={durations} lunchEnabled={lunchEnabled} onComplete={completeTimer}
          ringStyle={timerRingStyle} ringWidth={timerRingWidth}
          fontStyle={timerFontStyle} fontSize={timerFontSize}
          onOpenSettings={() => setSettingsOpen(true)} copy={copy}
        />
        <SoundDock
          activeCount={activeCount} tracks={tracks} onToggleTrack={toggle}
          onVolumeTrack={setVolume} onStopAll={stopAll} customTracks={customTracks}
          onCustomToggle={customToggle} onCustomVolume={customSetVolume}
          onCustomRemove={customRemove} onAddFromFile={customAddFromFile} copy={copy}
          syncEnabled={customSoundSyncEnabled} canSync={false}
          onCustomSync={syncCustomTrack}
          columns={5}
        />
      </main>

      <SettingsPanel
        open={settingsOpen} onClose={() => setSettingsOpen(false)}
        durations={durations} setDurations={setDurations}
        lunchEnabled={lunchEnabled} setLunchEnabled={setLunchEnabled}
        stopSoundsOnTimerEnd={stopSoundsOnTimerEnd} setStopSoundsOnTimerEnd={setStopSoundsOnTimerEnd}
        bgVariant={bgVariant} setBgVariant={setBgVariant}
        bgImage={bgImage} setBgImage={setBgImage}
        bgBlur={bgBlur} setBgBlur={setBgBlur}
        timerRingStyleId={timerRingStyle.id} customTimerRingColor={customTimerRingColor}
        setCustomTimerRingColor={setCustomTimerRingColor} timerRingWidth={timerRingWidth}
        setTimerRingStyle={setTimerRingStyle} setTimerRingWidth={setTimerRingWidth}
        timerFontStyleId={timerFontStyle.id} setTimerFontStyle={setTimerFontStyle}
        timerFontSize={timerFontSize} setTimerFontSize={setTimerFontSize}
        finishSounds={finishSounds} selectedFinishSoundId={selectedSoundId}
        customFinishSoundName={customSound?.name ?? null}
        onSelectFinishSound={setSelectedSoundId} onUploadFinishSound={uploadCustomSound}
        onClearCustomFinishSound={clearCustomSound} onPreviewFinishSound={playFinishSound}
        notificationPermission={notificationPermission}
        onRequestNotifications={() => void requestNotificationPermission()}
        onPreviewNotification={previewNotification}
        layout={layout} setLayout={setLayout}
        customSoundSyncEnabled={customSoundSyncEnabled}
        onSetCustomSoundSyncEnabled={setCustomSoundSyncEnabled}
        customSoundCloudCount={customSoundCloudCount}
        customSoundCloudBytes={customSoundCloudBytes}
        customSoundMaxCloudBytes={customSoundMaxCloudBytes}
        customSoundSyncBusy={customSoundSyncBusy}
        copy={copy}
      />
    </div>
  );
}
