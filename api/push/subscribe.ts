import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, json, RESIDENTS } from "../_db.js";

// POST   { resident, subscription }  → save this device's push subscription
// DELETE { endpoint }                → remove it
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = db();

  if (req.method === "POST") {
    const { resident, subscription } = req.body ?? {};
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;
    if (!RESIDENTS.includes(resident)) return json(res, 400, { error: "Unknown resident" });
    if (!endpoint || !p256dh || !auth) return json(res, 400, { error: "Invalid subscription" });
    await sql`
      INSERT INTO push_subscriptions (resident, endpoint, p256dh, auth)
      VALUES (${resident}, ${endpoint}, ${p256dh}, ${auth})
      ON CONFLICT (endpoint) DO UPDATE SET resident = EXCLUDED.resident, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
    `;
    return json(res, 200, { ok: true });
  }

  if (req.method === "DELETE") {
    const endpoint = req.body?.endpoint;
    if (!endpoint) return json(res, 400, { error: "endpoint required" });
    await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
    return json(res, 200, { ok: true });
  }

  res.setHeader("Allow", "POST, DELETE");
  return json(res, 405, { error: "Method not allowed" });
}
