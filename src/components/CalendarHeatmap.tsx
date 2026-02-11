"use client";

type CalendarHeatmapProps = {
  timestamps: number[];
  onSelectDay?: (dayKey: string) => void;
};

type DayCell = {
  key: string;
  date: Date;
  month: number;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY_COLOR = "#ebedf0";
const LEVEL_COLORS = ["#9be9a8", "#40c463", "#30a14e", "#216e39"];

const pad2 = (value: number) => value.toString().padStart(2, "0");

const dayKey = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const startOfDay = (date: Date) => {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const toLevel = (count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 => {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }

  const ratio = count / maxCount;
  if (ratio < 0.25) {
    return 1;
  }
  if (ratio < 0.5) {
    return 2;
  }
  if (ratio < 0.75) {
    return 3;
  }
  return 4;
};

const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CalendarHeatmap = ({ timestamps, onSelectDay }: CalendarHeatmapProps) => {
  const today = startOfDay(new Date());
  const start = new Date(today.getTime() - 364 * DAY_MS);

  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const key = dayKey(startOfDay(new Date(ts)));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const maxCount = Math.max(0, ...counts.values());

  const days: DayCell[] = [];
  for (let i = 0; i < 365; i += 1) {
    const date = new Date(start.getTime() + i * DAY_MS);
    const key = dayKey(date);
    const count = counts.get(key) ?? 0;
    days.push({
      key,
      date,
      month: date.getMonth(),
      count,
      level: toLevel(count, maxCount),
    });
  }

  const firstWeekday = start.getDay();
  const gridWeeks: Array<Array<DayCell | null>> = [];
  let week: Array<DayCell | null> = Array.from({ length: 7 }, () => null);

  for (let i = 0; i < firstWeekday; i += 1) {
    week[i] = null;
  }

  for (const day of days) {
    const weekday = day.date.getDay();
    week[weekday] = day;
    if (weekday === 6) {
      gridWeeks.push(week);
      week = Array.from({ length: 7 }, () => null);
    }
  }

  if (week.some((cell) => cell !== null)) {
    gridWeeks.push(week);
  }

  const monthLabels: Array<{ index: number; label: string }> = [];
  let lastMonth = -1;
  gridWeeks.forEach((col, index) => {
    const firstDayInWeek = col.find((d) => d !== null);
    if (firstDayInWeek && firstDayInWeek.month !== lastMonth) {
      monthLabels.push({ index, label: monthShort[firstDayInWeek.month] });
      lastMonth = firstDayInWeek.month;
    }
  });

  return (
    <div className="rounded-2xl border border-zinc-300/80 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">Calendar Heatmap</h4>
        <span className="text-[11px] text-zinc-500">Last 365 days</span>
      </div>

      <div className="relative mb-1 h-4 pl-8">
        {monthLabels.map((month) => (
          <span key={`${month.label}-${month.index}`} className="absolute text-[10px] text-zinc-500" style={{ left: `${32 + month.index * 12}px` }}>
            {month.label}
          </span>
        ))}
      </div>

      <div className="flex items-start gap-2">
        <div className="mt-[3px] flex flex-col gap-[2px] text-[10px] text-zinc-500">
          <span>Sun</span>
          <span className="invisible">Mon</span>
          <span>Tue</span>
          <span className="invisible">Wed</span>
          <span>Thu</span>
          <span className="invisible">Fri</span>
          <span>Sat</span>
        </div>

        <div className="grid auto-cols-[10px] grid-flow-col gap-[2px]">
          {gridWeeks.map((weekCol, weekIndex) => (
            <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-[2px]">
              {weekCol.map((cell, dayIndex) => {
                if (!cell) {
                  return <div key={`empty-${weekIndex}-${dayIndex}`} className="h-[10px] w-[10px]" />;
                }

                const bg = cell.level === 0 ? EMPTY_COLOR : LEVEL_COLORS[cell.level - 1];
                const labelDate = cell.date.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => onSelectDay?.(cell.key)}
                    title={`${cell.count} edits on ${labelDate}`}
                    className="h-[10px] w-[10px] rounded-[2px] border border-black/5"
                    style={{ backgroundColor: bg }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-zinc-500">
        <span>Less</span>
        <span className="h-[10px] w-[10px] rounded-[2px] border border-black/5" style={{ backgroundColor: EMPTY_COLOR }} />
        {LEVEL_COLORS.map((color) => (
          <span key={color} className="h-[10px] w-[10px] rounded-[2px] border border-black/5" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};
