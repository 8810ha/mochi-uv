import { useEffect, useState } from "react";
import type { ReminderSettings } from "@mochi-uv/shared";
import { isPushRegistered, registerPush, unregisterPush } from "../lib/push";

interface Props {
  open: boolean;
  settings: ReminderSettings;
  onClose: () => void;
  onSave: (s: ReminderSettings) => void;
}

export function SettingsSheet({ open, settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<ReminderSettings>(settings);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNote, setPushNote] = useState<string>("");

  useEffect(() => {
    if (open) setPushOn(isPushRegistered());
  }, [open]);

  const togglePush = async () => {
    setPushBusy(true);
    setPushNote("");
    try {
      if (pushOn) {
        await unregisterPush();
        setPushOn(false);
      } else {
        const r = await registerPush();
        if (r.ok) {
          setPushOn(true);
          setPushNote("これでアプリを閉じてても届くよ 🌸");
        } else {
          setPushNote(r.reason === "denied" ? "通知が拒否されました" : `登録失敗 (${r.reason})`);
        }
      }
    } finally {
      setPushBusy(false);
    }
  };

  if (!open) return null;

  const update = <K extends keyof ReminderSettings>(k: K, v: ReminderSettings[K]) =>
    setDraft({ ...draft, [k]: v });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-mochi-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-mochi-50 rounded-t-3xl sm:rounded-3xl p-6 max-h-[88vh] overflow-y-auto shadow-mochi">
        <div className="w-12 h-1.5 bg-mochi-200 rounded-full mx-auto mb-5 sm:hidden" />
        <h2 className="font-serif text-xl mb-5">わたしの設定</h2>

        <Section title="リマインド間隔">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={draft.intervalMode === "spf-auto"}
              onChange={(e) =>
                update("intervalMode", e.target.checked ? "spf-auto" : "manual")
              }
              className="w-5 h-5 accent-mochi-400"
            />
            <span className="text-sm">SPFに合わせて自動調整</span>
          </label>
          <p className="text-[11px] text-mochi-400 mb-3 leading-relaxed">
            SPF50→3h / SPF30→2.5h / SPF20→2h / SPF15以下→1.5h
          </p>
          <div className="flex gap-2" style={{ opacity: draft.intervalMode === "spf-auto" ? 0.4 : 1 }}>
            {[90, 120, 180, 240].map((m) => (
              <Pill
                key={m}
                active={draft.intervalMinutes === m}
                onClick={() => {
                  update("intervalMinutes", m);
                  update("intervalMode", "manual");
                }}
              >
                {m / 60}h
              </Pill>
            ))}
          </div>
        </Section>

        <Section title="事前リマインド">
          <p className="text-[11px] text-mochi-400 mb-2">
            塗り直し時刻の前にやさしくお知らせ
          </p>
          <div className="flex gap-2">
            {[0, 15, 30, 60].map((m) => (
              <Pill
                key={m}
                active={draft.preWarnMinutes === m}
                onClick={() => update("preWarnMinutes", m)}
              >
                {m === 0 ? "なし" : `${m}分前`}
              </Pill>
            ))}
          </div>
        </Section>

        <Section title="日焼け止め">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              SPF
              <input
                type="number"
                value={draft.defaultProfile.spf}
                onChange={(e) =>
                  update("defaultProfile", {
                    ...draft.defaultProfile,
                    spf: Number(e.target.value),
                  })
                }
                className="w-full mt-1 rounded-xl border-mochi-200 border bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm">
              PA
              <select
                value={draft.defaultProfile.pa}
                onChange={(e) =>
                  update("defaultProfile", {
                    ...draft.defaultProfile,
                    pa: e.target.value as ReminderSettings["defaultProfile"]["pa"],
                  })
                }
                className="w-full mt-1 rounded-xl border-mochi-200 border bg-white px-3 py-2"
              >
                <option>PA+</option>
                <option>PA++</option>
                <option>PA+++</option>
                <option>PA++++</option>
              </select>
            </label>
          </div>
        </Section>

        <Section title="お休み時間（夜間オフ）">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={23}
              value={draft.quietHours?.startHour ?? 22}
              onChange={(e) =>
                update("quietHours", {
                  startHour: Number(e.target.value),
                  endHour: draft.quietHours?.endHour ?? 6,
                })
              }
              className="w-20 rounded-xl border-mochi-200 border bg-white px-3 py-2 text-center"
            />
            <span className="text-mochi-400">時 〜</span>
            <input
              type="number"
              min={0}
              max={23}
              value={draft.quietHours?.endHour ?? 6}
              onChange={(e) =>
                update("quietHours", {
                  startHour: draft.quietHours?.startHour ?? 22,
                  endHour: Number(e.target.value),
                })
              }
              className="w-20 rounded-xl border-mochi-200 border bg-white px-3 py-2 text-center"
            />
            <span className="text-mochi-400">時</span>
          </div>
        </Section>

        <Section title="冬眠モード">
          <p className="text-xs text-mochi-400 mb-2">指定日まで通知を完全オフにします</p>
          <input
            type="date"
            value={draft.hibernateUntil?.slice(0, 10) ?? ""}
            onChange={(e) =>
              update(
                "hibernateUntil",
                e.target.value ? `${e.target.value}T00:00:00.000Z` : null,
              )
            }
            className="w-full rounded-xl border-mochi-200 border bg-white px-3 py-2"
          />
          {draft.hibernateUntil && (
            <button
              onClick={() => update("hibernateUntil", null)}
              className="mt-2 text-xs text-mochi-500 underline"
            >
              冬眠を解除
            </button>
          )}
        </Section>

        <Section title="アプリを閉じても通知を受け取る">
          <p className="text-[11px] text-mochi-400 mb-2">
            iPhone は iOS 16.4+ で「ホーム画面に追加」後に有効
          </p>
          <button
            onClick={togglePush}
            disabled={pushBusy}
            className={`w-full rounded-full py-3 text-sm font-bold transition ${
              pushOn
                ? "bg-mochi-100 text-mochi-500 border border-mochi-300"
                : "bg-mochi-300 text-white shadow-mochi"
            }`}
          >
            {pushBusy ? "..." : pushOn ? "✓ 通知ON（タップで解除）" : "🔔 アプリ閉じても通知を受け取る"}
          </button>
          {pushNote && <div className="text-[11px] text-mochi-500 mt-2 text-center">{pushNote}</div>}
        </Section>

        <Section title="日の出〜日没のみ通知">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.sunCycleOnly}
              onChange={(e) => update("sunCycleOnly", e.target.checked)}
              className="w-5 h-5 accent-mochi-400"
            />
            <span className="text-sm">紫外線が出ている時間だけ通知</span>
          </label>
        </Section>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-full py-3 bg-white border border-mochi-200 text-mochi-ink"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="flex-1 btn-primary py-3"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mb-3">
      <div className="text-sm font-bold text-mochi-ink mb-3">{title}</div>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-sm font-bold transition ${
        active
          ? "bg-mochi-300 text-white shadow-mochi"
          : "bg-white text-mochi-400 border border-mochi-200"
      }`}
    >
      {children}
    </button>
  );
}
