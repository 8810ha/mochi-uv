/**
 * Web Push 購読フロー。
 * - userId は LocalStorage に永続化
 * - Worker の /users で登録 → /push でsubscription送信
 * - 公開鍵は ビルド時の VITE_VAPID_PUBLIC_KEY を使用
 */
const KEY_USER_ID = "mochi.user_id.v1";
const KEY_PUSH_REGISTERED = "mochi.push_registered.v1";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

function urlBase64ToUint8Array(b64: string): Uint8Array {
    const padding = "=".repeat((4 - (b64.length % 4)) % 4);
    const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
    return out;
}

export function getOrCreateUserId(): string {
    let id = localStorage.getItem(KEY_USER_ID);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(KEY_USER_ID, id);
    }
    return id;
}

export function isPushRegistered(): boolean {
    return localStorage.getItem(KEY_PUSH_REGISTERED) === "1";
}

export async function registerPush(): Promise<{ ok: boolean; reason?: string }> {
    if (!VAPID_PUBLIC_KEY) return { ok: false, reason: "no_vapid_key" };
    if (!API_BASE) return { ok: false, reason: "no_api_base" };
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return { ok: false, reason: "unsupported" };
    }

    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "denied" };

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
        const keyBytes = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyBytes.buffer.slice(
                keyBytes.byteOffset,
                keyBytes.byteOffset + keyBytes.byteLength,
            ) as ArrayBuffer,
        });
    }

    const userId = getOrCreateUserId();
    // userIdをサーバーに登録（既存ならno-op）
    await fetch(`${API_BASE}/users/${userId}`, { method: "POST" }).catch(() => {});
    const subJson = sub.toJSON();
    const res = await fetch(`${API_BASE}/users/${userId}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
        }),
    });

    if (!res.ok) return { ok: false, reason: `api_${res.status}` };

    localStorage.setItem(KEY_PUSH_REGISTERED, "1");
    return { ok: true };
}

export async function unregisterPush(): Promise<void> {
    const userId = localStorage.getItem(KEY_USER_ID);
    if (!userId || !API_BASE) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
        await fetch(`${API_BASE}/users/${userId}/push`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe();
    }
    localStorage.removeItem(KEY_PUSH_REGISTERED);
}
