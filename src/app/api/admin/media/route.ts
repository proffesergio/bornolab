import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSiteConfig } from "@/lib/site-config";
import { BUILT_IN_STUDY_MATERIALS } from "@/lib/study-data";
import { requireAdmin } from "../me/route";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export interface MediaFile {
  url: string;
  kind: string; // fonts | software | study | other
  bytes: number;
  mtime: number;
  referenced: boolean;
}

async function walk(dir: string, base: string, out: { file: string; bytes: number; mtime: number }[]): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full, base, out);
    } else if (e.isFile()) {
      try {
        const st = await fs.stat(full);
        out.push({ file: full.slice(base.length).replace(/\\/g, "/"), bytes: st.size, mtime: st.mtimeMs });
      } catch { /* vanished mid-scan */ }
    }
  }
}

/**
 * GET /api/admin/media — every file under public/uploads with size,
 * upload kind, and whether any catalog item still references it.
 * NOTE: on serverless hosts this reflects the current instance only.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const cfg = await getSiteConfig();
  const referenced = new Set<string>();
  for (const f of cfg.customFonts ?? []) if (f.fileUrl.startsWith("/uploads/")) referenced.add(f.fileUrl);
  for (const s of cfg.customSoftware ?? []) if (s.fileUrl.startsWith("/uploads/")) referenced.add(s.fileUrl);
  for (const m of cfg.customStudy ?? []) if (m.fileUrl.startsWith("/uploads/")) referenced.add(m.fileUrl.split("?")[0]);
  // Built-in reference guides ship with the repo — never flag them as orphans.
  for (const m of BUILT_IN_STUDY_MATERIALS) if (m.fileUrl.startsWith("/uploads/")) referenced.add(m.fileUrl);

  const base = path.join(process.cwd(), "public");
  const found: { file: string; bytes: number; mtime: number }[] = [];
  await walk(path.join(base, "uploads"), base, found);

  const files: MediaFile[] = found
    .map((f) => {
      const parts = f.file.split("/");
      const kind = parts[1] === "uploads" && ["fonts", "software", "study", "qr"].includes(parts[2] ?? "")
        ? (parts[2] as string)
        : "other";
      return { url: f.file, kind, bytes: f.bytes, mtime: f.mtime, referenced: referenced.has(decodeURIComponent(f.file)) || referenced.has(f.file) };
    })
    .sort((a, b) => b.bytes - a.bytes);

  return NextResponse.json({
    files,
    count: files.length,
    totalBytes: files.reduce((n, f) => n + f.bytes, 0),
    orphanBytes: files.filter((f) => !f.referenced).reduce((n, f) => n + f.bytes, 0),
  });
}
