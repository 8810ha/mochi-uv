import { useMemo } from "react";
import {
  calcSunTimes,
  dailyProtectionPercent,
  isInSunlight,
  nextRecommendedReapply,
  spfRecommendedInterval,
  SWEAT_INTERVAL_FACTOR,
  type ApplyEvent,
  type Outfit,
  type ReminderSettings,
} from "@mochi-uv/shared";
import { ProtectionRing } from "./ProtectionRing";
import { ApplyButton } from "./ApplyButton";
import { StreakBadge } from "./StreakBadge";
import { pickMood } from "./MochiUbi";

interface Props {
  settings: ReminderSettings;
  events: ApplyEvent[];
  setEvents: (e: ApplyEvent[]) => void;
  now: string;
  justApplied: boolean;
  outfit: Outfit;
  onApply: () => void;
  onSkip: () => void;
  onSweat: () => void;
}

export function HomeScreen({
  settings,
  events,
  now,
  justApplied,
  outfit,
  onApply,
  onSkip,
  onSweat,
}: Props) {
  const loc = settings.location ?? { lat: 35.6762, lng: 139.6503 };
  const today = now.slice(0, 10);
  const todayEvents = useMemo(
    () => events.filter((e) => e.appliedAt.slice(0, 10) === today),
    [events, today],
  );

  const { sunrise, sunset } = useMemo(
    () => calcSunTimes(loc.lat, loc.lng, `${today}T12:00:00.000Z`),
    [loc.lat, loc.lng, today],
  );
  const protectionPercent = useMemo(
    () => dailyProtectionPercent(todayEvents, sunrise, sunset, now),
    [todayEvents, sunrise, sunset, now],
  );

  const last = todayEvents[todayEvents.length - 1];
  const effectiveInterval =
    settings.intervalMode === "spf-auto"
      ? spfRecommendedInterval(last?.spf ?? settings.defaultProfile.spf)
      : settings.intervalMinutes;
  const nextDueAt = nextRecommendedReapply(last, effectiveInterval);
  const inHibernate =
    !!settings.hibernateUntil && new Date(now) < new Date(settings.hibernateUntil);
  const sunlight = isInSunlight(loc.lat, loc.lng, now);
  const mood = pickMood(
    protectionPercent,
    last?.appliedAt ?? null,
    now,
    inHibernate,
    sunlight,
    justApplied,
  );

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-5">
      {inHibernate && (
        <div className="card w-full text-center">
          <div className="text-xs text-mochi-400">冬眠モード中</div>
          <div className="font-serif text-lg text-mochi-ink">
            {new Date(settings.hibernateUntil!).toLocaleDateString("ja-JP")} までお休み
          </div>
        </div>
      )}

      <ProtectionRing percent={protectionPercent} mood={mood} outfit={outfit} />

      <div className="w-full">
        <StreakBadge days={streakOf(events, now)} nextDueAt={nextDueAt} />
      </div>

      <div className="w-full">
        <ApplyButton onApply={onApply} onSkip={onSkip} />
      </div>

      {last && (
        <button
          onClick={onSweat}
          className="text-xs text-mochi-500 underline-offset-4 hover:underline"
        >
          💦 汗かいた・水に入った（間隔を短く）
        </button>
      )}

      <div className="card w-full">
        <div className="text-sm font-bold text-mochi-ink mb-3">今日の記録</div>
        {todayEvents.length === 0 ? (
          <div className="text-sm text-mochi-400 py-4 text-center">
            まだ塗っていません。1回目を記録しよう 🌸
          </div>
        ) : (
          <ul className="divide-y divide-mochi-100">
            {todayEvents.map((e, i) => (
              <li key={e.id} className="py-2 flex items-center justify-between text-sm">
                <span className="pill">#{i + 1}</span>
                <span className="font-serif">
                  {new Date(e.appliedAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-mochi-400">
                  SPF{e.spf} / {e.pa}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-xs text-mochi-400 text-center mt-2">
        ☀️ {new Date(sunrise).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
        {"   "}
        🌙 {new Date(sunset).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

function streakOf(events: ApplyEvent[], nowIso: string): number {
  const days = new Set<string>(events.map((e) => e.appliedAt.slice(0, 10)));
  let n = 0;
  const cursor = new Date(nowIso);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

const _SWEAT = SWEAT_INTERVAL_FACTOR;
void _SWEAT;
