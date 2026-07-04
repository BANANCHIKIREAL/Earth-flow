import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Background } from "@/components/Background";
import { SoundDock } from "@/components/SoundDock";
import { Timer } from "@/components/Timer";
import { SettingsPanel } from "@/components/SettingsPanel";
import { TodayTasks } from "@/components/TodayTasks";
import { ProfileModal, getMilestone } from "@/components/ProfileModal";
import { useAudioMixer } from "@/hooks/useAudioMixer";
import { useCustomTracks } from "@/hooks/useCustomTracks";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useDailyTasks } from "@/hooks/useDailyTasks";
import { useFinishSound } from "@/hooks/useFinishSound";
import { useSettings, clearLocalSettings } from "@/hooks/useSettings";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { useStreak } from "@/hooks/useStreak";
import { useAuth } from "@/context/AuthContext";
import { translations } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { STREAK_ENABLED } from "@/lib/flags";
import { Tutorial, useTutorial } from "@/components/Tutorial";

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

  return <FocusSpaceContent key={user?.id ?? "guest"} userId={user?.id} userEmail={user?.email ?? ""} />;
}

function FocusSpaceContent({ userId, userEmail }: { userId?: string; userEmail: string }) {
  const { signOut, updateDisplayName, uploadAvatar, user } = useAuth();
  const isGuest = !user;
  useSessionTracker(user ?? null);
  const streak = useStreak(userId);
  const { show: tutorialShow, complete: tutorialComplete } = useTutorial();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [headerImgError, setHeaderImgError] = useState(false);
  const [userNumber, setUserNumber] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_profiles")
      .select("user_number")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => { if (data) setUserNumber(data.user_number); });
  }, [userId]);
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
    streak.recordSession();
    if (stopSoundsOnTimerEnd) { stopAll(); customStopAll(); }
  }, [notifyTimerComplete, playFinishSound, stopAll, stopSoundsOnTimerEnd, streak.recordSession]);

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

  const avatarBtn = (cls: string) => {
    const { m } = STREAK_ENABLED && streak.currentStreak > 0 ? getMilestone(streak.currentStreak) : { m: null };
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="relative">
          <button onClick={() => setProfileOpen(true)} title={userEmail} className={cls}>
            {avatarUrl && !headerImgError ? (
              <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setHeaderImgError(true)} />
            ) : avatarLetter}
          </button>
          {STREAK_ENABLED && streak.currentStreak === 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary animate-bounce-subtle pointer-events-none shadow-[0_0_6px_2px_var(--primary)]" />
          )}
        </div>
        {m && (
          <div className="flex items-center gap-0.5 pointer-events-none select-none leading-none">
            <span
              className={m.anim === "rainbow" ? "animate-flame-rainbow" : "animate-flame-badge"}
              style={{ fontSize: 11, filter: m.anim !== "rainbow" ? m.filter : undefined }}
            >🔥</span>
            <span
              className={m.anim === "rainbow" ? "animate-flame-rainbow text-[9px] font-bold tabular-nums" : "text-[9px] font-bold tabular-nums"}
              style={{ color: m.anim !== "rainbow" ? m.color : undefined }}
            >{streak.currentStreak}</span>
          </div>
        )}
      </div>
    );
  };

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
      fontStyle={timerFontStyle} fontSize={timerFontSize}
      onOpenSettings={() => setSettingsOpen(true)} copy={copy}
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
      userNumber={userNumber} email={userEmail} displayName={displayName} avatarUrl={avatarUrl} streak={streak}
      onUpdateDisplayName={async (name) => { await updateDisplayName(name); }}
      onUploadAvatar={uploadAvatar}
      onSignOut={async () => { clearLocalSettings(); await signOut(); }}
    />
  );

  /* ── SIDEBAR layout ── */
  if (layout === "sidebar") {
    return (
      <div className="dark relative min-h-screen w-full flex text-foreground overflow-hidden animate-app-enter">
        <Background variant={bgVariant} image={bgImage} blur={bgBlur} />

        <aside className="hidden panel:flex w-52 shrink-0 flex-col py-5 border-r border-white/[0.06] z-10 relative">
          <div className="px-5 mb-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft shrink-0" />
              <span className="text-sm tracking-wide">
                <span className="font-display text-base">Earth</span>
                <span className="text-muted-foreground"> Flow</span>
              </span>
            </Link>
          </div>
          <div className="px-3 space-y-0.5">
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
                <div className="relative shrink-0">
                  <div className="h-6 w-6 rounded-full bg-white/10 border border-white/15 inline-flex items-center justify-center text-[10px] font-semibold overflow-hidden">
                    {avatarUrl && !headerImgError ? (<img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setHeaderImgError(true)} />) : avatarLetter}
                  </div>
                  {STREAK_ENABLED && streak.currentStreak === 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-bounce-subtle pointer-events-none shadow-[0_0_5px_2px_var(--primary)]" />
                  )}
                </div>
                <span className="truncate text-xs">{displayName || userEmail}</span>
                {STREAK_ENABLED && streak.currentStreak > 0 && (() => {
                  const { m } = getMilestone(streak.currentStreak);
                  return (
                    <span className="ml-auto flex items-center gap-0.5 shrink-0 pointer-events-none select-none">
                      <span
                        className={m.anim === "rainbow" ? "animate-flame-rainbow" : "animate-flame-badge"}
                        style={{ fontSize: 12, filter: m.anim !== "rainbow" ? m.filter : undefined }}
                      >🔥</span>
                      <span
                        className={m.anim === "rainbow" ? "animate-flame-rainbow text-[10px] font-bold tabular-nums" : "text-[10px] font-bold tabular-nums"}
                        style={{ color: m.anim !== "rainbow" ? m.color : undefined }}
                      >{streak.currentStreak}</span>
                    </span>
                  );
                })()}
              </button>
            )}
          </div>
          <div className="flex-1" />
          <div className="px-5 mb-1"><span className="text-[10px] text-muted-foreground/30 tabular-nums select-none">v4.1.0</span></div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <header className="panel:hidden flex items-center justify-between px-5 py-4 border-b border-white/[0.06] relative z-10">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
                <span className="text-sm tracking-wide"><span className="font-display text-base">Earth</span><span className="text-muted-foreground"> Flow</span></span>
              </Link>
              </div>
            <div className="flex items-center gap-2">
              {isGuest ? guestAuthBtns : avatarBtn("h-9 w-9 rounded-full glass border border-border inline-flex items-center justify-center text-xs font-semibold hover:border-primary transition-colors overflow-hidden")}
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
            <h1 className="sr-only">Earth Flow — ambient sounds and focus timer</h1>
            {timerEl}
            <div className="panel:hidden mt-10 w-full max-w-md" data-tutorial="tasks"><TodayTasks {...taskProps} /></div>
          </main>

          <div className="px-5 pb-5 panel:px-6 panel:pb-6 relative z-10">{soundDockEl}</div>
        </div>

        <aside className="hidden panel:flex w-80 xl:w-96 shrink-0 flex-col py-5 px-4 border-l border-white/[0.06] z-10 relative overflow-y-auto" data-tutorial="tasks">
          <TodayTasks {...taskProps} />
        </aside>

        {!isGuest && profileModalEl}
        {settingsPanelEl}
        {tutorialShow && <Tutorial onComplete={tutorialComplete} />}
      </div>
    );
  }

  /* ── CLASSIC layout ── */
  return (
    <div className="dark relative min-h-screen w-full flex flex-col text-foreground animate-app-enter">
      <Background variant={bgVariant} image={bgImage} blur={bgBlur} />

      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-sm tracking-wide">
              <span className="font-display text-base">Earth</span>
              <span className="text-muted-foreground"> Flow</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {isGuest ? guestAuthBtns : avatarBtn("h-9 w-9 rounded-full glass border border-border inline-flex items-center justify-center text-xs font-semibold hover:border-primary transition-colors overflow-hidden")}
        </div>
      </header>

      <main className="flex-1 px-6 pt-8 pb-10 panel:px-10 panel:pt-4">
        <h1 className="sr-only">Earth Flow — ambient sounds and focus timer</h1>
        <div className="grid items-center gap-8 panel:grid-cols-[minmax(280px,1fr)_minmax(320px,420px)]">
          <div className="flex justify-center panel:justify-end">{timerEl}</div>
          <div className="flex justify-center panel:justify-start" data-tutorial="tasks"><TodayTasks {...taskProps} /></div>
        </div>
        <div className="mt-8 md:mt-10">{soundDockEl}</div>
      </main>

      <footer className="absolute bottom-4 right-6 text-[11px] text-muted-foreground/40 select-none pointer-events-none tabular-nums">v4.1.0</footer>

      {!isGuest && profileModalEl}
      {settingsPanelEl}
      {tutorialShow && <Tutorial onComplete={tutorialComplete} />}
    </div>
  );
}
