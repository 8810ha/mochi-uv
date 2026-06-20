import type { AchievementId } from "./achievements";

export type HatStyle = "ribbon" | "wide-brim" | "bucket" | "straw" | "crown";
export type BodyTint = "cream" | "peach" | "lavender" | "mint";

export interface Outfit {
    hat: HatStyle;
    tint: BodyTint;
}

export const DEFAULT_OUTFIT: Outfit = { hat: "ribbon", tint: "cream" };

export interface OutfitItem<T> {
    id: T;
    name: string;
    requires?: AchievementId;
}

export const HATS: OutfitItem<HatStyle>[] = [
    { id: "ribbon", name: "リボン" },
    { id: "wide-brim", name: "つば広ハット", requires: "streak-3" },
    { id: "bucket", name: "バケットハット", requires: "streak-7" },
    { id: "straw", name: "麦わら帽子", requires: "summer-survivor" },
    { id: "crown", name: "もちもち王冠", requires: "streak-100" },
];

export const TINTS: OutfitItem<BodyTint>[] = [
    { id: "cream", name: "クリーム" },
    { id: "peach", name: "ピーチ", requires: "perfect-day" },
    { id: "lavender", name: "ラベンダー", requires: "perfect-week" },
    { id: "mint", name: "ミント", requires: "total-200" },
];

export function tintColors(tint: BodyTint): { from: string; to: string; edge: string } {
    switch (tint) {
        case "cream":
            return { from: "#FFFFFF", to: "#FFE9EE", edge: "#FFD2DC" };
        case "peach":
            return { from: "#FFFFFF", to: "#FFD2DC", edge: "#FFB6C1" };
        case "lavender":
            return { from: "#FFFFFF", to: "#E9E0F4", edge: "#C9B7E2" };
        case "mint":
            return { from: "#FFFFFF", to: "#DDF1E6", edge: "#A8D5BB" };
    }
}

export function hatColors(hat: HatStyle): { main: string; deep: string; accent: string } {
    switch (hat) {
        case "ribbon":
            return { main: "#FFB6C1", deep: "#FF95A6", accent: "#E8C28A" };
        case "wide-brim":
            return { main: "#E8C28A", deep: "#C99965", accent: "#FFB6C1" };
        case "bucket":
            return { main: "#A8D5BB", deep: "#7FB997", accent: "#FFFFFF" };
        case "straw":
            return { main: "#F2D88E", deep: "#D6B45F", accent: "#FF95A6" };
        case "crown":
            return { main: "#F9E27D", deep: "#E8C03C", accent: "#FFFFFF" };
    }
}
