import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Background } from "@/components/Background";
import { SoundDock } from "@/components/SoundDock";
import { Timer } from "@/components/Timer";
import { SettingsPanel } from "@/components/SettingsPanel";
import { TodayTasks } from "@/components/TodayTasks";
import { ProfileModal } from "@/components/ProfileModal";
import { useAudioMixer } from "@/hooks/useAudioMixer";
import { useCustomTracks } from "@/hooks/useCustomTracks";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useDailyTasks } from "@/hooks/useDailyTasks";
import { useFinishSound } from "@/hooks/useFinishSound";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/context/AuthContext";
import { translations } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: FocusSpace,
  head: () => ({
    meta: [
      { title: "Earth Flow — Ambient sounds & focus timer" },
      {
        name: "description",
        content:
          "A calm focus space combining an ambient sound mixer and a customizable Pomodoro timer. Mix rain, forest, waves and set your own background.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
  }),
});

function FocusSpace() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-background">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
      </div>
    );
  }

  if (!user) return null;

  return <FocusSpaceContent userId={user.id} userEmail={user.email ?? ""} />;
}

function FocusSpaceContent({ userId, userEmail }: { userId: string; userEmail: string }) {
  const { signOut, updateDisplayName, uploadAvatar, user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [headerImgError, setHeaderImgError] = useState(false);
  const {
    durations,
    setDurations,
    lunchEnabled,
    setLunchEnabled,
    bgVariant,
    setBgVariant,
    bgImage,
    setBgImage,
    bgBlur,
    setBgBlur,
    timerRingStyle,
    setTimerRingStyle,
    customTimerRingColor,
    setCustomTimerRingColor,
    timerRingWidth,
    setTimerRingWidth,
    timerFontStyle,
    setTimerFontStyle,
    timerFontSize,
    setTimerFontSize,
    stopSoundsOnTimerEnd,
    setStopSoundsOnTimerEnd,
  } = useSettings(userId);
  const copy = translations.en;
  const { tracks, toggle, setVolume, stopAll } = useAudioMixer();
  const {
    tracks: customTracks,
    toggle: customToggle,
    setVolume: customSetVolume,
    removeTrack: customRemove,
    addFromFile: customAddFromFile,
    addFromUrl: customAddFromUrl,
    stopAll: customStopAll,
  } = useCustomTracks();
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
  } = useBrowserNotifications();
  const { tasks, doneCount, completedRecords, chartArchive, chartHiddenLevel, categories, addTask, toggleTask, removeTask, clearDone, removeFromChart, addCategory, renameCategory, removeCategory, setTaskCategory } =
    useDailyTasks(userId);
  const activeCount = tracks.filter((t) => t.enabled).length;
  const completeTimer = useCallback(() => {
    playFinishSound();
    notifyTimerComplete();
    if (stopSoundsOnTimerEnd) { stopAll(); customStopAll(); }
  }, [notifyTimerComplete, playFinishSound, stopAll, stopSoundsOnTimerEnd]);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  useEffect(() => { setHeaderImgError(false); }, [avatarUrl]);
  const avatarLetter = (displayName || userEmail).charAt(0).toUpperCase();

  return (
    <div className="dark relative min-h-screen w-full flex flex-col text-foreground">
      <Background variant={bgVariant} image={bgImage} blur={bgBlur} />

      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
          <span className="text-sm tracking-wide">
            <span className="font-display text-base">Earth</span>
            <span className="text-muted-foreground"> Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="h-9 px-4 rounded-full glass text-xs inline-flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Settings size={14} />
            {copy.settings}
          </button>
          <button
            onClick={() => setProfileOpen(true)}
            title={userEmail}
            className="h-9 w-9 rounded-full glass border border-border inline-flex items-center justify-center text-xs font-semibold hover:border-primary transition-colors overflow-hidden"
          >
            {avatarUrl && !headerImgError ? (
              <img
                src={avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setHeaderImgError(true)}
              />
            ) : (
              avatarLetter
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 pt-8 pb-10 lg:px-10 lg:pt-4">
        <h1 className="sr-only">Earth Flow — ambient sounds and focus timer</h1>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(280px,1fr)_minmax(320px,420px)]">
          <div className="flex justify-center lg:justify-end">
            <Timer
              durations={durations}
              lunchEnabled={lunchEnabled}
              onComplete={completeTimer}
              ringStyle={timerRingStyle}
              ringWidth={timerRingWidth}
              fontStyle={timerFontStyle}
              fontSize={timerFontSize}
              copy={copy}
            />
          </div>
          <div className="flex justify-center lg:justify-start">
            <TodayTasks
              tasks={tasks}
              doneCount={doneCount}
              completedRecords={completedRecords}
              chartArchive={chartArchive}
              chartHiddenLevel={chartHiddenLevel}
              categories={categories}
              onAdd={addTask}
              onToggle={toggleTask}
              onRemove={removeTask}
              onClearDone={clearDone}
              onRemoveFromChart={removeFromChart}
              onAddCategory={addCategory}
              onRenameCategory={renameCategory}
              onRemoveCategory={removeCategory}
              onSetTaskCategory={setTaskCategory}
              copy={copy}
            />
          </div>
        </div>

        <div className="mt-8 md:mt-10">
          <SoundDock
            activeCount={activeCount}
            tracks={tracks}
            onToggleTrack={toggle}
            onVolumeTrack={setVolume}
            onStopAll={stopAll}
            customTracks={customTracks}
            onCustomToggle={customToggle}
            onCustomVolume={customSetVolume}
            onCustomRemove={customRemove}
            onAddFromFile={customAddFromFile}
            copy={copy}
          />
        </div>
      </main>

      <footer className="absolute bottom-4 right-6 text-[11px] text-muted-foreground/40 select-none pointer-events-none tabular-nums">
        v3.2.0
      </footer>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        email={userEmail}
        displayName={displayName}
        avatarUrl={avatarUrl}
        onUpdateDisplayName={async (name) => { await updateDisplayName(name); }}
        onUploadAvatar={async (file) => { await uploadAvatar(file); }}
        onSignOut={async () => { await signOut(); }}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        durations={durations}
        setDurations={setDurations}
        lunchEnabled={lunchEnabled}
        setLunchEnabled={setLunchEnabled}
        stopSoundsOnTimerEnd={stopSoundsOnTimerEnd}
        setStopSoundsOnTimerEnd={setStopSoundsOnTimerEnd}
        bgVariant={bgVariant}
        setBgVariant={setBgVariant}
        bgImage={bgImage}
        setBgImage={setBgImage}
        bgBlur={bgBlur}
        setBgBlur={setBgBlur}
        timerRingStyleId={timerRingStyle.id}
        customTimerRingColor={customTimerRingColor}
        setCustomTimerRingColor={setCustomTimerRingColor}
        timerRingWidth={timerRingWidth}
        setTimerRingStyle={setTimerRingStyle}
        setTimerRingWidth={setTimerRingWidth}
        timerFontStyleId={timerFontStyle.id}
        setTimerFontStyle={setTimerFontStyle}
        timerFontSize={timerFontSize}
        setTimerFontSize={setTimerFontSize}
        finishSounds={finishSounds}
        selectedFinishSoundId={selectedSoundId}
        customFinishSoundName={customSound?.name ?? null}
        onSelectFinishSound={setSelectedSoundId}
        onUploadFinishSound={uploadCustomSound}
        onClearCustomFinishSound={clearCustomSound}
        onPreviewFinishSound={playFinishSound}
        notificationPermission={notificationPermission}
        onRequestNotifications={() => void requestNotificationPermission()}
        copy={copy}
      />
    </div>
  );
}
