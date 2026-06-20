interface Props {
  days: number;
  nextDueAt: string | null;
}

export function StreakBadge({ days, nextDueAt }: Props) {
  const nextLabel = nextDueAt
    ? new Date(nextDueAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="card flex items-center justify-between">
      <div>
        <div className="text-xs text-mochi-400">連続記録</div>
        <div className="font-serif text-3xl text-mochi-ink">
          {days}
          <span className="text-base text-mochi-400 ml-1">日</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-mochi-400">次の塗り直し</div>
        <div className="font-serif text-xl text-mochi-500">{nextLabel}</div>
      </div>
    </div>
  );
}
