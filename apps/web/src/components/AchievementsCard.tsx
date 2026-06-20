import {
    ACHIEVEMENTS,
    evaluateAchievements,
    lastNDays,
    type ApplyEvent,
    type AchievementId,
} from "@mochi-uv/shared";

interface Props {
    events: ApplyEvent[];
    lat: number;
    lng: number;
    nowIso: string;
    streakDays: number;
}

export function AchievementsCard({ events, lat, lng, nowIso, streakDays }: Props) {
    const week = lastNDays(events, 7, lat, lng, nowIso);
    const weekAvg = week.length
        ? Math.round(week.reduce((s, d) => s + d.protectionPercent, 0) / week.length)
        : 0;
    const last30 = lastNDays(events, 30, lat, lng, nowIso);
    const bestDay = last30.reduce((m, d) => Math.max(m, d.protectionPercent), 0);

    const unlocked = new Set<AchievementId>(
        evaluateAchievements({
            events,
            streakDays,
            totalApplies: events.length,
            bestDayPercent: bestDay,
            weekAvgPercent: weekAvg,
        }),
    );

    return (
        <div className="card w-full">
            <div className="flex items-baseline justify-between mb-3">
                <div className="text-sm font-bold text-mochi-ink">バッジコレクション</div>
                <div className="text-xs text-mochi-400">
                    {unlocked.size} / {ACHIEVEMENTS.length}
                </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
                {ACHIEVEMENTS.map((a) => {
                    const got = unlocked.has(a.id);
                    return (
                        <div key={a.id} className="flex flex-col items-center gap-1">
                            <div
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                                    got
                                        ? "bg-gradient-to-br from-mochi-200 to-mochi-gold/40 shadow-mochi"
                                        : "bg-mochi-50 grayscale opacity-40"
                                }`}
                                aria-label={got ? `${a.name} 獲得済` : `${a.name} 未獲得`}
                            >
                                {a.emoji}
                            </div>
                            <div className="text-[10px] text-center leading-tight text-mochi-ink font-bold">
                                {a.name}
                            </div>
                            <div className="text-[9px] text-mochi-400 text-center leading-tight">
                                {a.detail}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
