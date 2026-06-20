import type { ApplyEvent, Outfit, ReminderSettings } from "@mochi-uv/shared";
import { MonthHeatmap } from "./MonthHeatmap";
import { WeekSummary } from "./WeekSummary";
import { AchievementsCard } from "./AchievementsCard";
import { OutfitCard } from "./OutfitCard";

interface Props {
    settings: ReminderSettings;
    events: ApplyEvent[];
    now: string;
    streakDays: number;
    outfit: Outfit;
    onOutfitChange: (o: Outfit) => void;
}

export function StatsScreen({
    settings,
    events,
    now,
    streakDays,
    outfit,
    onOutfitChange,
}: Props) {
    const loc = settings.location ?? { lat: 35.6762, lng: 139.6503 };
    const d = new Date(now);
    return (
        <div className="w-full max-w-md flex flex-col gap-5">
            <div className="flex items-baseline justify-between px-1">
                <div className="font-serif text-xl text-mochi-ink">記録</div>
                <div className="text-xs text-mochi-400">
                    {d.toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}
                </div>
            </div>

            <WeekSummary events={events} lat={loc.lat} lng={loc.lng} nowIso={now} />

            <MonthHeatmap
                events={events}
                year={d.getFullYear()}
                month={d.getMonth() + 1}
                lat={loc.lat}
                lng={loc.lng}
                nowIso={now}
            />

            <AchievementsCard
                events={events}
                lat={loc.lat}
                lng={loc.lng}
                nowIso={now}
                streakDays={streakDays}
            />

            <OutfitCard
                events={events}
                lat={loc.lat}
                lng={loc.lng}
                nowIso={now}
                streakDays={streakDays}
                outfit={outfit}
                onChange={onOutfitChange}
            />
        </div>
    );
}
