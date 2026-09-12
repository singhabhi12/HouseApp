import { neon } from "@neondatabase/serverless";

export const SECTIONS = ["Kitchen", "Upper WC", "Lower WC", "Hall/Dining", "Common", "Other"];
export const RESIDENTS = ["Abhishek", "Vishwa", "Anas", "Arunima", "Eesha"];

// Max photo size after client-side resize (~1200px JPEG is well under this).
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(body));
}
