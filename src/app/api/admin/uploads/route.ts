import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireAdmin } from "../me/route";

export const runtime = "nodejs";

/**
 * Admin file uploads for catalog items (fonts + software).
 * Files land in public/uploads/<kind>/ and are served as static downloads.
 * NOTE: local/self-hosted Node persists them; on Vercel (serverless) the
 * filesystem is ephemeral — use direct download links there instead.
 */
type Kind = "font" | "software";

const RULES: Record<Kind, { dir: string; exts: string[]; maxBytes: number }> = {
  font: { dir: "fonts", exts: ["ttf", "otf", "woff", "woff2", "zip"], maxBytes: 30 * 1024 * 1024 },
  software: { dir: "software", exts: ["zip", "exe", "msi", "dmg", "pkg", "apk"], maxBytes: 300 * 1024 * 1024 },
};

function safeName(raw: string, ext: string): string {
  const base =
    raw
      .replace(/\.[^.]*$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  const rand = Math.floor(Math.random() * 0xffffff).toString(36);
  return `${Date.now().toString(36)}-${rand}-${base}.${ext}`;
}

/** POST multipart { kind: "font"|"software", file } → { url, bytes } */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart form data" }, { status: 400 });
  }
  const kind = String(form.get("kind") ?? "") as Kind;
  const rule = RULES[kind];
  if (!rule) {
    return NextResponse.json({ error: 'kind must be "font" or "software"' }, { status: 400 });
  }
  const entry = form.get("file");
  const isFile =
    !!entry && typeof entry === "object" && typeof (entry as File).arrayBuffer === "function";
  if (!isFile) {
    return NextResponse.json({ error: "missing file field" }, { status: 400 });
  }
  const file = entry as File;
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!rule.exts.includes(ext)) {
    return NextResponse.json(
      { error: `".${ext || "?"}" not allowed for ${kind} — use: ${rule.exts.join(", ")}` },
      { status: 400 }
    );
  }
  if (!file.size) {
    return NextResponse.json({ error: "empty file" }, { status: 400 });
  }
  if (file.size > rule.maxBytes) {
    return NextResponse.json(
      { error: `file too large (max ${Math.round(rule.maxBytes / 1048576)} MB for ${kind})` },
      { status: 413 }
    );
  }
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", rule.dir);
    await fs.mkdir(dir, { recursive: true });
    const name = safeName(file.name, ext);
    await fs.writeFile(path.join(dir, name), buf);
    return NextResponse.json({ url: `/uploads/${rule.dir}/${name}`, bytes: file.size });
  } catch (e) {
    return NextResponse.json({ error: `could not save upload (${(e as Error).message})` }, { status: 500 });
  }
}

/** DELETE { url: "/uploads/…" } — best-effort cleanup when a custom item is removed. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json().catch(() => ({}))) as { url?: unknown };
  if (typeof body.url !== "string" || !body.url.startsWith("/uploads/") || body.url.includes("..")) {
    return NextResponse.json({ error: "only /uploads/… paths can be deleted" }, { status: 400 });
  }
  try {
    await fs.unlink(path.join(process.cwd(), "public", body.url));
  } catch {
    /* already gone — treat as success */
  }
  return NextResponse.json({ ok: true });
}
