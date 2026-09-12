import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, json } from "../_db";

// GET /api/issues/photo?id=123 → the raw image bytes for that issue.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return json(res, 400, { error: "Invalid id" });
  const sql = db();
  const [row] = await sql`SELECT photo, photo_type FROM issues WHERE id = ${id}`;
  if (!row || !row.photo) return json(res, 404, { error: "No photo" });
  res.status(200)
    .setHeader("Content-Type", row.photo_type || "image/jpeg")
    .setHeader("Cache-Control", "public, max-age=31536000, immutable")
    .send(Buffer.from(row.photo));
}
