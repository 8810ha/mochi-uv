import { monthGrid, type ApplyEvent } from "@mochi-uv/shared";

interface Props {
  events: ApplyEvent[];
  year: number;
  month: number;
  lat: number;
  lng: number;
  nowIso: string;
}

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function shade(p: number): string {
  if (p <= 0) return "#FFF5F7";
  if (p < 25) return "#FFE3E9";
  if (p < 50) return "#FFD2DC";
  if (p < 75) return "#FFB6C1";
  return "#FF95A6";
}

export function MonthHeatmap({ events, year, month, lat, lng, nowIso }: Props) {
  const { weeks } = monthGrid(events, year, month, lat, lng, nowIso);
  const todayKey = nowIso.slice(0, 10);

  return (
    <div className="card w-full">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-xs text-mochi-400">CALENDAR</div>
          <div className="font-serif text-xl text-mochi-ink">
            {year}年{month}月
          </div>
        </div>
        <div className="text-xs text-mochi-400">守れた%の濃淡</div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-[10px] text-center text-mochi-400">
            {d}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell, ci) => {
              if (!cell) {
                return <div key={ci} className="aspect-square" />;
              }
              const isToday = cell.date === todayKey;
              const day = Number(cell.date.slice(-2));
              return (
                <div
                  key={ci}
                  className={`aspect-square rounded-lg flex items-center justify-center text-[11px] ${
                    isToday ? "ring-2 ring-mochi-500" : ""
                  }`}
                  style={{
                    background: shade(cell.protectionPercent),
                    color: cell.protectionPercent >= 50 ? "#fff" : "#4A3540",
                  }}
                  title={`${cell.date} ${cell.applyCount}回 / ${cell.protectionPercent}%`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className="text-[10px] text-mochi-400">薄</span>
        <div className="flex gap-1">
          {[0, 24, 49, 74, 100].map((p) => (
            <div
              key={p}
              className="w-4 h-4 rounded"
              style={{ background: shade(p) }}
            />
          ))}
        </div>
        <span className="text-[10px] text-mochi-400">濃</span>
      </div>
    </div>
  );
}
