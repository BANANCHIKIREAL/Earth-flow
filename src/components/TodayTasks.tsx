import { FormEvent, useEffect, useRef, useState } from "react";
import { BarChart3, Check, ListTodo, Pencil, PieChart, Plus, Tag, Trash2, X } from "lucide-react";
import { DonutChart } from "@/components/DonutChart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category, CompletedTaskRecord, DailyTask, StatsPeriod } from "@/hooks/useDailyTasks";
import type { translations } from "@/lib/i18n";

interface Props {
  tasks: DailyTask[];
  doneCount: number;
  completedRecords: CompletedTaskRecord[];
  chartArchive: DailyTask[];
  chartHiddenLevel: Record<string, number>;
  categories: Category[];
  onAdd: (title: string, categoryId?: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClearDone: () => void;
  onRemoveFromChart: (id: string, period: StatsPeriod) => void;
  onAddCategory: (name: string) => Category;
  onRenameCategory: (id: string, name: string) => void;
  onRemoveCategory: (id: string) => void;
  onSetTaskCategory: (taskId: string, categoryId: string | null) => void;
  copy: typeof translations.en;
}

export function TodayTasks({
  tasks,
  doneCount,
  completedRecords,
  chartArchive,
  chartHiddenLevel,
  categories,
  onAdd,
  onToggle,
  onRemove,
  onClearDone,
  onRemoveFromChart,
  onAddCategory,
  onRenameCategory,
  onRemoveCategory,
  onSetTaskCategory,
  copy,
}: Props) {
  const [draft, setDraft] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const newCatInputRef = useRef<HTMLInputElement>(null);
  const editCatInputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(Date.now());
  const [statsOpen, setStatsOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<StatsPeriod>("day");

  const periodLevel = chartPeriod === "day" ? 1 : chartPeriod === "week" ? 2 : chartPeriod === "month" ? 3 : 4;
  const hiddenIdsForPeriod = Object.entries(chartHiddenLevel)
    .filter(([, level]) => periodLevel <= level)
    .map(([id]) => id);
  const handleRemoveFromChart = (id: string) => onRemoveFromChart(id, chartPeriod);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (addingCat) newCatInputRef.current?.focus();
  }, [addingCat]);

  useEffect(() => {
    if (editingCatId) editCatInputRef.current?.focus();
  }, [editingCatId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAdd(draft, draftCategoryId ?? undefined);
    setDraft("");
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) { setAddingCat(false); return; }
    const cat = onAddCategory(name);
    setDraftCategoryId(cat.id);
    setNewCatName("");
    setAddingCat(false);
  };

  const handleStartEditCat = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleSaveEditCat = () => {
    if (editingCatId && editingCatName.trim()) {
      onRenameCategory(editingCatId, editingCatName.trim());
    }
    setEditingCatId(null);
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
            onClick={() => setChartOpen(true)}
            className="h-9 w-9 rounded-full border border-border bg-foreground/5 inline-flex items-center justify-center text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            aria-label="Open time distribution chart"
          >
            <PieChart size={16} />
          </button>
          <button
            onClick={() => setStatsOpen(true)}
            className="h-9 w-9 rounded-full border border-border bg-foreground/5 inline-flex items-center justify-center text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            aria-label="Open task statistics"
          >
            <BarChart3 size={16} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <div className="flex gap-2">
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
        </div>

        {/* Category picker */}
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          {categories.map((cat) =>
            editingCatId === cat.id ? (
              <input
                key={cat.id}
                ref={editCatInputRef}
                value={editingCatName}
                onChange={(e) => setEditingCatName(e.target.value)}
                onBlur={handleSaveEditCat}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveEditCat(); } if (e.key === "Escape") setEditingCatId(null); }}
                className="w-24 rounded-full border border-primary bg-foreground/5 px-3 py-0.5 text-xs outline-none"
              />
            ) : (
              <div key={cat.id} className="group/cat relative flex items-center">
                <button
                  type="button"
                  onClick={() => setDraftCategoryId(draftCategoryId === cat.id ? null : cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs transition-colors ${
                    draftCategoryId === cat.id
                      ? "border-transparent text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  style={draftCategoryId === cat.id ? { backgroundColor: cat.color + "33", borderColor: cat.color + "88" } : {}}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cat.color }} />
                  {cat.name}
                </button>
                <div className="absolute -right-0.5 -top-0.5 hidden group-hover/cat:flex items-center gap-0.5 bg-background rounded-full border border-border px-0.5">
                  <button type="button" onClick={() => handleStartEditCat(cat)} className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <Pencil size={9} />
                  </button>
                  <button type="button" onClick={() => { onRemoveCategory(cat.id); if (draftCategoryId === cat.id) setDraftCategoryId(null); }} className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-red-400">
                    <X size={9} />
                  </button>
                </div>
              </div>
            )
          )}

          {addingCat ? (
            <input
              ref={newCatInputRef}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onBlur={handleAddCategory}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } if (e.key === "Escape") { setAddingCat(false); setNewCatName(""); } }}
              placeholder="Название..."
              className="w-28 rounded-full border border-primary bg-foreground/5 px-3 py-0.5 text-xs outline-none placeholder:text-muted-foreground"
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingCat(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              <Tag size={10} />
              Категория
            </button>
          )}
        </div>
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
          tasks.map((task) => {
            const cat = categories.find((c) => c.id === task.categoryId);
            return (
              <div
                key={task.id}
                className="group flex items-center gap-3 rounded-2xl bg-foreground/5 px-3 py-2.5"
                style={cat ? { borderLeft: `3px solid ${cat.color}66` } : { borderLeft: "3px solid transparent" }}
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
                <div className="min-w-0 flex-1">
                  {cat && (
                    <div className="mb-0.5 inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
                      <span className="text-[10px] text-muted-foreground">{cat.name}</span>
                    </div>
                  )}
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
            );
          })
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

      <Dialog open={chartOpen} onOpenChange={setChartOpen}>
        <DialogContent className="dark glass max-w-2xl border-border bg-background/95 text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Распределение времени</DialogTitle>
            <DialogDescription>Время, потраченное на задачи за выбранный период.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {(["day", "week", "month", "year"] as StatsPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                  p === chartPeriod
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-foreground/5 text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "day" ? "День" : p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
              </button>
            ))}
          </div>
          <div className="flex justify-center py-4 overflow-visible">
            <DonutChart
              tasks={filterTasksByPeriod(tasks, chartPeriod)}
              archivedTasks={filterArchiveByPeriod(chartArchive, chartPeriod)}
              hiddenIds={hiddenIdsForPeriod}
              categories={categories}
              onRemoveFromChart={handleRemoveFromChart}
              size={420}
            />
          </div>

          {/* Category summary */}
          {categories.length > 0 && (
            <CategorySummary
              tasks={filterTasksByPeriod(tasks, chartPeriod)}
              archivedTasks={filterArchiveByPeriod(chartArchive, chartPeriod)}
              hiddenIds={hiddenIdsForPeriod}
              categories={categories}
            />
          )}

          {/* All tasks breakdown */}
          <TaskBreakdown
            tasks={filterTasksByPeriod(tasks, chartPeriod)}
            archivedTasks={filterArchiveByPeriod(chartArchive, chartPeriod)}
            hiddenIds={hiddenIdsForPeriod}
            categories={categories}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

interface CategorySummaryProps {
  tasks: DailyTask[];
  archivedTasks: DailyTask[];
  hiddenIds: string[];
  categories: Category[];
}

function CategorySummary({ tasks, archivedTasks, hiddenIds, categories }: CategorySummaryProps) {
  const [now] = useState(() => Date.now());
  const hidden = new Set(hiddenIds);
  const liveIds = new Set(tasks.map((t) => t.id));
  const allItems = [
    ...archivedTasks,
    ...tasks.filter((t) => !archivedTasks.find((a) => a.id === t.id)),
  ].filter((item) => !hidden.has(item.id));

  const stats = categories
    .map((cat) => {
      const catTasks = allItems.filter((t) => t.categoryId === cat.id);
      const totalSec = catTasks.reduce((sum, t) => {
        const isLive = liveIds.has(t.id);
        const end = isLive ? (t.completedAt ?? now) : (t.completedAt ?? t.createdAt);
        return sum + Math.max(0, (end - t.createdAt) / 1000);
      }, 0);
      return { cat, count: catTasks.length, totalSec };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.totalSec - a.totalSec);

  if (stats.length === 0) return null;

  const maxSec = stats[0].totalSec;

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-foreground/5 p-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-3">По категориям</div>
      {stats.map(({ cat, count, totalSec }) => (
        <div key={cat.id} className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cat.color }} />
              <span className="text-sm truncate">{cat.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{count} {count === 1 ? "задача" : count < 5 ? "задачи" : "задач"}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: cat.color }}>
              {fmtSeconds(totalSec)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(totalSec / maxSec) * 100}%`, background: cat.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TaskBreakdownProps {
  tasks: DailyTask[];
  archivedTasks: DailyTask[];
  hiddenIds: string[];
  categories: Category[];
}

function TaskBreakdown({ tasks, archivedTasks, hiddenIds, categories }: TaskBreakdownProps) {
  const [now] = useState(() => Date.now());
  const hidden = new Set(hiddenIds);
  const liveIds = new Set(tasks.map((t) => t.id));
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const items = [
    ...archivedTasks,
    ...tasks.filter((t) => !archivedTasks.find((a) => a.id === t.id)),
  ]
    .filter((t) => !hidden.has(t.id))
    .map((t) => {
      const isLive = liveIds.has(t.id);
      const end = isLive ? (t.completedAt ?? now) : (t.completedAt ?? t.createdAt);
      const sec = Math.max(0, (end - t.createdAt) / 1000);
      const cat = t.categoryId ? catMap.get(t.categoryId) : undefined;
      return { ...t, sec, cat, isLive };
    })
    .filter((t) => t.sec > 0)
    .sort((a, b) => b.sec - a.sec);

  if (items.length === 0) return null;

  const maxSec = items[0].sec;

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-foreground/5 p-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-3">Все задачи</div>
      {items.map((item) => (
        <div key={item.id} className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {item.cat ? (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.cat.color }} />
              ) : (
                <span className="h-2 w-2 shrink-0 rounded-full bg-foreground/20" />
              )}
              <span className="text-sm truncate">{item.title}</span>
              {item.cat && (
                <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">{item.cat.name}</span>
              )}
            </div>
            <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: item.cat?.color ?? undefined }}>
              {fmtSeconds(item.sec)}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.sec / maxSec) * 100}%`,
                background: item.cat?.color ?? "oklch(0.82 0.12 200)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function fmtSeconds(sec: number): string {
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}ч`;
  if (sec >= 60) return `${Math.round(sec / 60)}м`;
  return `${Math.round(sec)}с`;
}

interface TaskStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: CompletedTaskRecord[];
}

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
      <DialogContent className="dark glass max-w-xl border-border bg-background/95 text-foreground">
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

function getPeriodStart(period: StatsPeriod): number {
  const now = new Date();
  if (period === "day") return startOfDay(now).getTime();
  if (period === "week") return startOfWeek(now).getTime();
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return new Date(now.getFullYear(), 0, 1).getTime();
}

function filterTasksByPeriod(tasks: DailyTask[], period: StatsPeriod): DailyTask[] {
  const from = getPeriodStart(period);
  return tasks.filter((t) => t.createdAt >= from);
}

function filterArchiveByPeriod(archive: DailyTask[], period: StatsPeriod): DailyTask[] {
  const from = getPeriodStart(period);
  return archive.filter((t) => (t.completedAt ?? t.createdAt) >= from);
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
