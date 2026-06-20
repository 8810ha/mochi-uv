export type Tab = "home" | "stats";

interface Props {
  current: Tab;
  onChange: (t: Tab) => void;
}

export function TabBar({ current, onChange }: Props) {
  return (
    <nav
      role="navigation"
      aria-label="メインタブ"
      className="fixed bottom-0 inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
    >
      <div className="pointer-events-auto m-3 flex gap-1 bg-white/85 backdrop-blur rounded-full shadow-mochi px-1 py-1 border border-mochi-100">
        <TabBtn label="ホーム" icon="🏠" active={current === "home"} onClick={() => onChange("home")} />
        <TabBtn label="記録" icon="📊" active={current === "stats"} onClick={() => onChange("stats")} />
      </div>
    </nav>
  );
}

function TabBtn({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={`rounded-full px-5 min-h-[44px] text-sm font-bold transition flex items-center gap-2 ${
        active ? "bg-mochi-300 text-white shadow-mochi" : "text-mochi-400"
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
