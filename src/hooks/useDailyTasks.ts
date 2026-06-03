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

  useEffect(() => {
    setTasks(readTasks());
    setCompletedRecords(readCompletedRecords());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_DAILY_TASKS, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_COMPLETED_TASKS, JSON.stringify(completedRecords));
    } catch {}
  }, [completedRecords]);

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
        const completedAt = Date.now();

        setCompletedRecords((records) => {
          if (done) {
            const nextRecord = { id: task.id, title: task.title, completedAt };
            return [...records.filter((record) => record.id !== id), nextRecord];
          }

          return records.filter((record) => record.id !== id);
        });

        return {
          ...task,
          done,
          completedAt: done ? completedAt : undefined,
        };
      }),
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setTasks((current) => current.filter((task) => !task.done));
  }, []);

  const doneCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const completedStats = useMemo(() => getCompletedStats(completedRecords), [completedRecords]);

  return {
    tasks,
    doneCount,
    completedStats,
    completedRecords,
    addTask,
    toggleTask,
    removeTask,
    clearDone,
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
