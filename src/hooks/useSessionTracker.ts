import { useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useSessionTracker(user: User | null) {
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const email = user.email ?? "";
    const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;
    const displayName =
      (user.user_metadata?.display_name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      "";

    startRef.current = Date.now();

    supabase
      .from("user_profiles")
      .select("last_session_date, today_sessions, total_sessions")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const isSameDay = data?.last_session_date === today;
        supabase.from("user_profiles").upsert(
          {
            user_id: user.id,
            email,
            avatar_url: avatarUrl,
            display_name: displayName,
            registered_at: user.created_at,
            last_seen_at: new Date().toISOString(),
            total_sessions: (data?.total_sessions ?? 0) + 1,
            today_sessions: isSameDay ? (data?.today_sessions ?? 0) + 1 : 1,
            last_session_date: today,
          },
          { onConflict: "user_id" }
        );
      });

    const saveTime = () => {
      const start = startRef.current;
      if (start === null) return;
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed < 5) return;
      startRef.current = Date.now();
      supabase.rpc("increment_session_time", { p_user_id: user.id, p_seconds: elapsed });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        saveTime();
        startRef.current = null;
      } else {
        startRef.current = Date.now();
      }
    };

    const interval = setInterval(saveTime, 30_000);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      saveTime();
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
