// Applies db/schema.sql to the linked Neon database. Run: npm run db:migrate
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

let url = process.env.DATABASE_URL;
if (!url) {
  const env = readFileSync(".env.local", "utf8");
  url = env.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
}
if (!url) throw new Error("DATABASE_URL not set — run `npx neon link` first");

const sql = neon(url);
const ddl = readFileSync("db/schema.sql", "utf8").replace(/^\s*--.*$/gm, "");
for (const stmt of ddl.split(";").map((s) => s.trim()).filter(Boolean)) {
  await sql.query(stmt);
}
const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'issues' ORDER BY ordinal_position`;
console.log("issues table ready:", cols.map((c) => `${c.column_name}:${c.data_type}`).join(", "));
