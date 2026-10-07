/**
 * Server-only: study-material file loading + access decisions.
 * Never import from Client Components.
 */
import { promises as fs } from "fs";
import path from "path";
import { readJson } from "./store";
import { DEFAULT_PREVIEW_PAGES, type StudyMaterial } from "./study-data";
import type { Order } from "@/app/api/orders/route";

export const STUDY_MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED_RE = /^\/uploads\/study\/[A-Za-z0-9_.\-/%() ]+\.(pdf|html|zip)$/i;

export function isLocalStudyFile(url: string): boolean {
  return ALLOWED_RE.test(url) && !url.includes("..");
}

/** Load a study file from disk, falling back to origin fetch on serverless. */
export async function loadStudyFile(
  material: StudyMaterial,
  origin: string
): Promise<{ data: ArrayBuffer; ext: string } | null> {
  const url = material.fileUrl;
  if (!isLocalStudyFile(url)) return null;
  try {
    const filePath = path.join(process.cwd(), "public", decodeURIComponent(url));
    const stat = await fs.stat(filePath);
    if (stat.isFile() && stat.size > 0 && stat.size <= STUDY_MAX_BYTES) {
      return { data: (await fs.readFile(filePath)).buffer as ArrayBuffer, ext: extOf(url) };
    }
  } catch { /* serverless FS — fall through */ }
  try {
    const upstream = await fetch(new URL(url, origin));
    if (!upstream.ok) return null;
    const buf = await upstream.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > STUDY_MAX_BYTES) return null;
    return { data: buf, ext: extOf(url) };
  } catch {
    return null;
  }
}

function extOf(url: string): string {
  return (url.split(".").pop() ?? "pdf").toLowerCase();
}

function orderCovers(order: Order, materialId: string): boolean {
  if (order.itemId === materialId) return true;
  return (order.items ?? []).some((l) => l.itemId === materialId);
}

export type StudyGate = "ok" | "login" | "pay";

export interface StudyAccess {
  /** May read the full document in the reader. */
  read: boolean;
  /** May download the file. */
  download: boolean;
  gate: StudyGate;
  priceBDT: number;
  paid: boolean;
  previewPages: number;
}

/**
 * Free material: login unlocks reading + download. Paid material: login +
 * a paid/delivered order linked to the buyer unlocks both. Anonymous users
 * only ever get the preview.
 */
export async function studyAccess(
  userId: string | null,
  material: StudyMaterial
): Promise<StudyAccess> {
  const paid = material.access === "paid";
  const priceBDT = paid ? Number(material.priceBDT ?? 0) || 0 : 0;
  const previewPages = Math.max(1, Math.min(20, Number(material.previewPages ?? DEFAULT_PREVIEW_PAGES) || DEFAULT_PREVIEW_PAGES));
  if (!userId) return { read: false, download: false, gate: "login", priceBDT, paid, previewPages };
  if (!paid) return { read: true, download: true, gate: "ok", priceBDT, paid, previewPages };
  const orders = await readJson<Order[]>("orders.json", []);
  const entitled = orders.some(
    (o) =>
      o.buyerId === userId &&
      (o.status === "paid" || o.status === "delivered") &&
      orderCovers(o, material.id)
  );
  if (!entitled) return { read: false, download: false, gate: "pay", priceBDT, paid, previewPages };
  return { read: true, download: true, gate: "ok", priceBDT, paid, previewPages };
}
