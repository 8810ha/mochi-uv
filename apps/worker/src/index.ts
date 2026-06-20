import { Hono } from "hono";
import { cors } from "hono/cors";
import {
    calcSunTimes,
    dailyProtectionPercent,
    DEFAULT_SETTINGS,
    isInSunlight,
    spfRecommendedInterval,
    type ApplyEvent,
    type ReminderSettings,
} from "@mochi-uv/shared";
import { sendWebPush } from "./web-push";

type Bindings = {
    DB: D1Database;
    APP_NAME: string;
    VAPID_PUBLIC_KEY: string;
    VAPID_PRIVATE_KEY: string;
    VAPID_SUBJECT: string;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "DELETE"] }));

app.get("/", (c) => c.json({ ok: true, app: c.env.APP_NAME, version: "0.2.0-push" }));

app.post("/users", async (c) => {
    const id = crypto.randomUUID();
    await c.env.DB.prepare("INSERT INTO users (id, settings_json) VALUES (?, ?)")
        .bind(id, JSON.stringify(DEFAULT_SETTINGS))
        .run();
    return c.json({ id, settings: DEFAULT_SETTINGS });
});

app.get("/users/:id/settings", async (c) => {
    const id = c.req.param("id");
    const row = await c.env.DB.prepare("SELECT settings_json FROM users WHERE id = ?")
        .bind(id)
        .first<{ settings_json: string }>();
    if (!row) return c.json({ error: "not_found" }, 404);
    return c.json(JSON.parse(row.settings_json) as ReminderSettings);
});

app.put("/users/:id/settings", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<ReminderSettings>();
    await c.env.DB.prepare("UPDATE users SET settings_json = ? WHERE id = ?")
        .bind(JSON.stringify(body), id)
        .run();
    return c.json({ ok: true });
});

app.post("/users/:id/events", async (c) => {
    const userId = c.req.param("id");
    const body = await c.req.json<Omit<ApplyEvent, "id">>();
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
        "INSERT INTO apply_events (id, user_id, applied_at, spf, pa, note) VALUES (?, ?, ?, ?, ?, ?)",
    )
        .bind(id, userId, body.appliedAt, body.spf, body.pa, body.note ?? null)
        .run();
    return c.json({ id, ...body });
});

app.get("/users/:id/events", async (c) => {
    const userId = c.req.param("id");
    const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);
    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;
    const { results } = await c.env.DB.prepare(
        "SELECT id, applied_at as appliedAt, spf, pa, note FROM apply_events WHERE user_id = ? AND applied_at BETWEEN ? AND ? ORDER BY applied_at ASC",
    )
        .bind(userId, start, end)
        .all<ApplyEvent>();
    return c.json(results);
});

app.get("/users/:id/summary", async (c) => {
    const userId = c.req.param("id");
    const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);
    const lat = Number(c.req.query("lat") ?? 35.6762);
    const lng = Number(c.req.query("lng") ?? 139.6503);

    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;
    const { results } = await c.env.DB.prepare(
        "SELECT id, applied_at as appliedAt, spf, pa, note FROM apply_events WHERE user_id = ? AND applied_at BETWEEN ? AND ?",
    )
        .bind(userId, start, end)
        .all<ApplyEvent>();

    const { sunrise, sunset } = calcSunTimes(lat, lng, `${date}T12:00:00.000Z`);
    const protectionPercent = dailyProtectionPercent(results, sunrise, sunset);

    const streakRow = await c.env.DB.prepare(
        `SELECT COUNT(DISTINCT substr(applied_at, 1, 10)) as days
         FROM apply_events WHERE user_id = ? AND applied_at >= date('now', '-30 days')`,
    )
        .bind(userId)
        .first<{ days: number }>();

    return c.json({
        date,
        sunrise,
        sunset,
        protectionPercent,
        events: results,
        streakDays: streakRow?.days ?? 0,
    });
});

app.get("/sun", (c) => {
    const lat = Number(c.req.query("lat") ?? 35.6762);
    const lng = Number(c.req.query("lng") ?? 139.6503);
    const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);
    return c.json(calcSunTimes(lat, lng, `${date}T12:00:00.000Z`));
});

// 公開鍵を返すだけのエンドポイント（フロントが起動時に取得）
app.get("/push/public-key", (c) => c.json({ key: c.env.VAPID_PUBLIC_KEY }));

app.post("/users/:id/push", async (c) => {
    const userId = c.req.param("id");
    const body = await c.req.json<{ endpoint: string; keys: { p256dh: string; auth: string } }>();
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
        "INSERT OR REPLACE INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)",
    )
        .bind(id, userId, body.endpoint, body.keys.p256dh, body.keys.auth)
        .run();
    return c.json({ ok: true });
});

app.delete("/users/:id/push", async (c) => {
    const userId = c.req.param("id");
    const { endpoint } = await c.req.json<{ endpoint: string }>();
    await c.env.DB.prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?")
        .bind(userId, endpoint)
        .run();
    return c.json({ ok: true });
});

// テスト用: 自分にプッシュを送る
app.post("/users/:id/push/test", async (c) => {
    const userId = c.req.param("id");
    const { results } = await c.env.DB.prepare(
        "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
    )
        .bind(userId)
        .all<{ endpoint: string; p256dh: string; auth: string }>();
    const cfg = {
        publicKey: c.env.VAPID_PUBLIC_KEY,
        privateKey: c.env.VAPID_PRIVATE_KEY,
        subject: c.env.VAPID_SUBJECT,
    };
    const out: Array<{ endpoint: string; status: number }> = [];
    for (const row of results) {
        const r = await sendWebPush(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
            { title: "🌸 mochi UV テスト通知", body: "ちゃんと届くかな？" },
            cfg,
        );
        out.push({ endpoint: row.endpoint, status: r.status });
    }
    return c.json({ sent: out });
});

interface UserRow {
    id: string;
    settings_json: string;
}

interface SubRow {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
}

async function shouldFireForUser(
    settings: ReminderSettings,
    lastAppliedAtIso: string | null,
    nowIso: string,
): Promise<"due" | "pre-warn" | null> {
    const now = new Date(nowIso);
    if (settings.hibernateUntil && now < new Date(settings.hibernateUntil)) return null;
    if (settings.quietHours) {
        const h = now.getHours();
        const { startHour, endHour } = settings.quietHours;
        const inQuiet =
            startHour < endHour ? h >= startHour && h < endHour : h >= startHour || h < endHour;
        if (inQuiet) return null;
    }
    if (settings.sunCycleOnly && settings.location) {
        if (!isInSunlight(settings.location.lat, settings.location.lng, nowIso)) return null;
    }
    if (!lastAppliedAtIso) return "due";
    const interval =
        settings.intervalMode === "spf-auto"
            ? spfRecommendedInterval(50)
            : settings.intervalMinutes;
    const dueAt = new Date(lastAppliedAtIso).getTime() + interval * 60_000;
    const preAt = dueAt - settings.preWarnMinutes * 60_000;
    const t = now.getTime();
    if (t >= dueAt) return "due";
    if (t >= preAt && t < preAt + 15 * 60_000) return "pre-warn";
    return null;
}

export default {
    fetch: app.fetch,
    async scheduled(_event: ScheduledEvent, env: Bindings, ctx: ExecutionContext): Promise<void> {
        const nowIso = new Date().toISOString();
        const users = await env.DB.prepare("SELECT id, settings_json FROM users").all<UserRow>();
        const cfg = {
            publicKey: env.VAPID_PUBLIC_KEY,
            privateKey: env.VAPID_PRIVATE_KEY,
            subject: env.VAPID_SUBJECT,
        };

        for (const u of users.results) {
            const settings = JSON.parse(u.settings_json) as ReminderSettings;
            const last = await env.DB.prepare(
                "SELECT applied_at FROM apply_events WHERE user_id = ? ORDER BY applied_at DESC LIMIT 1",
            )
                .bind(u.id)
                .first<{ applied_at: string }>();
            const kind = await shouldFireForUser(settings, last?.applied_at ?? null, nowIso);
            if (!kind) continue;

            const subs = await env.DB.prepare(
                "SELECT id, user_id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
            )
                .bind(u.id)
                .all<SubRow>();
            for (const s of subs.results) {
                const title = kind === "due" ? "そろそろ塗り直しの時間 🌸" : "あと少しで塗り直しタイム ☀️";
                const body =
                    kind === "due"
                        ? "もちもち肌をキープしよ。タップで記録できるよ。"
                        : "1時間後に塗り直し予定。準備しとこ。";
                ctx.waitUntil(
                    sendWebPush(
                        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                        { title, body, tag: `mochi-uv-${kind}` },
                        cfg,
                    ).then((r) => {
                        // 410 Gone / 404 → サブスク失効、削除
                        if (r.status === 410 || r.status === 404) {
                            return env.DB.prepare("DELETE FROM push_subscriptions WHERE id = ?")
                                .bind(s.id)
                                .run();
                        }
                    }).catch(() => {}),
                );
            }
        }
    },
};
