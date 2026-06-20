import type { ReminderSettings } from "@mochi-uv/shared";
import { isInSunlight } from "@mochi-uv/shared";

export type NotifyKind = "due" | "pre-warn";

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "default") {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

export function showReminder(kind: NotifyKind) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const title = kind === "due"
    ? "そろそろ塗り直しの時間 🌸"
    : "あと少しで塗り直しタイム ☀️";
  const body = kind === "due"
    ? "もちもち肌をキープしよ。タップで記録できるよ。"
    : "1時間後に塗り直し予定。準備しとこ。";
  new Notification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: `mochi-uv-${kind}`,
  });
}

function isQuiet(settings: ReminderSettings, now: Date): boolean {
  if (settings.hibernateUntil && now < new Date(settings.hibernateUntil)) return true;
  if (settings.quietHours) {
    const h = now.getHours();
    const { startHour, endHour } = settings.quietHours;
    const inQuiet =
      startHour < endHour
        ? h >= startHour && h < endHour
        : h >= startHour || h < endHour;
    if (inQuiet) return true;
  }
  if (settings.sunCycleOnly && settings.location) {
    if (!isInSunlight(settings.location.lat, settings.location.lng, now.toISOString())) {
      return true;
    }
  }
  return false;
}

/**
 * 今この瞬間に通知を発火すべきか判定する。
 * - "due"     : 塗り直し時刻に到達した
 * - "pre-warn": 塗り直し時刻のpreWarnMinutes分前に到達した
 * - null      : まだ
 */
export function pickFire(
  settings: ReminderSettings,
  lastAppliedAtIso: string | null,
  nowIso = new Date().toISOString(),
): NotifyKind | null {
  const now = new Date(nowIso);
  if (isQuiet(settings, now)) return null;
  if (!lastAppliedAtIso) return "due";

  const dueAt = new Date(lastAppliedAtIso).getTime() + settings.intervalMinutes * 60_000;
  const preAt = dueAt - settings.preWarnMinutes * 60_000;
  const t = now.getTime();
  if (t >= dueAt) return "due";
  if (t >= preAt && t < preAt + 60_000) return "pre-warn";
  return null;
}

/** @deprecated use pickFire */
export function shouldFireNow(
  settings: ReminderSettings,
  lastAppliedAtIso: string | null,
  nowIso = new Date().toISOString(),
): boolean {
  return pickFire(settings, lastAppliedAtIso, nowIso) !== null;
}
