import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { safeStorage } from "@/lib/safe-storage";
import { supabase } from "@/lib/supabase";

export interface StreakDays {
  [date: string]: number;
}

interface Store {
  days: StreakDays;
  restored: string[];
  restores: { [monthKey: string]: number };
  v?: number; // version — bumped by admin overrides; higher version wins over local cache
}

const KEY = "ef:streak_v3";
const GRACE = 2;
const DAY_MS = 86400000;

const toDateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dateKeyToEpoch = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};
const epochToDateKey = (epoch: number) => new Date(epoch).toISOString().slice(0, 10);
const shiftDateKey = (key: string, days: number) =>
  epochToDateKey(dateKeyToEpoch(key) + days * DAY_MS);
const dayGap = (a: string, b: string) =>
  Math.round((dateKeyToEpoch(b) - dateKeyToEpoch(a)) / DAY_MS);

function load(storageKey: string): Store {
  try {
    const raw = safeStorage.getItem(storageKey);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Store>;
      return { days: p.days ?? {}, restored: p.restored ?? [], restores: p.restores ?? {}, v: p.v };
    }
  } catch {}
  return { days: {}, restored: [], restores: {} };
}

function persist(storageKey: string, store: Store) {
  try { safeStorage.setItem(storageKey, JSON.stringify(store)); } catch {}
}

function normalize(raw: unknown): Store {
  const p = (raw ?? {}) as Partial<Store>;
  return { days: p.days ?? {}, restored: p.restored ?? [], restores: p.restores ?? {}, v: p.v };
}

function mergeStores(a: Store, b: Store): Store {
  // Remote has higher version (admin override) — trust it completely, clear local cache
  if ((b.v ?? 0) > (a.v ?? 0)) return b;
  const days: StreakDays = { ...b.days };
  for (const [d, cnt] of Object.entries(a.days)) {
    days[d] = Math.max(days[d] ?? 0, cnt);
  }
  const restored = [...new Set([...a.restored, ...b.restored])];
  const restores: Store["restores"] = { ...b.restores };
  for (const [k, v] of Object.entries(a.restores)) {
    restores[k] = Math.max(restores[k] ?? 0, v);
  }
  return { days, restored, restores, v: Math.max(a.v ?? 0, b.v ?? 0) };
}

function allActiveDates(store: Store): string[] {
  const earned = Object.keys(store.days).filter((d) => store.days[d] > 0);
  return [...new Set([...earned, ...store.restored])].sort();
}

function continueExistingStreak(store: Store): Store {
  const today = toDateKey();
  if (Object.keys(store.days).length === 0 || store.days[today] !== undefined) {
    return store;
  }
  return { ...store, days: { ...store.days, [today]: 1 } };
}

function splitChains(dates: string[]): string[][] {
  if (dates.length === 0) return [];
  const chains: string[][] = [];
  let chain: string[] = [dates[0]];
  for (let i = 1; i < dates.length; i++) {
    if (dayGap(dates[i - 1], dates[i]) > GRACE + 1) {
      chains.push(chain);
      chain = [dates[i]];
    } else {
      chain.push(dates[i]);
    }
  }
  chains.push(chain);
  return chains;
}

function computeStats(store: Store) {
  const todayStr = toDateKey();
  const earnedSet = new Set(Object.keys(store.days).filter((d) => store.days[d] > 0));
  const dates = allActiveDates(store);

  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalDays: 0, isStreakBroken: false };
  }

  const beforeToday = dates.filter((d) => d < todayStr);
  const isStreakBroken =
    earnedSet.size > 0 &&
    beforeToday.length > 0 &&
    dates.includes(todayStr) &&
    dayGap(beforeToday[beforeToday.length - 1], todayStr) > GRACE + 1;

  const chains = splitChains(dates);
  const chainCounts = chains.map((c) => c.filter((d) => earnedSet.has(d)).length);
  const longestStreak = Math.max(0, ...chainCounts);
  const lastChain = chains[chains.length - 1] ?? [];
  const currentStreak = lastChain.includes(todayStr) ? chainCounts[chains.length - 1] : 0;

  return { currentStreak, longestStreak, totalDays: earnedSet.size, isStreakBroken };
}

export function useStreak(userId?: string) {
  const storageKey = `${KEY}:${userId ?? "guest"}`;
  const [store, setStore] = useState<Store>(() => {
    const initial = continueExistingStreak(load(storageKey));
    persist(storageKey, initial);
    return initial;
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [remoteFetched, setRemoteFetched] = useState(false);

  // Fetch from Supabase on login and merge with local
  useEffect(() => {
    if (!userId) {
      setRemoteFetched(false);
      return;
    }
    let cancelled = false;
    setRemoteFetched(false);
    void supabase
      .from("user_streaks")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load streak data", error);
          return;
        }
        setStore((local) => {
          const merged = data?.data ? mergeStores(local, normalize(data.data)) : local;
          const continued = continueExistingStreak(merged);
          persist(storageKey, continued);
          return continued;
        });
        setRemoteFetched(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey, userId]);

  // Debounced sync — only after remote data has been fetched to avoid overwriting admin changes.
  // Uses version-safe RPC (upsert_streak_v) so a lower-version local write cannot overwrite
  // a higher-version admin write. Falls back to direct upsert if RPC is unavailable.
  useEffect(() => {
    if (!userId || !remoteFetched) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const { error } = await supabase.rpc("upsert_streak_v", {
        p_user_id: userId,
        p_data: store,
        p_updated_at: new Date().toISOString(),
      });
      if (!error) return;
      if (error.code === "PGRST202" || error.code === "42883") {
        // RPC not deployed yet — fall back to direct upsert
        const { error: fallbackError } = await supabase
          .from("user_streaks")
          .upsert(
            {
              user_id: userId,
              data: store,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        if (fallbackError) console.error("Failed to sync streak data", fallbackError);
        return;
      }
      console.error("Failed to sync streak data", error);
    }, 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [userId, store, remoteFetched, storageKey]);

  const recordSession = useCallback(() => {
    const today = toDateKey();
    setStore((prev) => {
      const next = { ...prev, days: { ...prev.days, [today]: (prev.days[today] ?? 0) + 1 } };
      persist(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const restoreStreak = useCallback(() => {
    setStore((prev) => {
      const monthKey = toDateKey().slice(0, 7);
      const used = prev.restores[monthKey] ?? 0;
      if (used >= 3) return prev;
      const todayStr = toDateKey();
      const dates = allActiveDates(prev);
      const beforeToday = dates.filter((d) => d < todayStr);
      if (beforeToday.length === 0) return prev;
      const lastBefore = beforeToday[beforeToday.length - 1];
      const gapDates: string[] = [];
      let check = dateKeyToEpoch(lastBefore) + DAY_MS;
      const today = dateKeyToEpoch(todayStr);
      while (check < today) {
        const iso = epochToDateKey(check);
        if (!prev.days[iso] && !prev.restored.includes(iso)) gapDates.push(iso);
        check += DAY_MS;
      }
      const next: Store = {
        ...prev,
        restored: [...prev.restored, ...gapDates],
        restores: { ...prev.restores, [monthKey]: used + 1 },
      };
      persist(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const addSkipDay = useCallback(() => {
    setStore((prev) => {
      const today = toDateKey();
      const newDays: StreakDays = {};
      for (const [d, cnt] of Object.entries(prev.days)) {
        if (d === today) { newDays[d] = cnt; continue; }
        const shifted = shiftDateKey(d, -1);
        newDays[shifted] = (newDays[shifted] ?? 0) + cnt;
      }
      const newRestored = prev.restored.map((d) => shiftDateKey(d, -1));
      const next: Store = { ...prev, days: newDays, restored: newRestored };
      persist(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const addTestDay = useCallback(() => {
    setStore((prev) => {
      const dates = allActiveDates(prev);
      if (dates.length === 0) return prev;
      const chains = splitChains(dates);
      const earliest = chains[chains.length - 1][0];
      const target = shiftDateKey(earliest, -1);
      const next = { ...prev, days: { ...prev.days, [target]: 1 } };
      persist(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const resetDays = useCallback(() => {
    const next: Store = { days: {}, restored: [], restores: {} };
    persist(storageKey, next);
    setStore(next);
  }, [storageKey]);

  const stats = useMemo(() => computeStats(store), [store]);
  const monthKey = toDateKey().slice(0, 7);
  const monthlyRestoresUsed = store.restores[monthKey] ?? 0;
  const canRestore = stats.isStreakBroken && monthlyRestoresUsed < 3;

  return {
    days: store.days,
    ...stats,
    monthlyRestoresUsed,
    canRestore,
    recordSession,
    restoreStreak,
    addTestDay,
    addSkipDay,
    resetDays,
  };
}

export type StreakStats = ReturnType<typeof useStreak>;
