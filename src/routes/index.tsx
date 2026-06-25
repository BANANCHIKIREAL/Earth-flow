import { createFileRoute, Link } from "@tanstack/react-router";
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
import { useSessionTracker } from "@/hooks/useSessionTracker";
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

  if (loading) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-background">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
      </div>
    );
  }

  return <FocusSpaceContent userId={user?.id} userEmail={user?.email ?? ""} />;
}

function FocusSpaceContent({ userId, userEmail }: { userId?: string; userEmail: string }) {
  const { signOut, updateDisplayName, uploadAvatar, user } = useAuth();
  const isGuest = !user;
  useSessionTracker(user ?? null);
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
    layout,
    setLayout,
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

  const taskProps = {
    tasks, doneCount, completedRecords, chartArchive, chartHiddenLevel, categories,
    onAdd: addTask, onToggle: toggleTask, onRemove: removeTask, onClearDone: clearDone,
    onRemoveFromChart: removeFromChart, onAddCategory: addCategory,
    onRenameCategory: renameCategory, onRemoveCategory: removeCategory,
    onSetTaskCategory: setTaskCategory, copy,
  };

  const avatarBtn = (cls: string) => (
    <button onClick={() => setProfileOpen(true)} title={userEmail} className={cls}>
      {avatarUrl && !headerImgError ? (
        <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setHeaderImgError(true)} />
      ) : avatarLetter}
    </button>
  );

  const guestAuthBtns = (
    <>
      <Link to="/login" className="h-9 px-4 rounded-full border border-white/15 text-xs inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
        Log in
      </Link>
      <Link to="/register" search={{ email: undefined }} className="h-9 px-4 rounded-full bg-foreground text-background text-xs inline-flex items-center font-semibold hover:bg-foreground/90 transition-colors">
        Sign up
      </Link>
    </>
  );

  const timerEl = (
    <Timer
      durations={durations} lunchEnabled={lunchEnabled} onComplete={completeTimer}
      ringStyle={timerRingStyle} ringWidth={timerRingWidth}
      fontStyle={timerFontStyle} fontSize={timerFontSize} copy={copy}
    />
  );

  const soundDockEl = (
    <SoundDock
      activeCount={activeCount} tracks={tracks} onToggleTrack={toggle}
      onVolumeTrack={setVolume} onStopAll={stopAll} customTracks={customTracks}
      onCustomToggle={customToggle} onCustomVolume={customSetVolume}
      onCustomRemove={customRemove} onAddFromFile={customAddFromFile} copy={copy}
    />
  );

  const settingsPanelEl = (
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
      layout={layout} setLayout={setLayout}
      copy={copy}
    />
  );

  const profileModalEl = (
    <ProfileModal
      open={profileOpen} onClose={() => setProfileOpen(false)}
      email={userEmail} displayName={displayName} avatarUrl={avatarUrl}
      onUpdateDisplayName={async (name) => { await updateDisplayName(name); }}
      onUploadAvatar={uploadAvatar}
      onSignOut={async () => { await signOut(); }}
    />
  );

  /* ── SIDEBAR layout ── */
  if (layout === "sidebar") {
    return (
      <div className="dark relative min-h-screen w-full flex text-foreground overflow-hidden">
        <Background variant={bgVariant} image={bgImage} blur={bgBlur} />

        <aside className="hidden lg:flex w-52 shrink-0 flex-col py-5 border-r border-white/[0.06] z-10 relative">
          <div className="px-5 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft shrink-0" />
              <span className="text-sm tracking-wide">
                <span className="font-display text-base">Earth</span>
                <span className="text-muted-foreground"> Flow</span>
              </span>
            </div>
          </div>
          <div className="px-3 space-y-0.5">
            <button onClick={() => setSettingsOpen(true)} className="w-full h-10 px-3 rounded-xl flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors">
              <Settings size={15} />{copy.settings}
            </button>
            {isGuest ? (
              <>
                <Link to="/login" className="w-full h-10 px-3 rounded-xl flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors">
                  Log in
                </Link>
                <Link to="/register" search={{ email: undefined }} className="w-full h-10 px-3 rounded-xl flex items-center text-sm bg-foreground/10 hover:bg-foreground/15 text-foreground font-medium transition-colors">
                  Sign up
                </Link>
              </>
            ) : (
              <button onClick={() => setProfileOpen(true)} title={userEmail} className="w-full h-10 px-3 rounded-xl flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors">
                <div className="h-6 w-6 rounded-full bg-white/10 border border-white/15 inline-flex items-center justify-center text-[10px] font-semibold shrink-0 overflow-hidden">
                  {avatarUrl && !headerImgError ? (<img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setHeaderImgError(true)} />) : avatarLetter}
                </div>
                <span className="truncate text-xs">{displayName || userEmail}</span>
              </button>
            )}
          </div>
          <div className="flex-1" />
          <div className="px-5 mb-1"><span className="text-[10px] text-muted-foreground/30 tabular-nums select-none">v3.3.5</span></div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-white/[0.06] relative z-10">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
              <span className="text-sm tracking-wide"><span className="font-display text-base">Earth</span><span className="text-muted-foreground"> Flow</span></span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSettingsOpen(true)} className="h-9 px-3 rounded-full glass text-xs inline-flex items-center gap-2 hover:text-primary transition-colors"><Settings size={14} />{copy.settings}</button>
              {isGuest ? guestAuthBtns : avatarBtn("h-9 w-9 rounded-full glass border border-border inline-flex items-center justify-center text-xs font-semibold hover:border-primary transition-colors overflow-hidden")}
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
            <h1 className="sr-only">Earth Flow — ambient sounds and focus timer</h1>
            {timerEl}
            <div className="lg:hidden mt-10 w-full max-w-md"><TodayTasks {...taskProps} /></div>
          </main>

          <div className="px-5 pb-5 lg:px-6 lg:pb-6 relative z-10">{soundDockEl}</div>
        </div>

        <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 flex-col py-5 px-4 border-l border-white/[0.06] z-10 relative overflow-y-auto">
          <TodayTasks {...taskProps} />
        </aside>

        {!isGuest && profileModalEl}
        {settingsPanelEl}
      </div>
    );
  }

  /* ── CLASSIC layout ── */
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
          <button onClick={() => setSettingsOpen(true)} className="h-9 px-4 rounded-full glass text-xs inline-flex items-center gap-2 hover:text-primary transition-colors">
            <Settings size={14} />{copy.settings}
          </button>
          {isGuest ? guestAuthBtns : avatarBtn("h-9 w-9 rounded-full glass border border-border inline-flex items-center justify-center text-xs font-semibold hover:border-primary transition-colors overflow-hidden")}
        </div>
      </header>

      <main className="flex-1 px-6 pt-8 pb-10 lg:px-10 lg:pt-4">
        <h1 className="sr-only">Earth Flow — ambient sounds and focus timer</h1>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(280px,1fr)_minmax(320px,420px)]">
          <div className="flex justify-center lg:justify-end">{timerEl}</div>
          <div className="flex justify-center lg:justify-start"><TodayTasks {...taskProps} /></div>
        </div>
        <div className="mt-8 md:mt-10">{soundDockEl}</div>
      </main>

      <footer className="absolute bottom-4 right-6 text-[11px] text-muted-foreground/40 select-none pointer-events-none tabular-nums">v3.3.5</footer>

      {!isGuest && profileModalEl}
      {settingsPanelEl}
    </div>
  );
}
