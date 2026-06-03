import { FormEvent, useEffect, useState } from "react";
import { BarChart3, Check, ListTodo, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CompletedTaskRecord, DailyTask } from "@/hooks/useDailyTasks";
import type { translations } from "@/lib/i18n";

interface Props {
  tasks: DailyTask[];
  doneCount: number;
  completedRecords: CompletedTaskRecord[];
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClearDone: () => void;
  copy: typeof translations.en;
}

export function TodayTasks({
  tasks,
  doneCount,
  completedRecords,
  onAdd,
  onToggle,
  onRemove,
  onClearDone,
  copy,
}: Props) {
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(Date.now());
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAdd(draft);
    setDraft("");
  };

  return (
    <section className="glass w-full max-w-md rounded-2xl p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {copy.today}
          </div>
          <h2 className="font-display text-2xl">{copy.tasks}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-border bg-foreground/5 px-3 py-1 text-xs tabular-nums text-muted-foreground">
            {doneCount}/{tasks.length}
          </div>
          <button
            onClick={() => setStatsOpen(true)}
            className="h-9 w-9 rounded-full border border-border bg-foreground/5 inline-flex items-center justify-center text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            aria-label="Open task statistics"
          >
            <BarChart3 size={16} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-w-0 flex-1 rounded-full border border-border bg-foreground/5 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          placeholder={copy.addTask}
          aria-label={copy.addTask}
        />
        <button
          type="submit"
          className="h-10 w-10 shrink-0 rounded-full bg-foreground text-background inline-flex items-center justify-center hover:scale-105 transition-transform"
          aria-label={copy.addTask}
        >
          <Plus size={16} />
        </button>
      </form>

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-foreground/5 px-4 py-7 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground">
              <ListTodo size={18} />
            </div>
            <div className="text-sm text-muted-foreground">{copy.noTasks}</div>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-3 rounded-2xl bg-foreground/5 px-3 py-2.5"
            >
              <button
                onClick={() => onToggle(task.id)}
                className={`h-6 w-6 shrink-0 rounded-full border inline-flex items-center justify-center transition-colors ${
                  task.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                }`}
                aria-label={task.done ? copy.markTaskNotDone : copy.markTaskDone}
              >
                {task.done && <Check size={13} />}
              </button>
              <div
                className="min-w-0 flex-1"
              >
                <div
                  className={`text-sm leading-snug ${
                    task.done ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {task.title}
                </div>
                <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                  {formatTaskTime(task, now)}
                </div>
              </div>
              <button
                onClick={() => onRemove(task.id)}
                className="h-7 w-7 shrink-0 rounded-full inline-flex items-center justify-center text-muted-foreground opacity-70 transition-colors hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                aria-label={copy.deleteTask}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {doneCount > 0 && (
        <button
          onClick={onClearDone}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copy.clearCompleted}
        </button>
      )}

      <TaskStatsDialog open={statsOpen} onOpenChange={setStatsOpen} records={completedRecords} />
    </section>
  );
}

interface TaskStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: CompletedTaskRecord[];
}

type StatsPeriod = "day" | "week" | "month" | "year";

function TaskStatsDialog({ open, onOpenChange, records }: TaskStatsDialogProps) {
  const [period, setPeriod] = useState<StatsPeriod>("day");
  const chart = getChartData(records, period);
  const total = chart.reduce((sum, item) => sum + item.value, 0);
  const chartScale = getChartScale(period);
  const yTicks = chartScale.ticks;
  const periods: Array<{ id: StatsPeriod; label: string }> = [
    { id: "day", label: "Day" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-xl border-border bg-background/95 text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Task statistics</DialogTitle>
          <DialogDescription>Completed tasks for the selected period.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {periods.map((option) => (
            <button
              key={option.id}
              onClick={() => setPeriod(option.id)}
              className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                option.id === period
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-foreground/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-foreground/5 p-4">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {getPeriodTitle(period)}
              </div>
              <div className="mt-1 font-display text-4xl leading-none tabular-nums">{total}</div>
            </div>
            <div className="text-right text-xs text-muted-foreground">completed tasks</div>
          </div>

          <div className="grid h-64 grid-cols-[2rem_1fr] gap-3">
            <div className="relative flex flex-col justify-between text-right text-[10px] tabular-nums text-muted-foreground">
              {yTicks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex flex-col justify-between">
                {yTicks.map((tick) => (
                  <div key={tick} className="border-t border-foreground/15" />
                ))}
              </div>
              <div
                className="relative z-10 grid h-full items-end gap-2"
                style={{ gridTemplateColumns: `repeat(${chart.length}, minmax(0, 1fr))` }}
              >
                {chart.map((item) => (
                  <div key={item.label} className="flex h-full min-w-0 flex-col justify-end">
                    <div
                      className="mx-auto w-full max-w-14 rounded-t-md bg-sky-500/85 shadow-[0_0_18px_rgba(14,165,233,0.25)] transition-all duration-500"
                      style={{
                        height:
                          item.value === 0
                            ? "0%"
                            : `${Math.max(7, Math.min(100, (item.value / chartScale.max) * 100))}%`,
                      }}
                      title={`${item.label}: ${item.value}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="mt-2 grid gap-2 pl-11"
            style={{ gridTemplateColumns: `repeat(${chart.length}, minmax(0, 1fr))` }}
          >
            {chart.map((item) => (
              <div key={item.label} className="truncate text-center text-[10px] text-muted-foreground">
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getChartData(records: CompletedTaskRecord[], period: StatsPeriod) {
  const now = new Date();

  if (period === "day") {
    const buckets = [
      { label: "00-06", from: 0, to: 6, value: 0 },
      { label: "06-12", from: 6, to: 12, value: 0 },
      { label: "12-18", from: 12, to: 18, value: 0 },
      { label: "18-24", from: 18, to: 24, value: 0 },
    ];
    const dayStart = startOfDay(now).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    records.forEach((record) => {
      if (record.completedAt < dayStart || record.completedAt >= dayEnd) return;
      const hour = new Date(record.completedAt).getHours();
      const bucket = buckets.find((item) => hour >= item.from && hour < item.to);
      if (bucket) bucket.value += 1;
    });

    return buckets.map(({ label, value }) => ({ label, value }));
  }

  if (period === "week") {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekStart = startOfWeek(now).getTime();
    const buckets = labels.map((label) => ({ label, value: 0 }));

    records.forEach((record) => {
      const offset = Math.floor((record.completedAt - weekStart) / (24 * 60 * 60 * 1000));
      if (offset >= 0 && offset < buckets.length) buckets[offset].value += 1;
    });

    return buckets;
  }

  if (period === "month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const buckets = [
      { label: "1-7", from: 1, to: 8, value: 0 },
      { label: "8-14", from: 8, to: 15, value: 0 },
      { label: "15-21", from: 15, to: 22, value: 0 },
      { label: "22+", from: 22, to: 32, value: 0 },
    ];

    records.forEach((record) => {
      if (record.completedAt < monthStart.getTime() || record.completedAt >= nextMonth) return;
      const date = new Date(record.completedAt).getDate();
      const bucket = buckets.find((item) => date >= item.from && date < item.to);
      if (bucket) bucket.value += 1;
    });

    return buckets.map(({ label, value }) => ({ label, value }));
  }

  const buckets = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
    (label) => ({ label, value: 0 }),
  );
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
  const nextYear = new Date(now.getFullYear() + 1, 0, 1).getTime();

  records.forEach((record) => {
    if (record.completedAt < yearStart || record.completedAt >= nextYear) return;
    buckets[new Date(record.completedAt).getMonth()].value += 1;
  });

  return buckets;
}

function getChartScale(period: StatsPeriod) {
  if (period === "day") return { max: 20, ticks: [20, 15, 10, 5, 0] };
  if (period === "week") return { max: 80, ticks: [80, 60, 40, 20, 0] };
  if (period === "month") return { max: 200, ticks: [200, 160, 120, 80, 0] };
  return { max: 800, ticks: [800, 600, 400, 200, 0] };
}

function getPeriodTitle(period: StatsPeriod) {
  if (period === "day") return "Today";
  if (period === "week") return "This week";
  if (period === "month") return "This month";
  return "This year";
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

function getTaskSeconds(task: DailyTask, now: number) {
  const end = task.completedAt ?? now;
  return Math.max(0, Math.floor((end - task.createdAt) / 1000));
}

function formatTaskTime(task: DailyTask, now: number) {
  const elapsed = getTaskSeconds(task, now);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
