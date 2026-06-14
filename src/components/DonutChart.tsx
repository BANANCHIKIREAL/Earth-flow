import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import type { Category, DailyTask } from "@/hooks/useDailyTasks";

const PALETTE = [
  "#6B8FA8", "#E8625A", "#F5A623", "#4DC8D4",
  "#6BBF8E", "#9B72CF", "#E07BB5", "#7BB5E0",
];

function toXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function ringPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  a1: number, a2: number,
) {
  const large = a2 - a1 > 180 ? 1 : 0;
  const os = toXY(cx, cy, outerR, a1);
  const oe = toXY(cx, cy, outerR, a2);
  const ie = toXY(cx, cy, innerR, a2);
  const is_ = toXY(cx, cy, innerR, a1);
  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${is_.x} ${is_.y}`,
    `Z`,
  ].join(" ");
}

function fmtTime(sec: number): string {
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}h`;
  if (sec >= 60)   return `${Math.round(sec / 60)}m`;
  return `${Math.round(sec)}s`;
}

interface Props {
  tasks: DailyTask[];
  archivedTasks?: DailyTask[];
  hiddenIds?: string[];
  categories?: Category[];
  onRemoveFromChart?: (id: string) => void;
  size?: number;
}

export function DonutChart({ tasks, archivedTasks = [], hiddenIds = [], categories = [], onRemoveFromChart, size = 500 }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hidden = new Set(hiddenIds);
  const liveIds = new Set(tasks.map((t) => t.id));

  const allItems = [
    ...archivedTasks,
    ...tasks.filter((t) => !archivedTasks.find((a) => a.id === t.id)),
  ]
    .filter((item) => !hidden.has(item.id))
    .sort((a, b) => a.createdAt - b.createdAt);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  const slices = allItems
    .map((item, i) => {
      const isLive = liveIds.has(item.id);
      const end = isLive ? (item.completedAt ?? now) : (item.completedAt ?? item.createdAt);
      const sec = Math.max(0, (end - item.createdAt) / 1000);
      const shortTitle = item.title.length > 14 ? `${item.title.slice(0, 12)}…` : item.title;
      const cat = item.categoryId ? catMap.get(item.categoryId) : undefined;
      const color = cat ? cat.color : PALETTE[i % PALETTE.length];
      return { id: item.id, label: shortTitle, sec, color, categoryId: item.categoryId };
    })
    .filter((s) => s.sec > 0);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.265;
  const innerR = size * 0.155;
  const midR   = (outerR + innerR) / 2;
  const gap    = 1.2;

  if (slices.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 text-muted-foreground"
        style={{ width: size, height: size * 0.5 }}
      >
        <svg width={size * 0.52} height={size * 0.52} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="currentColor"
            strokeWidth={outerR - innerR} strokeDasharray="6 10" opacity={0.18} />
        </svg>
        <p className="text-sm text-center">
          Добавь задачи — они появятся<br />на диаграмме автоматически
        </p>
      </div>
    );
  }

  const totalSec = slices.reduce((s, d) => s + d.sec, 0);

  let cursor = 0;
  const segs = slices.map((s, i) => {
    const pct   = s.sec / totalSec;
    const span  = pct * 360 - gap;
    const start = cursor + gap / 2;
    const end   = start + span;
    cursor += pct * 360;
    return { ...s, i, pct, start, end, mid: start + span / 2 };
  });

  const elbowR   = outerR * 1.38;
  const anchorR  = outerR * 1.70;
  const stubLen  = size * 0.055;
  const iconSize = Math.round(size * 0.038); // ~16px at size=420

  return (
    <div className="inline-flex items-center justify-center select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
      >
        {/* ── ring segments ── */}
        {segs.map((s) => {
          const active = hovered === s.i;
          const pctMid = toXY(cx, cy, midR, s.mid);

          return (
            <g
              key={s.i}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                transform: `scale(${active ? 1.05 : 1})`,
                transition: "transform 0.22s cubic-bezier(.34,1.56,.64,1)",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHovered(s.i)}
              onMouseLeave={() => setHovered(null)}
            >
              <path
                d={ringPath(cx, cy, outerR, innerR, s.start, s.end)}
                fill={s.color}
                opacity={hovered !== null && !active ? 0.38 : 1}
                style={{ transition: "opacity 0.18s" }}
              />
              {s.pct >= 0.05 && (
                <text
                  x={pctMid.x} y={pctMid.y}
                  textAnchor="middle" dominantBaseline="central"
                  fill="white" fontSize={size * 0.036} fontWeight="700"
                  style={{ pointerEvents: "none" }}
                >
                  {Math.round(s.pct * 100)}%
                </text>
              )}
            </g>
          );
        })}

        {/* ── center total ── */}
        <text
          x={cx} y={cy}
          textAnchor="middle" dominantBaseline="central"
          fill="currentColor" fontSize={size * 0.075} fontWeight="800"
          className="text-foreground"
        >
          {fmtTime(totalSec)}
        </text>

        {/* ── leader lines + labels + trash buttons ── */}
        {segs.map((s) => {
          const active   = hovered === s.i;
          const opacity  = hovered !== null && !active ? 0.28 : 1;
          const dotPt    = toXY(cx, cy, outerR + size * 0.022, s.mid);
          const elbowPt  = toXY(cx, cy, elbowR,  s.mid);
          const anchorPt = toXY(cx, cy, anchorR, s.mid);
          const right    = anchorPt.x >= cx;
          const stubEnd  = { x: anchorPt.x + (right ? stubLen : -stubLen), y: anchorPt.y };
          const textX    = stubEnd.x + (right ? size * 0.008 : -size * 0.008);
          const anchor   = right ? "start" : "end";

          // Trash icon sits just before the time text (between stub and text)
          const trashX = right
            ? stubEnd.x - iconSize - size * 0.005
            : stubEnd.x + size * 0.005;
          const trashY = anchorPt.y - iconSize / 2;

          return (
            <g
              key={`lbl-${s.i}`}
              style={{ opacity, transition: "opacity 0.18s" }}
              onMouseEnter={() => setHovered(s.i)}
              onMouseLeave={() => setHovered(null)}
            >
              <polyline
                points={`${dotPt.x},${dotPt.y} ${elbowPt.x},${elbowPt.y} ${anchorPt.x},${anchorPt.y} ${stubEnd.x},${stubEnd.y}`}
                fill="none" stroke={s.color}
                strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
              />
              <circle cx={dotPt.x} cy={dotPt.y} r={size * 0.012} fill={s.color} />

              {/* time */}
              <text x={textX} y={anchorPt.y - size * 0.02}
                textAnchor={anchor} fill={s.color}
                fontSize={size * 0.045} fontWeight="700"
                style={{ pointerEvents: "none" }}>
                {fmtTime(s.sec)}
              </text>
              {/* label */}
              <text x={textX} y={anchorPt.y + size * 0.023}
                textAnchor={anchor} fill={s.color}
                fontSize={size * 0.03} fontWeight="400" opacity={0.85}
                style={{ pointerEvents: "none" }}>
                {s.label}
              </text>

              {/* trash button via foreignObject */}
              <foreignObject x={trashX} y={trashY} width={iconSize} height={iconSize}>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveFromChart?.(s.id); }}
                  title="Удалить с графика"
                  style={{
                    width: iconSize,
                    height: iconSize,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: s.color,
                    opacity: 0.65,
                  }}
                >
                  <Trash2 size={Math.round(iconSize * 0.8)} />
                </button>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
