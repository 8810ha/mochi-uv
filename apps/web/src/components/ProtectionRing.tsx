import { MochiUbi, type MochiMood } from "./MochiUbi";
import type { Outfit } from "@mochi-uv/shared";

interface Props {
  percent: number;
  mood: MochiMood;
  outfit?: Outfit;
  size?: number;
}

export function ProtectionRing({ percent, mood, outfit, size = 260 }: Props) {
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFB6C1" />
            <stop offset="60%" stopColor="#FF95A6" />
            <stop offset="100%" stopColor="#E8C28A" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#FFE9EE"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 800ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <MochiUbi mood={mood} size={size * 0.55} outfit={outfit} />
        <div className="-mt-2 flex items-baseline gap-1">
          <span className="font-serif text-3xl text-mochi-ink">{percent}</span>
          <span className="text-base text-mochi-400">%</span>
        </div>
        <div className="text-[10px] tracking-widest text-mochi-400">
          PROTECTED
        </div>
      </div>
    </div>
  );
}
