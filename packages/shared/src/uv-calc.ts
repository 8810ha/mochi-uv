import type { ApplyEvent, PA } from "./types";

const PA_BLOCK_RATIO: Record<PA, number> = {
  "PA+": 0.5,
  "PA++": 0.75,
  "PA+++": 0.875,
  "PA++++": 0.9375,
};

const HALF_LIFE_HOURS = 2;

export function spfBlockRatio(spf: number): number {
  if (spf <= 1) return 0;
  return 1 - 1 / spf;
}

export function paBlockRatio(pa: PA): number {
  return PA_BLOCK_RATIO[pa];
}

export function combinedBlockRatio(spf: number, pa: PA): number {
  return (spfBlockRatio(spf) + paBlockRatio(pa)) / 2;
}

export function timeDecay(hoursElapsed: number): number {
  if (hoursElapsed <= 0) return 1;
  return Math.pow(0.5, hoursElapsed / HALF_LIFE_HOURS);
}

export function protectionAt(event: ApplyEvent, atIso: string): number {
  const elapsedMs = new Date(atIso).getTime() - new Date(event.appliedAt).getTime();
  if (elapsedMs < 0) return 0;
  const hours = elapsedMs / 3_600_000;
  return combinedBlockRatio(event.spf, event.pa) * timeDecay(hours);
}

export function dailyProtectionPercent(
  events: ApplyEvent[],
  sunriseIso: string,
  sunsetIso: string,
  now = new Date().toISOString(),
): number {
  const start = new Date(sunriseIso).getTime();
  const endRaw = new Date(sunsetIso).getTime();
  const nowMs = new Date(now).getTime();
  const end = Math.min(endRaw, nowMs);
  if (end <= start) return 0;

  const stepMs = 10 * 60 * 1000;
  let total = 0;
  let samples = 0;
  for (let t = start; t < end; t += stepMs) {
    const iso = new Date(t).toISOString();
    let best = 0;
    for (const ev of events) {
      const p = protectionAt(ev, iso);
      if (p > best) best = p;
    }
    total += best;
    samples += 1;
  }
  if (samples === 0) return 0;
  return Math.round((total / samples) * 100);
}

export function nextRecommendedReapply(
  lastEvent: ApplyEvent | undefined,
  intervalMinutes: number,
): string | null {
  if (!lastEvent) return null;
  const next = new Date(lastEvent.appliedAt).getTime() + intervalMinutes * 60_000;
  return new Date(next).toISOString();
}

/**
 * SPF値から推奨塗り直し間隔を導出する。
 * 理論値（SPF × 20分）は長すぎて現実的でないので、汗・水・摩擦を考慮した経験則に丸める。
 * - SPF50+ → 180分（3h）
 * - SPF30  → 150分（2.5h）
 * - SPF20  → 120分（2h）
 * - SPF15- →  90分（1.5h）
 */
export function spfRecommendedInterval(spf: number): number {
  if (spf >= 50) return 180;
  if (spf >= 30) return 150;
  if (spf >= 20) return 120;
  return 90;
}

/** 汗・水で短縮する補正係数（0.6なら40%短縮） */
export const SWEAT_INTERVAL_FACTOR = 0.6;
