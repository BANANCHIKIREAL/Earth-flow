import { useCallback, useEffect, useMemo, useState } from "react";
import { safeStorage } from "@/lib/safe-storage";
import { supabase } from "@/lib/supabase";

export type StatsPeriod = "day" | "week" | "month" | "year";

export const CATEGORY_COLORS = [
  "#60a5fa", "#34d399", "#f472b6", "#fb923c",
  "#a78bfa", "#fbbf24", "#f87171", "#22d3ee",
];

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface DailyTask {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  completedAt?: number;
  categoryId?: string;
}

export interface CompletedTaskRecord {
  id: string;
  title: string;
  completedAt: number;
}

export interface TaskStats {
  day: number;
  week: number;
  month: number;
  year: number;
}

function makeKeys(userId?: string) {
  const p = userId ? `u:${userId}:` : `u:guest:`;
  return {
    DAILY: `${p}focus-space:daily-tasks`,
    COMPLETED: `${p}focus-space:completed-tasks`,
    ARCHIVE: `${p}focus-space:chart-archive`,
    HIDDEN: `${p}focus-space:chart-hidden-level`,
    CATEGORIES: `${p}focus-space:categories`,
  };
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = safeStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function createTask(title: string, categoryId?: string): DailyTask {
  return {
    id: crypto.randomUUID(),
    title,
    done: false,
    createdAt: Date.now(),
    categoryId,
  };
}

export function useDailyTasks(userId?: string) {
  const keys = makeKeys(userId);

  // cloudLoaded prevents writing empty local data to Supabase before cloud data arrives
  const [cloudLoaded, setCloudLoaded] = useState(false);

  const [tasks, setTasks] = useState<DailyTask[]>(() => readJSON<DailyTask[]>(keys.DAILY, []));
  const [completedRecords, setCompletedRecords] = useState<CompletedTaskRecord[]>(() =>
    readJSON<CompletedTaskRecord[]>(keys.COMPLETED, [])
  );
  const [chartArchive, setChartArchive] = useState<DailyTask[]>(() =>
    readJSON<DailyTask[]>(keys.ARCHIVE, [])
  );
  const [chartHiddenLevel, setChartHiddenLevel] = useState<Record<string, number>>(() =>
    readJSON<Record<string, number>>(keys.HIDDEN, {})
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    readJSON<Category[]>(keys.CATEGORIES, [])
  );

  // Load from Supabase on mount — overrides localStorage with cloud data
  useEffect(() => {
    if (!userId) {
      setCloudLoaded(true);
      return;
    }
    let active = true;
    supabase
      .from("user_data")
      .select("tasks, completed_records, chart_archive, chart_hidden_level, categories")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error("[useDailyTasks] load error:", error.message);
        if (data) {
          setTasks(data.tasks ?? []);
          setCompletedRecords(data.completed_records ?? []);
          setChartArchive(data.chart_archive ?? []);
          setChartHiddenLevel(data.chart_hidden_level ?? {});
          setCategories(data.categories ?? []);
        }
        setCloudLoaded(true); // always mark loaded — even if no data yet
      });
    return () => { active = false; };
  }, [userId]);

  // Write to localStorage
  useEffect(() => {
    try { safeStorage.setItem(keys.DAILY, JSON.stringify(tasks)); } catch {}
  }, [tasks, keys.DAILY]);
  useEffect(() => {
    try { safeStorage.setItem(keys.COMPLETED, JSON.stringify(completedRecords)); } catch {}
  }, [completedRecords, keys.COMPLETED]);
  useEffect(() => {
    try { safeStorage.setItem(keys.ARCHIVE, JSON.stringify(chartArchive)); } catch {}
  }, [chartArchive, keys.ARCHIVE]);
  useEffect(() => {
    try { safeStorage.setItem(keys.HIDDEN, JSON.stringify(chartHiddenLevel)); } catch {}
  }, [chartHiddenLevel, keys.HIDDEN]);
  useEffect(() => {
    try { safeStorage.setItem(keys.CATEGORIES, JSON.stringify(categories)); } catch {}
  }, [categories, keys.CATEGORIES]);

  // Debounced save — only runs after cloud data has been loaded to prevent overwrite
  useEffect(() => {
    if (!cloudLoaded || !userId) return;
    const timer = setTimeout(() => {
      supabase.from("user_data").upsert({
        user_id: userId,
        tasks,
        completed_records: completedRecords,
        chart_archive: chartArchive,
        chart_hidden_level: chartHiddenLevel,
        categories,
        updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.error("[useDailyTasks] save error:", error.message);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [cloudLoaded, userId, tasks, completedRecords, chartArchive, chartHiddenLevel, categories]);

  const addTask = useCallback((title: string, categoryId?: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTasks((current) => [createTask(trimmed, categoryId), ...current]);
  }, []);

  const addCategory = useCallback((name: string): Category => {
    const trimmed = name.trim();
    const cat: Category = {
      id: crypto.randomUUID(),
      name: trimmed,
      color: CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)],
    };
    setCategories((prev) => [...prev, cat]);
    return cat;
  }, []);

  const renameCategory = useCallback((id: string, name: string) => {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name: name.trim() } : c));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.map((t) => t.categoryId === id ? { ...t, categoryId: undefined } : t));
  }, []);

  const setTaskCategory = useCallback((taskId: string, categoryId: string | null) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, categoryId: categoryId ?? undefined } : t));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id) return task;
        const done = !task.done;

        if (done) {
          const completedAt = Date.now();
          setCompletedRecords((records) => {
            const nextRecord = { id: task.id, title: task.title, completedAt };
            return [...records.filter((r) => r.id !== id), nextRecord];
          });
          return { ...task, done: true, completedAt };
        } else {
          // Shift createdAt so timer resumes from elapsed time, not from zero
          const elapsed = (task.completedAt ?? Date.now()) - task.createdAt;
          const newCreatedAt = Date.now() - elapsed;
          setCompletedRecords((records) => records.filter((r) => r.id !== id));
          return { ...task, done: false, completedAt: undefined, createdAt: newCreatedAt };
        }
      }),
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((current) => {
      const task = current.find((t) => t.id === id);
      if (task) {
        setChartArchive((arch) => [
          ...arch.filter((a) => a.id !== id),
          { ...task, completedAt: task.completedAt ?? Date.now() },
        ]);
      }
      return current.filter((t) => t.id !== id);
    });
  }, []);

  const clearDone = useCallback(() => {
    setTasks((current) => {
      const done = current.filter((t) => t.done);
      if (done.length > 0) {
        setChartArchive((arch) => {
          const next = [...arch];
          done.forEach((task) => {
            if (!next.find((a) => a.id === task.id)) {
              next.push({ ...task, completedAt: task.completedAt ?? Date.now() });
            }
          });
          return next;
        });
      }
      return current.filter((t) => !t.done);
    });
  }, []);

  const removeFromChart = useCallback((id: string, period: StatsPeriod) => {
    const level = period === "day" ? 1 : period === "week" ? 2 : period === "month" ? 3 : 4;
    if (level >= 4) {
      // Year → permanent delete
      setChartArchive((arch) => arch.filter((a) => a.id !== id));
      setChartHiddenLevel((prev) => { const next = { ...prev }; delete next[id]; return next; });
      setTasks((current) => current.filter((t) => t.id !== id));
    } else {
      // Hide from this period and narrower, but keep visible in broader periods
      setChartHiddenLevel((prev) => {
        const cur = prev[id] ?? 0;
        return level <= cur ? prev : { ...prev, [id]: level };
      });
    }
  }, []);

  const doneCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const completedStats = useMemo(() => getCompletedStats(completedRecords), [completedRecords]);

  return {
    tasks,
    doneCount,
    completedStats,
    completedRecords,
    chartArchive,
    chartHiddenLevel,
    categories,
    addTask,
    toggleTask,
    removeTask,
    clearDone,
    removeFromChart,
    addCategory,
    renameCategory,
    removeCategory,
    setTaskCategory,
  };
}

function getCompletedStats(records: CompletedTaskRecord[]): TaskStats {
  const now = new Date();
  const dayStart = startOfDay(now).getTime();
  const weekStart = startOfWeek(now).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

  return records.reduce(
    (stats, record) => {
      if (record.completedAt >= dayStart) stats.day += 1;
      if (record.completedAt >= weekStart) stats.week += 1;
      if (record.completedAt >= monthStart) stats.month += 1;
      if (record.completedAt >= yearStart) stats.year += 1;
      return stats;
    },
    { day: 0, week: 0, month: 0, year: 0 },
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  return start;
}
