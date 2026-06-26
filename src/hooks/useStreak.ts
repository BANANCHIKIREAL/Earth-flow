import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface StreakDays {
  [date: string]: number;
}

interface Store {
  days: StreakDays;
  restored: string[];
  restores: { [monthKey: string]: number };
}

const KEY = "ef:streak_v2";
const GRACE = 2;

const toIso = (d = new Date()) => d.toISOString().slice(0, 10);
const dayGap = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Store>;
      return { days: p.days ?? {}, restored: p.restored ?? [], restores: p.restores ?? {} };
    }
  } catch {}
  return { days: {}, restored: [], restores: {} };
}

function persist(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

function normalize(raw: unknown): Store {
  const p = (raw ?? {}) as Partial<Store>;
  return { days: p.days ?? {}, restored: p.restored ?? [], restores: p.restores ?? {} };
}

function mergeStores(a: Store, b: Store): Store {
  const days: StreakDays = { ...b.days };
  for (const [d, cnt] of Object.entries(a.days)) {
    days[d] = Math.max(days[d] ?? 0, cnt);
  }
  const restored = [...new Set([...a.restored, ...b.restored])];
  const restores: Store["restores"] = { ...b.restores };
  for (const [k, v] of Object.entries(a.restores)) {
    restores[k] = Math.max(restores[k] ?? 0, v);
  }
  return { days, restored, restores };
}

function allActiveDates(store: Store): string[] {
  const earned = Object.keys(store.days).filter((d) => store.days[d] > 0);
  return [...new Set([...earned, ...store.restored])].sort();
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
  const todayStr = toIso();
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
  const [store, setStore] = useState<Store>(load);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch from Supabase on login and merge with local
  useEffect(() => {
    if (!userId) return;
    void supabase
      .from("user_streaks")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.data) return;
        setStore((local) => {
          const merged = mergeStores(local, normalize(data.data));
          persist(merged);
          return merged;
        });
      });
  }, [userId]);

  // Debounced sync to Supabase on every store change
  useEffect(() => {
    if (!userId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void supabase.from("user_streaks").upsert({
        user_id: userId,
        data: store,
        updated_at: new Date().toISOString(),
      });
    }, 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [userId, store]);

  // Continue existing streak on visit — don't auto-start from scratch
  useEffect(() => {
    const today = toIso();
    setStore((prev) => {
      if (Object.keys(prev.days).length === 0) return prev;
      if (prev.days[today] !== undefined) return prev;
      const next = { ...prev, days: { ...prev.days, [today]: 1 } };
      persist(next);
      return next;
    });
  }, []);

  const recordSession = useCallback(() => {
    const today = toIso();
    setStore((prev) => {
      const next = { ...prev, days: { ...prev.days, [today]: (prev.days[today] ?? 0) + 1 } };
      persist(next);
      return next;
    });
  }, []);

  const restoreStreak = useCallback(() => {
    setStore((prev) => {
      const monthKey = toIso().slice(0, 7);
      const used = prev.restores[monthKey] ?? 0;
      if (used >= 3) return prev;
      const todayStr = toIso();
      const dates = allActiveDates(prev);
      const beforeToday = dates.filter((d) => d < todayStr);
      if (beforeToday.length === 0) return prev;
      const lastBefore = beforeToday[beforeToday.length - 1];
      const gapDates: string[] = [];
      let check = new Date(new Date(lastBefore).getTime() + 86400000);
      const todayDate = new Date(todayStr);
      while (check < todayDate) {
        const iso = toIso(check);
        if (!prev.days[iso] && !prev.restored.includes(iso)) gapDates.push(iso);
        check = new Date(check.getTime() + 86400000);
      }
      const next: Store = {
        ...prev,
        restored: [...prev.restored, ...gapDates],
        restores: { ...prev.restores, [monthKey]: used + 1 },
      };
      persist(next);
      return next;
    });
  }, []);

  const addSkipDay = useCallback(() => {
    setStore((prev) => {
      const today = toIso();
      const newDays: StreakDays = {};
      for (const [d, cnt] of Object.entries(prev.days)) {
        if (d === today) { newDays[d] = cnt; continue; }
        const shifted = toIso(new Date(new Date(d).getTime() - 86400000));
        newDays[shifted] = (newDays[shifted] ?? 0) + cnt;
      }
      const newRestored = prev.restored.map((d) =>
        toIso(new Date(new Date(d).getTime() - 86400000))
      );
      const next: Store = { ...prev, days: newDays, restored: newRestored };
      persist(next);
      return next;
    });
  }, []);

  const addTestDay = useCallback(() => {
    setStore((prev) => {
      const dates = allActiveDates(prev);
      if (dates.length === 0) return prev;
      const chains = splitChains(dates);
      const earliest = chains[chains.length - 1][0];
      const target = toIso(new Date(new Date(earliest).getTime() - 86400000));
      const next = { ...prev, days: { ...prev.days, [target]: 1 } };
      persist(next);
      return next;
    });
  }, []);

  const resetDays = useCallback(() => {
    const next: Store = { days: {}, restored: [], restores: {} };
    persist(next);
    setStore(next);
  }, []);

  const stats = useMemo(() => computeStats(store), [store]);
  const monthKey = toIso().slice(0, 7);
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
