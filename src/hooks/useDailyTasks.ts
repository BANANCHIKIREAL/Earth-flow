import { useCallback, useEffect, useMemo, useState } from "react";

export interface DailyTask {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  completedAt?: number;
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

const KEY_DAILY_TASKS = "focus-space:daily-tasks";
const KEY_COMPLETED_TASKS = "focus-space:completed-tasks";
const KEY_CHART_ARCHIVE = "focus-space:chart-archive";
const KEY_CHART_HIDDEN  = "focus-space:chart-hidden";

function readTasks() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_DAILY_TASKS);
    return raw ? (JSON.parse(raw) as DailyTask[]) : [];
  } catch {
    return [];
  }
}

function readCompletedRecords() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_COMPLETED_TASKS);
    return raw ? (JSON.parse(raw) as CompletedTaskRecord[]) : [];
  } catch {
    return [];
  }
}

function createTask(title: string): DailyTask {
  return {
    id: crypto.randomUUID(),
    title,
    done: false,
    createdAt: Date.now(),
  };
}

export function useDailyTasks() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [completedRecords, setCompletedRecords] = useState<CompletedTaskRecord[]>([]);
  const [chartArchive, setChartArchive] = useState<DailyTask[]>([]);
  const [chartHidden, setChartHidden] = useState<string[]>([]);

  useEffect(() => {
    setTasks(readTasks());
    setCompletedRecords(readCompletedRecords());
    try {
      const raw = localStorage.getItem(KEY_CHART_ARCHIVE);
      setChartArchive(raw ? (JSON.parse(raw) as DailyTask[]) : []);
    } catch { /* empty */ }
    try {
      const raw = localStorage.getItem(KEY_CHART_HIDDEN);
      setChartHidden(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY_DAILY_TASKS, JSON.stringify(tasks)); } catch {}
  }, [tasks]);

  useEffect(() => {
    try { localStorage.setItem(KEY_COMPLETED_TASKS, JSON.stringify(completedRecords)); } catch {}
  }, [completedRecords]);

  useEffect(() => {
    try { localStorage.setItem(KEY_CHART_ARCHIVE, JSON.stringify(chartArchive)); } catch {}
  }, [chartArchive]);

  useEffect(() => {
    try { localStorage.setItem(KEY_CHART_HIDDEN, JSON.stringify(chartHidden)); } catch {}
  }, [chartHidden]);

  const addTask = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTasks((current) => [createTask(trimmed), ...current]);
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

  const removeFromChart = useCallback((id: string) => {
    setChartArchive((arch) => arch.filter((a) => a.id !== id));
    setChartHidden((h) => (h.includes(id) ? h : [...h, id]));
    setTasks((current) => current.filter((t) => t.id !== id));
  }, []);

  const doneCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const completedStats = useMemo(() => getCompletedStats(completedRecords), [completedRecords]);

  return {
    tasks,
    doneCount,
    completedStats,
    completedRecords,
    chartArchive,
    chartHidden,
    addTask,
    toggleTask,
    removeTask,
    clearDone,
    removeFromChart,
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
