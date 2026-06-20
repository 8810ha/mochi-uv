import { useEffect, useState } from "react";
import {
  SWEAT_INTERVAL_FACTOR,
  spfRecommendedInterval,
  type ApplyEvent,
  type Outfit,
  type ReminderSettings,
} from "@mochi-uv/shared";
import { HomeScreen } from "./components/HomeScreen";
import { StatsScreen } from "./components/StatsScreen";
import { TabBar, type Tab } from "./components/TabBar";
import { SettingsSheet } from "./components/SettingsSheet";
import {
  addEvent,
  loadEvents,
  loadOutfit,
  loadSettings,
  saveEvents,
  saveOutfit,
  saveSettings,
  streakDays,
} from "./lib/storage";
import { pickFire, requestNotificationPermission, showReminder } from "./lib/notify";

export function App() {
  const [settings, setSettings] = useState<ReminderSettings>(() => loadSettings());
  const [events, setEvents] = useState<ApplyEvent[]>(() => loadEvents());
  const [outfit, setOutfit] = useState<Outfit>(() => loadOutfit());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [now, setNow] = useState(() => new Date().toISOString());
  const [justApplied, setJustApplied] = useState(false);
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    requestNotificationPermission();
    if (!settings.location && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const next = { ...settings, location: loc };
          setSettings(next);
          saveSettings(next);
        },
        () => {},
        { maximumAge: 3_600_000 },
      );
    }
  }, []);

  useEffect(() => {
    const check = () => {
      const today = new Date().toISOString().slice(0, 10);
      const todayEvents = events.filter((e) => e.appliedAt.slice(0, 10) === today);
      const last = todayEvents[todayEvents.length - 1];
      const kind = pickFire(settings, last?.appliedAt ?? null);
      if (kind) showReminder(kind);
    };
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [events, settings]);

  const handleApply = () => {
    const ev: ApplyEvent = {
      id: crypto.randomUUID(),
      appliedAt: new Date().toISOString(),
      spf: settings.defaultProfile.spf,
      pa: settings.defaultProfile.pa,
    };
    addEvent(ev);
    setEvents([...events, ev]);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2200);
  };

  const handleSkip = () => {};

  const handleSweat = () => {
    if (events.length === 0) return;
    const last = events[events.length - 1];
    const interval =
      settings.intervalMode === "spf-auto"
        ? spfRecommendedInterval(last.spf)
        : settings.intervalMinutes;
    const shortened = new Date(
      new Date(last.appliedAt).getTime() -
        interval * (1 - SWEAT_INTERVAL_FACTOR) * 60_000,
    ).toISOString();
    const updated = events.map((e, i) =>
      i === events.length - 1 ? { ...e, appliedAt: shortened, note: "sweat" } : e,
    );
    setEvents(updated);
    saveEvents(updated);
  };

  return (
    <div className="min-h-full flex flex-col items-center px-5 pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <header className="w-full max-w-md flex items-center justify-between mb-6">
        <div>
          <div className="font-serif text-2xl text-mochi-ink leading-none">
            mochi <span className="text-mochi-300">UV</span>
          </div>
          <div className="text-xs text-mochi-400 mt-1">
            {new Date().toLocaleDateString("ja-JP", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 rounded-full bg-white/80 shadow-soft flex items-center justify-center text-mochi-400"
          aria-label="設定"
        >
          ⚙
        </button>
      </header>

      <main className="w-full max-w-md flex flex-col items-center">
        {tab === "home" ? (
          <HomeScreen
            settings={settings}
            events={events}
            setEvents={setEvents}
            now={now}
            justApplied={justApplied}
            outfit={outfit}
            onApply={handleApply}
            onSkip={handleSkip}
            onSweat={handleSweat}
          />
        ) : (
          <StatsScreen
            settings={settings}
            events={events}
            now={now}
            streakDays={streakDays()}
            outfit={outfit}
            onOutfitChange={(o) => {
              setOutfit(o);
              saveOutfit(o);
            }}
          />
        )}
      </main>

      <TabBar current={tab} onChange={setTab} />

      <SettingsSheet
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(s) => {
          setSettings(s);
          saveSettings(s);
        }}
      />
    </div>
  );
}
