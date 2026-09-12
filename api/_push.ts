import webpush from "web-push";
import { db } from "./_db.js";

let configured = false;
function setup() {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:house@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

// Send a notification to every subscribed device, optionally skipping some residents
// (e.g. the person who just reported the issue). Dead subscriptions are removed.
export async function notify(payload: PushPayload, opts: { exclude?: string[]; only?: string[] } = {}) {
  if (!setup()) return;
  const sql = db();
  let rows = await sql`SELECT id, resident, endpoint, p256dh, auth FROM push_subscriptions`;
  if (opts.only) rows = rows.filter((r) => opts.only!.includes(r.resident));
  if (opts.exclude) rows = rows.filter((r) => !opts.exclude!.includes(r.resident));
  const body = JSON.stringify(payload);
  await Promise.all(rows.map(async (r) => {
    try {
      await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, body, { TTL: 60 * 60 * 24 });
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await sql`DELETE FROM push_subscriptions WHERE id = ${r.id}`;
    }
  }));
}
