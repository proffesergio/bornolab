// bKash personal + QR + bKash-only checkout.
// Run: node --test tests/task17-bkash.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("site config carries the personal bKash number + QR url", () => {
  const src = read("src/lib/site-config-shared.ts");
  assert.ok(src.includes("bkashPersonal"), "payments must include bkashPersonal.");
  assert.ok(src.includes("bkashQrUrl"), "payments must include bkashQrUrl.");
  assert.ok(src.includes("+8801842168117"), "personal number must be the default.");
});

test("QR viewer prefers the official image, falls back to generated", () => {
  assert.ok(existsSync(join(root, "src/components/bkash-qr.tsx")), "bkash-qr must exist.");
  const src = read("src/components/bkash-qr.tsx");
  assert.ok(src.includes("qrUrl"), "viewer must accept an official QR image.");
  assert.ok(src.includes("qrcode") || src.includes("QRCode"), "viewer must generate a fallback QR.");
});

test("uploads accept QR images", () => {
  const src = read("src/app/api/admin/uploads/route.ts");
  assert.ok(src.includes('"media"'), "uploads must support the media kind.");
  assert.ok(src.includes("png"), "media must allow image extensions.");
});

test("checkout shows the personal number + QR for bKash", () => {
  const src = read("src/components/checkout-modal.tsx");
  assert.ok(src.includes("bkashPersonal"), "checkout must prefer the personal number.");
  assert.ok(src.includes("BkashQrButton"), "checkout must offer the QR button.");
  assert.ok(src.includes("Send Money"), "bKash copy must say Send Money, not merchant.");
});

test("checkout is bKash-only unless admin enables more", () => {
  const modal = read("src/components/checkout-modal.tsx");
  assert.ok(modal.includes("visibleMethods"), "checkout must filter methods by admin processors.");
  const cfg = read("src/lib/site-config-shared.ts");
  const defaults = cfg.split("export const DEFAULT_CONFIG")[1];
  const proc = defaults.split("processors:")[1].split("card:")[0];
  assert.ok(proc.includes("bkash: { enabled: true"), "bKash must be on by default.");
  assert.ok(!proc.includes("nagad: { enabled: true"), "Nagad must be off by default.");
});

test("admin manages the personal number, QR and order verification", () => {
  const admin = read("src/app/admin/page.tsx");
  assert.ok(admin.includes("pay-bkash-personal"), "payments must edit the personal number.");
  assert.ok(admin.includes("Official QR image"), "payments must upload the official QR.");
  assert.ok(admin.includes("Verify against personal"), "orders must verify against the personal number.");
});
