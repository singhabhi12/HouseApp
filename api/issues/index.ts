import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, json, SECTIONS, RESIDENTS, MAX_PHOTO_BYTES } from "../_db.js";
import { notify } from "../_push.js";

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = db();

  if (req.method === "GET") {
    const rows = await sql`
      SELECT id, section, description, reported_by, status, created_at, resolved_at,
             (photo IS NOT NULL) AS has_photo
      FROM issues
      ORDER BY (status = 'open') DESC, created_at DESC
    `;
    return json(res, 200, rows);
  }

  if (req.method === "POST") {
    const { section, description, reportedBy, photo, photoType } = req.body ?? {};
    if (!SECTIONS.includes(section)) return json(res, 400, { error: "Invalid section" });
    if (!RESIDENTS.includes(reportedBy)) return json(res, 400, { error: "Unknown resident" });
    const text = String(description ?? "").trim();
    if (!text || text.length > 2000) return json(res, 400, { error: "Description must be 1–2000 characters" });

    let bytes: Buffer | null = null;
    let type: string | null = null;
    if (photo) {
      bytes = Buffer.from(String(photo), "base64");
      if (bytes.length > MAX_PHOTO_BYTES) return json(res, 413, { error: "Photo too large" });
      type = typeof photoType === "string" && photoType.startsWith("image/") ? photoType : "image/jpeg";
    }

    const [row] = await sql`
      INSERT INTO issues (section, description, reported_by, photo, photo_type)
      VALUES (${section}, ${text}, ${reportedBy}, ${bytes}, ${type})
      RETURNING id, section, description, reported_by, status, created_at, resolved_at, (photo IS NOT NULL) AS has_photo
    `;
    await notify(
      { title: `🔧 ${section} issue`, body: `${reportedBy}: ${text.length > 120 ? text.slice(0, 117) + "…" : text}`, url: "/?page=issues", tag: `issue-${row.id}` },
      { exclude: [reportedBy] },
    );
    return json(res, 201, row);
  }

  res.setHeader("Allow", "GET, POST");
  return json(res, 405, { error: "Method not allowed" });
}
