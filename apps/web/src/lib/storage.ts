import type { ApplyEvent, Outfit, ReminderSettings } from "@mochi-uv/shared";
import { DEFAULT_OUTFIT, DEFAULT_SETTINGS } from "@mochi-uv/shared";

const KEY_SETTINGS = "mochi.settings.v1";
const KEY_EVENTS = "mochi.events.v1";
const KEY_OUTFIT = "mochi.outfit.v1";

export function loadSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: ReminderSettings) {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
}

export function loadEvents(): ApplyEvent[] {
  try {
    const raw = localStorage.getItem(KEY_EVENTS);
    if (!raw) return [];
    return JSON.parse(raw) as ApplyEvent[];
  } catch {
    return [];
  }
}

export function saveEvents(events: ApplyEvent[]) {
  localStorage.setItem(KEY_EVENTS, JSON.stringify(events));
}

export function addEvent(event: ApplyEvent) {
  const events = loadEvents();
  events.push(event);
  saveEvents(events);
}

export function eventsForDate(date: string): ApplyEvent[] {
  return loadEvents().filter((e) => e.appliedAt.slice(0, 10) === date);
}

export function streakDays(): number {
  const events = loadEvents();
  const days = new Set(events.map((e) => e.appliedAt.slice(0, 10)));
  let n = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export function loadOutfit(): Outfit {
  try {
    const raw = localStorage.getItem(KEY_OUTFIT);
    if (!raw) return DEFAULT_OUTFIT;
    return { ...DEFAULT_OUTFIT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_OUTFIT;
  }
}

export function saveOutfit(o: Outfit) {
  localStorage.setItem(KEY_OUTFIT, JSON.stringify(o));
}
