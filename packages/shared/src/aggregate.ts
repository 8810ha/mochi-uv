import type { ApplyEvent } from "./types";
import { dailyProtectionPercent } from "./uv-calc";
import { calcSunTimes } from "./sun";

export interface DaySummary {
  date: string;
  applyCount: number;
  protectionPercent: number;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function summarizeRange(
  events: ApplyEvent[],
  fromIso: string,
  toIso: string,
  lat: number,
  lng: number,
  nowIso = new Date().toISOString(),
): DaySummary[] {
  const out: DaySummary[] = [];
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  while (cursor <= end) {
    const key = dateKey(cursor);
    const dayEvents = events.filter((e) => e.appliedAt.slice(0, 10) === key);
    const { sunrise, sunset } = calcSunTimes(lat, lng, `${key}T12:00:00.000Z`);
    out.push({
      date: key,
      applyCount: dayEvents.length,
      protectionPercent: dailyProtectionPercent(dayEvents, sunrise, sunset, nowIso),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function lastNDays(
  events: ApplyEvent[],
  n: number,
  lat: number,
  lng: number,
  nowIso = new Date().toISOString(),
): DaySummary[] {
  const today = new Date(nowIso);
  const start = new Date(today);
  start.setDate(today.getDate() - (n - 1));
  return summarizeRange(events, start.toISOString(), today.toISOString(), lat, lng, nowIso);
}

export function monthGrid(
  events: ApplyEvent[],
  year: number,
  month: number,
  lat: number,
  lng: number,
  nowIso = new Date().toISOString(),
): { weeks: (DaySummary | null)[][] } {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const summaries = summarizeRange(
    events,
    first.toISOString(),
    last.toISOString(),
    lat,
    lng,
    nowIso,
  );
  const byKey: Record<string, DaySummary> = {};
  for (const s of summaries) byKey[s.date] = s;

  const weeks: (DaySummary | null)[][] = [];
  let week: (DaySummary | null)[] = [];
  for (let i = 0; i < first.getDay(); i += 1) week.push(null);
  for (let d = 1; d <= last.getDate(); d += 1) {
    const dt = new Date(year, month - 1, d);
    week.push(byKey[dateKey(dt)]);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  while (week.length > 0 && week.length < 7) week.push(null);
  if (week.length > 0) weeks.push(week);
  return { weeks };
}

export function weekAverage(summaries: DaySummary[]): number {
  const valid = summaries.filter((s) => s.applyCount > 0);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((sum, s) => sum + s.protectionPercent, 0) / valid.length);
}

export function totalApplies(summaries: DaySummary[]): number {
  return summaries.reduce((sum, s) => sum + s.applyCount, 0);
}
