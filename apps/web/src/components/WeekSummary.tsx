import { lastNDays, totalApplies, weekAverage, type ApplyEvent } from "@mochi-uv/shared";

interface Props {
  events: ApplyEvent[];
  lat: number;
  lng: number;
  nowIso: string;
}

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

export function WeekSummary({ events, lat, lng, nowIso }: Props) {
  const week = lastNDays(events, 7, lat, lng, nowIso);
  const prev = lastNDays(
    events,
    14,
    lat,
    lng,
    nowIso,
  ).slice(0, 7);

  const avg = weekAverage(week);
  const prevAvg = weekAverage(prev);
  const delta = avg - prevAvg;
  const applies = totalApplies(week);

  const W = 280;
  const H = 84;
  const padX = 12;
  const padY = 12;
  const stepX = (W - padX * 2) / (week.length - 1 || 1);
  const yFor = (p: number) => H - padY - ((H - padY * 2) * p) / 100;

  const pathPoints = week.map((d, i) => `${padX + stepX * i},${yFor(d.protectionPercent)}`);
  const linePath = `M ${pathPoints.join(" L ")}`;
  const areaPath = `M ${padX},${H - padY} L ${pathPoints.join(" L ")} L ${padX + stepX * (week.length - 1)},${H - padY} Z`;

  return (
    <div className="card w-full">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-xs text-mochi-400">THIS WEEK</div>
          <div className="font-serif text-3xl text-mochi-ink">
            {avg}
            <span className="text-lg text-mochi-400 ml-1">%</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-mochi-400">vs 先週</div>
          <div
            className={`font-serif text-base ${
              delta >= 0 ? "text-mochi-500" : "text-mochi-ink"
            }`}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </div>
          <div className="text-[10px] text-mochi-400 mt-1">塗布 {applies}回</div>
        </div>
      </div>

      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="week-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB6C1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFB6C1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#week-area)" />
        <path d={linePath} fill="none" stroke="#FF95A6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {week.map((d, i) => (
          <circle
            key={i}
            cx={padX + stepX * i}
            cy={yFor(d.protectionPercent)}
            r={3}
            fill="#fff"
            stroke="#FF95A6"
            strokeWidth={2}
          />
        ))}
      </svg>

      <div className="grid grid-cols-7 mt-1">
        {week.map((d, i) => {
          const dow = new Date(d.date).getDay();
          const isToday = d.date === nowIso.slice(0, 10);
          return (
            <div
              key={i}
              className={`text-[10px] text-center ${
                isToday ? "text-mochi-500 font-bold" : "text-mochi-400"
              }`}
            >
              {DOW[dow]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
