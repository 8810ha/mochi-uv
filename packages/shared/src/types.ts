export type PA = "PA+" | "PA++" | "PA+++" | "PA++++";

export interface SunscreenProfile {
  spf: number;
  pa: PA;
  name?: string;
}

export interface ApplyEvent {
  id: string;
  appliedAt: string;
  spf: number;
  pa: PA;
  note?: string;
}

export interface DailyRecord {
  date: string;
  events: ApplyEvent[];
  protectionPercent: number;
  streakDays: number;
}

export interface ReminderSettings {
  intervalMinutes: number;
  intervalMode: "manual" | "spf-auto";
  preWarnMinutes: number;
  defaultProfile: SunscreenProfile;
  quietHours: { startHour: number; endHour: number } | null;
  hibernateUntil: string | null;
  sunCycleOnly: boolean;
  location: { lat: number; lng: number } | null;
  geofenceOff: { name: string; lat: number; lng: number; radiusM: number }[];
}

export interface SunTimes {
  sunrise: string;
  sunset: string;
}

export const DEFAULT_SETTINGS: ReminderSettings = {
  intervalMinutes: 120,
  intervalMode: "spf-auto",
  preWarnMinutes: 60,
  defaultProfile: { spf: 50, pa: "PA++++" },
  quietHours: { startHour: 22, endHour: 6 },
  hibernateUntil: null,
  sunCycleOnly: true,
  location: null,
  geofenceOff: [],
};
