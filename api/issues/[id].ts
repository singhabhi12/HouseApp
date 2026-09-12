import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, json } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return json(res, 400, { error: "Invalid id" });
  const sql = db();

  if (req.method === "PATCH") {
    const status = req.body?.status;
    if (status !== "open" && status !== "resolved") return json(res, 400, { error: "status must be open or resolved" });
    const [row] = await sql`
      UPDATE issues
      SET status = ${status}, resolved_at = ${status === "resolved" ? new Date().toISOString() : null}
      WHERE id = ${id}
      RETURNING id, section, description, reported_by, status, created_at, resolved_at, (photo IS NOT NULL) AS has_photo
    `;
    if (!row) return json(res, 404, { error: "Not found" });
    return json(res, 200, row);
  }

  if (req.method === "DELETE") {
    const rows = await sql`DELETE FROM issues WHERE id = ${id} RETURNING id`;
    if (!rows.length) return json(res, 404, { error: "Not found" });
    return json(res, 200, { ok: true });
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return json(res, 405, { error: "Method not allowed" });
}
