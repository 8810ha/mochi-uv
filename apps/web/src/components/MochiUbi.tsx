import { DEFAULT_OUTFIT, hatColors, tintColors, type Outfit } from "@mochi-uv/shared";

export type MochiMood = "worry" | "happy" | "sleepy" | "rest" | "sparkle";

interface Props {
    mood: MochiMood;
    size?: number;
    outfit?: Outfit;
}

export function MochiUbi({ mood, size = 110, outfit = DEFAULT_OUTFIT }: Props) {
    const t = tintColors(outfit.tint);
    const h = hatColors(outfit.hat);
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            className={mood === "sparkle" ? "mochi-bounce" : "mochi-idle"}
            role="img"
            aria-label={`もちうび: ${mood}`}
        >
            <defs>
                <radialGradient id={`mochi-body-${outfit.tint}`} cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor={t.from} />
                    <stop offset="70%" stopColor="#FFF5EC" />
                    <stop offset="100%" stopColor={t.to} />
                </radialGradient>
                <radialGradient id="mochi-cheek" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFB6C1" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#FFB6C1" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`hat-${outfit.hat}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={h.main} />
                    <stop offset="100%" stopColor={h.deep} />
                </linearGradient>
            </defs>

            <ellipse cx="60" cy="108" rx="28" ry="4" fill="#000" opacity="0.08" />

            <path
                d="M60 22 C 92 22, 102 50, 102 72 C 102 96, 84 108, 60 108
                   C 36 108, 18 96, 18 72 C 18 50, 28 22, 60 22 Z"
                fill={`url(#mochi-body-${outfit.tint})`}
                stroke={t.edge}
                strokeWidth="1.5"
            />

            <Hat hat={outfit.hat} fillId={`hat-${outfit.hat}`} accent={h.accent} />

            <ellipse cx="40" cy="68" rx="9" ry="6" fill="url(#mochi-cheek)" />
            <ellipse cx="80" cy="68" rx="9" ry="6" fill="url(#mochi-cheek)" />

            {mood === "worry" && (
                <>
                    <path d="M44 60 Q48 56, 52 60" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M68 60 Q72 56, 76 60" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M52 80 Q60 76, 68 80" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </>
            )}
            {mood === "happy" && (
                <>
                    <path d="M44 62 Q48 58, 52 62" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M68 62 Q72 58, 76 62" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M52 78 Q60 86, 68 78" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </>
            )}
            {mood === "sleepy" && (
                <>
                    <path d="M44 62 L52 62" stroke="#4A3540" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M68 62 L76 62" stroke="#4A3540" strokeWidth="2.5" strokeLinecap="round" />
                    <ellipse cx="60" cy="80" rx="4" ry="2" fill="#4A3540" opacity="0.7" />
                    <text x="92" y="36" fontSize="14" fill="#FF95A6" fontWeight="bold">z</text>
                    <text x="98" y="28" fontSize="10" fill="#FF95A6" fontWeight="bold">z</text>
                </>
            )}
            {mood === "rest" && (
                <>
                    <path d="M44 64 Q48 68, 52 64" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M68 64 Q72 68, 76 64" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M52 80 Q60 82, 68 80" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <text x="86" y="40" fontSize="20" fill="#FF95A6">🌙</text>
                </>
            )}
            {mood === "sparkle" && (
                <>
                    <path d="M44 62 Q48 58, 52 62" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M68 62 Q72 58, 76 62" stroke="#4A3540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M50 76 Q60 88, 70 76 Q60 82, 50 76 Z" fill="#FF95A6" />
                    <g className="mochi-sparkle-dots">
                        <circle cx="20" cy="40" r="2.5" fill="#E8C28A" />
                        <circle cx="100" cy="48" r="2" fill="#E8C28A" />
                        <circle cx="14" cy="74" r="1.8" fill="#FFB6C1" />
                        <circle cx="106" cy="80" r="2.4" fill="#FFB6C1" />
                        <path d="M22 22 L24 26 L28 28 L24 30 L22 34 L20 30 L16 28 L20 26 Z" fill="#E8C28A" />
                        <path d="M98 18 L99 21 L102 22 L99 23 L98 26 L97 23 L94 22 L97 21 Z" fill="#FFB6C1" />
                    </g>
                </>
            )}
        </svg>
    );
}

function Hat({ hat, fillId, accent }: { hat: Outfit["hat"]; fillId: string; accent: string }) {
    switch (hat) {
        case "ribbon":
            return (
                <>
                    <ellipse cx="60" cy="30" rx="36" ry="8" fill={`url(#${fillId})`} />
                    <path d="M30 30 Q60 6, 90 30 L90 32 Q60 12, 30 32 Z" fill={`url(#${fillId})`} />
                    <circle cx="60" cy="14" r="4" fill={accent} />
                </>
            );
        case "wide-brim":
            return (
                <>
                    <ellipse cx="60" cy="32" rx="48" ry="6" fill={`url(#${fillId})`} />
                    <path d="M30 32 Q60 0, 90 32 Z" fill={`url(#${fillId})`} />
                    <path d="M30 28 Q60 22, 90 28" stroke={accent} strokeWidth="2" fill="none" />
                </>
            );
        case "bucket":
            return (
                <>
                    <rect x="22" y="28" width="76" height="8" rx="2" fill={`url(#${fillId})`} />
                    <rect x="30" y="10" width="60" height="22" rx="6" fill={`url(#${fillId})`} />
                    <circle cx="60" cy="20" r="3" fill={accent} />
                </>
            );
        case "straw":
            return (
                <>
                    <ellipse cx="60" cy="32" rx="50" ry="7" fill={`url(#${fillId})`} />
                    <path d="M28 32 Q60 4, 92 32 Z" fill={`url(#${fillId})`} />
                    <rect x="32" y="28" width="56" height="3" fill={accent} />
                </>
            );
        case "crown":
            return (
                <>
                    <path
                        d="M30 28 L30 14 L42 22 L52 8 L62 22 L78 8 L88 22 L94 14 L94 28 Z"
                        fill={`url(#${fillId})`}
                        stroke="#C99965"
                        strokeWidth="1"
                    />
                    <circle cx="60" cy="22" r="3" fill={accent} />
                    <circle cx="42" cy="22" r="2" fill={accent} />
                    <circle cx="78" cy="22" r="2" fill={accent} />
                </>
            );
    }
}

export function pickMood(
    protectionPercent: number,
    lastAppliedAtIso: string | null,
    nowIso: string,
    inHibernate: boolean,
    isSunlight: boolean,
    justApplied: boolean,
): MochiMood {
    if (justApplied) return "sparkle";
    if (inHibernate || !isSunlight) return "rest";
    if (!lastAppliedAtIso) return "worry";

    const elapsedH =
        (new Date(nowIso).getTime() - new Date(lastAppliedAtIso).getTime()) / 3_600_000;
    if (elapsedH < 0.5 || protectionPercent >= 70) return "happy";
    if (elapsedH >= 2) return "sleepy";
    return "happy";
}
