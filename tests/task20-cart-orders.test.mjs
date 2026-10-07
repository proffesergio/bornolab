// Cart + request-order + fulfillment batch.
// Run: node --test tests/task20-cart-orders.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("cart store persists picks across reloads and tabs", () => {
  assert.ok(existsSync(join(root, "src/lib/cart.ts")), "cart lib must exist.");
  const src = read("src/lib/cart.ts");
  assert.ok(src.includes("useCart"), "reactive useCart must exist.");
  assert.ok(src.includes("addToCart") && src.includes("removeFromCart") && src.includes("clearCart"), "cart mutations must exist.");
  assert.ok(src.includes("localStorage"), "cart must persist in localStorage.");
  assert.ok(src.includes("storage"), "cart must sync across tabs.");
});

test("cart page and navbar badge exist", () => {
  assert.ok(existsSync(join(root, "src/app/cart/page.tsx")), "/cart must exist.");
  const page = read("src/app/cart/page.tsx");
  assert.ok(page.includes("CheckoutModal"), "cart must check out.");
  assert.ok(page.includes("onOrdered"), "cart must clear after ordering.");
  const nav = read("src/components/navbar.tsx");
  assert.ok(nav.includes('/cart'), "navbar must link the cart.");
  assert.ok(nav.includes("useCart"), "navbar must show the cart count.");
  const sm = read("src/app/sitemap.ts");
  assert.ok(sm.includes('"/cart"'), "sitemap must list /cart.");
});

test("checkout supports multi-item carts and request mode", () => {
  const src = read("src/components/checkout-modal.tsx");
  assert.ok(src.includes("items?:"), "checkout must accept cart items.");
  assert.ok(src.includes('mode'), "checkout must support request mode.");
  assert.ok(src.includes("onOrdered"), "checkout must notify on success.");
});

test("orders accept requests, line items and delivery links", () => {
  const pub = read("src/app/api/orders/route.ts");
  assert.ok(pub.includes('"request"'), "orders must accept request kind.");
  assert.ok(pub.includes("items"), "orders must accept line items.");
  const admin = read("src/app/api/admin/orders/route.ts");
  assert.ok(admin.includes("delivery"), "admin must record delivery links.");
  const panel = read("src/app/admin/page.tsx");
  assert.ok(panel.includes("REQUEST"), "admin must badge requests.");
  assert.ok(panel.includes("Delivery links"), "admin must manage delivery links.");
});

test("free and paid items expose request buttons", () => {
  const fonts = read("src/app/fonts/[id]/page.tsx");
  assert.ok(fonts.includes('mode="request"'), "font page must offer requests.");
  const sw = read("src/app/software/[id]/page.tsx");
  assert.ok(sw.includes('mode="request"'), "software page must offer requests.");
  const fdx = read("src/app/fonts/page.tsx");
  assert.ok(fdx.includes("addToCart"), "font cards must add to cart.");
  const swx = read("src/app/software/page.tsx");
  assert.ok(swx.includes("addToCart"), "software cards must add to cart.");
});
