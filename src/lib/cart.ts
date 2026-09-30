"use client";
import { useSyncExternalStore } from "react";

export interface CartItem {
  /** Stable key: `${itemType}:${itemId}` (+ variant/version label when present). */
  key: string;
  itemType: "font" | "software" | "study";
  itemId: string;
  itemName: string;
  amountBDT: number;
}

const LS_KEY = "bornolab-cart-v1";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((i): i is CartItem =>
        !!i && typeof i === "object" &&
        typeof (i as CartItem).key === "string" &&
        typeof (i as CartItem).itemName === "string" &&
        Number.isFinite(Number((i as CartItem).amountBDT))
      )
      .map((i) => ({ ...i, amountBDT: Number(i.amountBDT) || 0 }));
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;

function snapshot(): CartItem[] {
  if (cache == null) cache = readCart();
  return cache;
}

function persist(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch { /* private mode */ }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === LS_KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addToCart(item: CartItem): boolean {
  const items = snapshot();
  if (items.some((i) => i.key === item.key)) return false;
  persist([...items, item]);
  return true;
}

export function removeFromCart(key: string): void {
  persist(snapshot().filter((i) => i.key !== key));
}

export function clearCart(): void {
  persist([]);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((n, i) => n + (i.amountBDT || 0), 0);
}

/** Reactive cart state (SSR-safe: empty until hydrated). */
export function useCart(): { items: CartItem[]; count: number; total: number } {
  const items = useSyncExternalStore(subscribe, snapshot, () => []);
  return { items, count: items.length, total: cartTotal(items) };
}
