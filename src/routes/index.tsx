import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Background } from "@/components/Background";
import { AppLoadingSkeleton } from "@/components/AppLoadingSkeleton";
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
import type { TimerPhase } from "@/hooks/useTimer";
import { useAuth } from "@/context/AuthContext";
import { translations } from "@/lib/i18n";
import { isBossStreak } from "@/lib/streakBoss";
import { supabase } from "@/lib/supabase";
import { APP_VERSION_LABEL } from "@/lib/version";
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

  const guestEntered =
    typeof window !== "undefined" && sessionStorage.getItem("ef-app-entered") === "1";

  useEffect(() => {
    if (!loading && !user && !guestEntered) {
      window.location.replace("/welcome");
    }
  }, [loading, user, guestEntered]);

  if (loading || (!user && !guestEntered)) {
    return <AppLoadingSkeleton />;
  }

  return <FocusSpaceContent key={user?.id ?? "guest"} userId={user?.id} userEmail={user?.email ?? ""} />;
}

function FocusSpaceContent({ userId, userEmail }: { userId?: string; userEmail: string }) {
  const { signOut, updateDisplayName, uploadAvatar, user } = useAuth();
  const isGuest = !user;
  useSessionTracker(user ?? null);
  const streak = useStreak(userId);
  const { recordSession } = streak;
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
    syncEnabled: customSoundSyncEnabled,
    setSyncEnabled: setCustomSoundSyncEnabled,
    syncTrack: syncCustomTrack,
    cloudCount: customSoundCloudCount,
    cloudBytes: customSoundCloudBytes,
    maxCloudBytes: customSoundMaxCloudBytes,
    isSyncBusy: customSoundSyncBusy,
  } = useCustomTracks(userId);
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
  const { tasks, doneCount, completedRecords, chartArchive, chartHiddenLevel, categories, addTask, toggleTask, removeTask, clearDone, removeFromChart, addCategory, renameCategory, removeCategory, setTaskCategory } =
    useDailyTasks(userId);
  const activeCount = tracks.filter((t) => t.enabled).length;
  const totalActiveSounds = activeCount + customTracks.filter((track) => track.enabled).length;
  const completeTimer = useCallback((phase: TimerPhase) => {
    playFinishSound();
    notifyTimerComplete(phase);
    if (phase === "focus") recordSession();
    if (stopSoundsOnTimerEnd) { stopAll(); customStopAll(); }
  }, [customStopAll, notifyTimerComplete, playFinishSound, recordSession, stopAll, stopSoundsOnTimerEnd]);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  useEffect(() => { setHeaderImgError(false); }, [avatarUrl]);
  const avatarLetter = (displayName || userEmail).charAt(0).toUpperCase();
  const bossStreakActive = isBossStreak(userNumber, streak.currentStreak);

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
          <button
            onClick={() => setProfileOpen(true)}
            title={userEmail}
            className={`${cls} avatar-surface`}
          >
            {avatarUrl && !headerImgError ? (
              <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setHeaderImgError(true)} />
            ) : avatarLetter}
          </button>
          {STREAK_ENABLED && streak.currentStreak === 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary animate-bounce-subtle pointer-events-none shadow-[0_0_6px_2px_var(--primary)]" />
          )}
        </div>
        {m && (
          <div className={bossStreakActive ? "boss-streak-mini relative top-0.5 -left-0.5 flex items-center gap-0.5 pointer-events-none select-none leading-none" : "relative top-0.5 -left-0.5 flex items-center gap-0.5 pointer-events-none select-none leading-none"}>
            <span
              className={bossStreakActive ? "boss-streak-mini-flame" : m.anim === "rainbow" ? "animate-flame-rainbow" : "animate-flame-badge"}
              style={{ fontSize: 11, filter: m.anim !== "rainbow" ? m.filter : undefined }}
            >🔥</span>
            <span
              className={bossStreakActive ? "boss-streak-mini-count text-[9px] font-black tabular-nums" : m.anim === "rainbow" ? "animate-flame-rainbow text-[9px] font-bold tabular-nums" : "text-[9px] font-bold tabular-nums"}
              style={{ color: m.anim !== "rainbow" ? m.color : undefined }}
            >{streak.currentStreak}</span>
          </div>
        )}
      </div>
    );
  };

  const guestAuthBtns = (
    <>
      <Link
        to="/login"
        className="h-9 px-4 rounded-full border border-white/15 text-xs inline-flex items-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/10 hover:-translate-y-0.5 hover:shadow-[0_0_24px_-8px_var(--primary)] transition-all duration-300 ease-out"
      >
        Log in
      </Link>
      <Link
        to="/register"
        search={{ email: undefined }}
        className="h-9 px-4 rounded-full border border-transparent bg-foreground text-background text-xs inline-flex items-center font-semibold hover:bg-primary hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_0_28px_-8px_var(--primary)] transition-all duration-300 ease-out"
      >
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

  const renderSoundDock = (columns: 5 | 6 = 5) => (
    <SoundDock
      activeCount={activeCount} tracks={tracks} onToggleTrack={toggle}
      onVolumeTrack={setVolume} onStopAll={stopAll} customTracks={customTracks}
      onCustomToggle={customToggle} onCustomVolume={customSetVolume}
      onCustomRemove={customRemove} onAddFromFile={customAddFromFile} copy={copy}
      syncEnabled={customSoundSyncEnabled} canSync={Boolean(userId)}
      onCustomSync={syncCustomTrack}
      columns={columns}
    />
  );

  const settingsPanelEl = (
    <SettingsPanel
      open={settingsOpen} onClose={() => setSettingsOpen(false)}
      userId={userId}
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

  /* ── HORIZON layout ── */
  if (layout === "horizon") {
    const openTasks = tasks.length - doneCount;

    return (
      <div className="horizon-shell dark relative min-h-screen w-full overflow-x-hidden text-foreground animate-app-enter">
        <Background variant={bgVariant} image={bgImage} blur={bgBlur} />
        <div className="horizon-glow" aria-hidden="true" />

        <header className="horizon-header">
          <Link to="/welcome" className="horizon-brand">
            <span className="horizon-brand-dot" aria-hidden="true" />
            <span>
              <strong>Earth Flow</strong>
              <small>Horizon</small>
            </span>
          </Link>

          <div className="horizon-live-stats" aria-label="Current workspace totals">
            <span><strong>{openTasks}</strong> open tasks</span>
            <span><strong>{totalActiveSounds}</strong> active sounds</span>
          </div>

          <div className="flex items-center gap-2">
            {isGuest
              ? guestAuthBtns
              : avatarBtn(
                  "h-9 w-9 rounded-full border border-white/15 bg-background/55 inline-flex items-center justify-center text-xs font-semibold hover:border-primary transition-colors overflow-hidden",
                )}
          </div>
        </header>

        <main className="horizon-main">
          <h1 className="sr-only">Earth Flow — ambient sounds and focus timer</h1>

          <div className="horizon-primary-grid">
            <section className="horizon-focus-card">
              <div className="horizon-card-heading">
                <div>
                  <span>Focus timer</span>
                  <strong>{Math.round(durations.focus / 60)} minutes</strong>
                </div>
                <button type="button" onClick={() => setSettingsOpen(true)}>
                  Adjust
                </button>
              </div>
              <div className="horizon-timer-wrap">{timerEl}</div>
            </section>

            <aside className="horizon-tasks-card" data-tutorial="tasks">
              <div className="horizon-card-heading">
                <div>
                  <span>Today&apos;s tasks</span>
                  <strong>{openTasks} open</strong>
                </div>
              </div>
              <div className="horizon-tasks-body">
                <TodayTasks {...taskProps} fillHeight />
              </div>
            </aside>
          </div>

          <section className="horizon-sounds-card">
            <div className="horizon-card-heading">
              <div>
                <span>Sounds</span>
                <strong>{totalActiveSounds > 0 ? `${totalActiveSounds} active` : "None active"}</strong>
              </div>
            </div>
            {renderSoundDock(6)}
          </section>
        </main>

        <footer className="horizon-footer">
          <span>Earth Flow</span>
          <span>{APP_VERSION_LABEL}</span>
        </footer>

        {!isGuest && profileModalEl}
        {settingsPanelEl}
        {tutorialShow && <Tutorial onComplete={tutorialComplete} />}
      </div>
    );
  }

  /* ── ORBIT layout ── */
  if (layout === "orbit") {
    const openTasks = tasks.length - doneCount;
    const soundChannels = tracks.length + customTracks.length;

    return (
      <div className="orbit-shell dark relative min-h-screen w-full overflow-x-hidden text-foreground animate-app-enter">
        <Background variant={bgVariant} image={bgImage} blur={bgBlur} />
        <div className="orbit-grid-overlay" aria-hidden="true" />

        <header className="relative z-20 mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-5 py-5 panel:px-8">
          <Link
            to="/welcome"
            className="group inline-flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <span className="orbit-brand-mark" aria-hidden="true">
              <span />
            </span>
            <span>
              <span className="block font-display text-lg leading-none">Earth Flow</span>
              <span className="mt-1 block text-[8px] uppercase tracking-[0.34em] text-muted-foreground">
                Focus observatory
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-muted-foreground md:flex">
            <span className="h-px w-10 bg-foreground/20" />
            Orbit interface
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">
              Experimental
            </span>
            <span className="h-px w-10 bg-foreground/20" />
          </div>

          <div className="flex items-center gap-2">
            {isGuest
              ? guestAuthBtns
              : avatarBtn(
                  "h-9 w-9 rounded-full border border-primary/25 bg-background/45 inline-flex items-center justify-center text-xs font-semibold hover:border-primary transition-colors overflow-hidden shadow-[0_0_24px_-8px_var(--primary)]",
                )}
          </div>
        </header>

        <main className="relative z-10 px-4 pb-8 panel:px-8">
          <h1 className="sr-only">Earth Flow — ambient sounds and focus timer</h1>

          <div className="mx-auto max-w-[1600px]">
            <div className="orbit-dashboard">
              <aside className="orbit-task-cell" data-tutorial="tasks">
                <div className="orbit-cell-label">
                  <span>01</span>
                  <span>Mission queue</span>
                  <span>{String(openTasks).padStart(2, "0")} open</span>
                </div>
                <TodayTasks {...taskProps} fillHeight />
              </aside>

              <section className="orbit-core" aria-label="Focus timer command center">
                <div className="orbit-crosshair" aria-hidden="true" />
                <div className="orbit-ring orbit-ring-outer" aria-hidden="true">
                  <span className="orbit-satellite orbit-satellite-a" />
                  <span className="orbit-satellite orbit-satellite-b" />
                </div>
                <div className="orbit-ring orbit-ring-inner" aria-hidden="true" />
                <div className="orbit-axis orbit-axis-horizontal" aria-hidden="true" />
                <div className="orbit-axis orbit-axis-vertical" aria-hidden="true" />

                <div className="absolute left-6 top-6 z-10 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
                  Session core
                </div>

                <div className="relative z-10 flex w-full max-w-lg items-center justify-center px-4 py-16">
                  {timerEl}
                </div>

                <div className="absolute inset-x-6 bottom-5 z-10 text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60">
                  <span>Stay with one thing</span>
                </div>
              </section>

              <aside className="orbit-telemetry">
                <div className="orbit-cell-label">
                  <span>02</span>
                  <span>Session overview</span>
                </div>
                <div className="space-y-3">
                  <div className="orbit-metric">
                    <span>Cycle</span>
                    <strong>{Math.round(durations.focus / 60)}</strong>
                    <small>minutes</small>
                  </div>
                  <div className="orbit-metric">
                    <span>Channels</span>
                    <strong>{String(soundChannels).padStart(2, "0")}</strong>
                    <small>ambient</small>
                  </div>
                  <div className="orbit-metric">
                    <span>Queue</span>
                    <strong>{String(openTasks).padStart(2, "0")}</strong>
                    <small>objectives</small>
                  </div>
                </div>
                <p className="orbit-summary-note">
                  These values update when you change the timer, add sounds, or complete tasks.
                </p>
              </aside>
            </div>

            <section className="orbit-sound-cell">
              <div className="orbit-cell-label px-1">
                <span>03</span>
                <span>Ambient channels</span>
                <span>{activeCount > 0 ? `${activeCount} live` : "Standing by"}</span>
              </div>
              {renderSoundDock(6)}
            </section>
          </div>
        </main>

        <footer className="relative z-10 flex items-center justify-between px-6 pb-5 text-[9px] uppercase tracking-[0.24em] text-muted-foreground/35 panel:px-8">
          <span>Earth Flow / Orbit</span>
          <span>{APP_VERSION_LABEL}</span>
        </footer>

        {!isGuest && profileModalEl}
        {settingsPanelEl}
        {tutorialShow && <Tutorial onComplete={tutorialComplete} />}
      </div>
    );
  }

  /* ── SIDEBAR layout ── */
  if (layout === "sidebar") {
    const openTasks = tasks.length - doneCount;
    const totalChannels = tracks.length + customTracks.length;
    const totalActive = activeCount + customTracks.filter((track) => track.enabled).length;
    const focusMinutes = Math.round(durations.focus / 60);

    return (
      <div className="panel-shell dark relative min-h-screen w-full text-foreground animate-app-enter">
        <Background variant={bgVariant} image={bgImage} blur={bgBlur} />
        <div className="panel-grid-overlay" aria-hidden="true" />

        <aside className="panel-command-rail">
          <Link to="/welcome" className="panel-brand">
            <span className="panel-brand-mark" aria-hidden="true">
              <span />
            </span>
            <span>
              <span className="block font-display text-xl leading-none">Earth Flow</span>
              <span className="mt-1 block text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
                Panel workspace
              </span>
            </span>
          </Link>

          <nav className="panel-rail-nav" aria-label="Panel workspace sections">
            <span className="panel-rail-label">Workspace</span>
            <div className="panel-rail-link is-active">
              <span>01</span>
              <strong>Focus</strong>
              <small>{focusMinutes} min</small>
            </div>
            <div className="panel-rail-link">
              <span>02</span>
              <strong>Sound</strong>
              <small>{totalActive} active</small>
            </div>
            <div className="panel-rail-link">
              <span>03</span>
              <strong>Tasks</strong>
              <small>{openTasks} open</small>
            </div>
          </nav>

          <div className="panel-rail-spacer" />

          <div className="panel-rail-user">
            {isGuest ? (
              <>
                <Link to="/login" className="panel-rail-auth">
                  Log in
                </Link>
                <Link
                  to="/register"
                  search={{ email: undefined }}
                  className="panel-rail-auth is-primary"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <button
                onClick={() => setProfileOpen(true)}
                title={userEmail}
                className="panel-user-button"
              >
                <div className="relative shrink-0">
                  <div className="panel-user-avatar">
                    {avatarUrl && !headerImgError ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                        onError={() => setHeaderImgError(true)}
                      />
                    ) : (
                      avatarLetter
                    )}
                  </div>
                  {STREAK_ENABLED && streak.currentStreak === 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-bounce-subtle pointer-events-none shadow-[0_0_5px_2px_var(--primary)]" />
                  )}
                </div>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-xs text-foreground">
                    {displayName || userEmail}
                  </span>
                  <span className="block text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                    Profile
                  </span>
                </span>
                {STREAK_ENABLED && streak.currentStreak > 0 && (() => {
                  const { m } = getMilestone(streak.currentStreak);
                  return (
                    <span className={bossStreakActive ? "boss-streak-mini ml-auto flex items-center gap-0.5 shrink-0 pointer-events-none select-none" : "ml-auto flex items-center gap-0.5 shrink-0 pointer-events-none select-none"}>
                      <span
                        className={bossStreakActive ? "boss-streak-mini-flame" : m.anim === "rainbow" ? "animate-flame-rainbow" : "animate-flame-badge"}
                        style={{ fontSize: 12, filter: m.anim !== "rainbow" ? m.filter : undefined }}
                      >🔥</span>
                      <span
                        className={bossStreakActive ? "boss-streak-mini-count text-[10px] font-black tabular-nums" : m.anim === "rainbow" ? "animate-flame-rainbow text-[10px] font-bold tabular-nums" : "text-[10px] font-bold tabular-nums"}
                        style={{ color: m.anim !== "rainbow" ? m.color : undefined }}
                      >{streak.currentStreak}</span>
                    </span>
                  );
                })()}
              </button>
            )}
          </div>

          <div className="panel-rail-footer">
            <span>Earth Flow</span>
            <span>{APP_VERSION_LABEL}</span>
          </div>
        </aside>

        <div className="panel-workspace">
          <header className="panel-workspace-header">
            <div className="panel-mobile-brand">
              <Link to="/welcome" className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
                <span className="font-display text-lg">Earth Flow</span>
                <span className="panel-mobile-version">{APP_VERSION_LABEL}</span>
              </Link>
              <div className="flex items-center gap-2">
                {isGuest
                  ? guestAuthBtns
                  : avatarBtn(
                      "h-9 w-9 rounded-full glass border border-border inline-flex items-center justify-center text-xs font-semibold hover:border-primary transition-colors overflow-hidden",
                    )}
              </div>
            </div>

            <div className="panel-workspace-title">
              <span>Panels / Focus workspace</span>
              <strong>Today’s command deck</strong>
            </div>

            <div className="panel-live-metrics" aria-label="Current focus overview">
              <div>
                <span>Cycle</span>
                <strong>{focusMinutes}</strong>
                <small>min</small>
              </div>
              <div>
                <span>Audio</span>
                <strong>{totalActive}</strong>
                <small>of {totalChannels}</small>
              </div>
              <div>
                <span>Tasks</span>
                <strong>{openTasks}</strong>
                <small>open</small>
              </div>
            </div>
          </header>

          <main className="panel-stage">
            <h1 className="sr-only">Earth Flow — ambient sounds and focus timer</h1>

            <section id="panel-focus" className="panel-module panel-timer-module">
              <div className="panel-module-header">
                <div>
                  <span>01</span>
                  <strong>Focus console</strong>
                </div>
                <small>{focusMinutes} minute cycle</small>
              </div>
              <div className="panel-timer-body">{timerEl}</div>
            </section>

            <section
              id="panel-tasks-mobile"
              className="panel-module panel-mobile-tasks"
              data-tutorial="tasks"
            >
              <div className="panel-module-header">
                <div>
                  <span>03</span>
                  <strong>Task panel</strong>
                </div>
                <small>{openTasks} open</small>
              </div>
              <TodayTasks {...taskProps} fillHeight />
            </section>

            <section id="panel-sound" className="panel-module panel-sound-module">
              <div className="panel-module-header">
                <div>
                  <span>02</span>
                  <strong>Ambient desk</strong>
                </div>
                <small>{totalActive > 0 ? `${totalActive} playing` : "Ready"}</small>
              </div>
              <div className="panel-sound-body">{renderSoundDock()}</div>
            </section>
          </main>
        </div>

        <aside
          id="panel-tasks"
          className="panel-tasks-module"
          data-tutorial="tasks"
        >
          <div className="panel-module-header">
            <div>
              <span>03</span>
              <strong>Task panel</strong>
            </div>
            <small>{openTasks} open</small>
          </div>
          <div className="panel-tasks-body">
            <TodayTasks {...taskProps} fillHeight />
          </div>
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
          <Link to="/welcome" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
        <div className="mt-8 md:mt-10">{renderSoundDock()}</div>
      </main>

      <footer className="absolute bottom-4 right-6 text-[11px] text-muted-foreground/40 select-none pointer-events-none tabular-nums">
        {APP_VERSION_LABEL}
      </footer>

      {!isGuest && profileModalEl}
      {settingsPanelEl}
      {tutorialShow && <Tutorial onComplete={tutorialComplete} />}
    </div>
  );
}
