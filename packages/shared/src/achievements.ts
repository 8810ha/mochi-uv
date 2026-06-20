import type { ApplyEvent } from "./types";

export type AchievementId =
    | "first-drop"
    | "streak-3"
    | "streak-7"
    | "streak-30"
    | "streak-100"
    | "total-50"
    | "total-200"
    | "perfect-day"
    | "perfect-week"
    | "summer-survivor"
    | "early-bird"
    | "sun-set";

export interface Achievement {
    id: AchievementId;
    name: string;
    detail: string;
    emoji: string;
    unlockedAt?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
    { id: "first-drop", name: "はじめての一滴", detail: "初めての記録", emoji: "💧" },
    { id: "streak-3", name: "3日続いた", detail: "連続3日塗布", emoji: "🌱" },
    { id: "streak-7", name: "ウィークリーガード", detail: "連続7日塗布", emoji: "🌸" },
    { id: "streak-30", name: "マンスリーガード", detail: "連続30日塗布", emoji: "🏆" },
    { id: "streak-100", name: "100日もちもち", detail: "連続100日塗布", emoji: "👑" },
    { id: "total-50", name: "コツコツ50回", detail: "累計50回塗布", emoji: "✨" },
    { id: "total-200", name: "達人200回", detail: "累計200回塗布", emoji: "💎" },
    { id: "perfect-day", name: "ぴかぴかDay", detail: "1日で90%以上守れた", emoji: "🌟" },
    { id: "perfect-week", name: "ぴかぴかWeek", detail: "1週間平均80%以上", emoji: "🎀" },
    { id: "summer-survivor", name: "夏を制す", detail: "7-9月の間に60日記録", emoji: "🌊" },
    { id: "early-bird", name: "朝活マスター", detail: "朝7時前に塗布3回", emoji: "🌅" },
    { id: "sun-set", name: "夕暮れケア", detail: "日没前1時間に塗布3回", emoji: "🌇" },
];

export interface AchievementContext {
    events: ApplyEvent[];
    sunriseToday?: string;
    sunsetToday?: string;
    streakDays: number;
    totalApplies: number;
    bestDayPercent: number;
    weekAvgPercent: number;
}

export function evaluateAchievements(ctx: AchievementContext): AchievementId[] {
    const unlocked: AchievementId[] = [];

    if (ctx.totalApplies >= 1) unlocked.push("first-drop");
    if (ctx.streakDays >= 3) unlocked.push("streak-3");
    if (ctx.streakDays >= 7) unlocked.push("streak-7");
    if (ctx.streakDays >= 30) unlocked.push("streak-30");
    if (ctx.streakDays >= 100) unlocked.push("streak-100");
    if (ctx.totalApplies >= 50) unlocked.push("total-50");
    if (ctx.totalApplies >= 200) unlocked.push("total-200");
    if (ctx.bestDayPercent >= 90) unlocked.push("perfect-day");
    if (ctx.weekAvgPercent >= 80) unlocked.push("perfect-week");

    // Summer survivor: 7,8,9月の塗布日数 >= 60
    const summerDays = new Set(
        ctx.events
            .filter((e) => {
                const m = new Date(e.appliedAt).getMonth() + 1;
                return m >= 7 && m <= 9;
            })
            .map((e) => e.appliedAt.slice(0, 10)),
    );
    if (summerDays.size >= 60) unlocked.push("summer-survivor");

    // Early bird: 朝7時前の塗布3回以上
    const earlyCount = ctx.events.filter((e) => new Date(e.appliedAt).getHours() < 7).length;
    if (earlyCount >= 3) unlocked.push("early-bird");

    // Sun set: 17時以降の塗布3回以上（夕方ケア）
    const lateCount = ctx.events.filter((e) => new Date(e.appliedAt).getHours() >= 17).length;
    if (lateCount >= 3) unlocked.push("sun-set");

    return unlocked;
}
