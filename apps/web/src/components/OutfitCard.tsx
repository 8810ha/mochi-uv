import {
    ACHIEVEMENTS,
    HATS,
    TINTS,
    type AchievementId,
    type ApplyEvent,
    type BodyTint,
    type HatStyle,
    type Outfit,
    evaluateAchievements,
    lastNDays,
} from "@mochi-uv/shared";
import { MochiUbi } from "./MochiUbi";

interface Props {
    events: ApplyEvent[];
    lat: number;
    lng: number;
    nowIso: string;
    streakDays: number;
    outfit: Outfit;
    onChange: (o: Outfit) => void;
}

export function OutfitCard({ events, lat, lng, nowIso, streakDays, outfit, onChange }: Props) {
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

    const canUse = (req?: AchievementId): boolean => !req || unlocked.has(req);
    const lockHint = (req?: AchievementId): string => {
        if (!req) return "";
        const a = ACHIEVEMENTS.find((x) => x.id === req);
        return a ? `🔒 ${a.detail}` : "";
    };

    return (
        <div className="card w-full">
            <div className="flex items-baseline justify-between mb-3">
                <div className="text-sm font-bold text-mochi-ink">もちうび着せ替え</div>
            </div>
            <div className="flex justify-center mb-4">
                <MochiUbi mood="happy" size={140} outfit={outfit} />
            </div>

            <div className="text-xs text-mochi-400 mb-2">帽子</div>
            <div className="grid grid-cols-5 gap-2 mb-4">
                {HATS.map((h) => {
                    const usable = canUse(h.requires);
                    const active = outfit.hat === h.id;
                    return (
                        <button
                            key={h.id}
                            disabled={!usable}
                            onClick={() => onChange({ ...outfit, hat: h.id as HatStyle })}
                            className={`rounded-2xl py-2 text-[10px] font-bold transition ${
                                active
                                    ? "bg-mochi-300 text-white shadow-mochi"
                                    : usable
                                      ? "bg-white border border-mochi-200 text-mochi-ink"
                                      : "bg-mochi-50 text-mochi-400 opacity-50 cursor-not-allowed"
                            }`}
                            title={usable ? h.name : lockHint(h.requires)}
                        >
                            {h.name}
                        </button>
                    );
                })}
            </div>

            <div className="text-xs text-mochi-400 mb-2">からだの色</div>
            <div className="grid grid-cols-4 gap-2">
                {TINTS.map((t) => {
                    const usable = canUse(t.requires);
                    const active = outfit.tint === t.id;
                    return (
                        <button
                            key={t.id}
                            disabled={!usable}
                            onClick={() => onChange({ ...outfit, tint: t.id as BodyTint })}
                            className={`rounded-2xl py-2 text-[10px] font-bold transition ${
                                active
                                    ? "bg-mochi-300 text-white shadow-mochi"
                                    : usable
                                      ? "bg-white border border-mochi-200 text-mochi-ink"
                                      : "bg-mochi-50 text-mochi-400 opacity-50 cursor-not-allowed"
                            }`}
                            title={usable ? t.name : lockHint(t.requires)}
                        >
                            {t.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
