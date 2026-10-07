/** Server-only: admin notification feed (new-user registrations, etc). File-backed via store. */
import { readJson, writeJson } from "./store";

export interface AdminNotification {
  id: string;
  type: "user.registered" | "order.placed" | "system";
  title: string;
  detail?: string;
  userId?: string;
  email?: string;
  provider?: string;
  at: number;
  read: boolean;
}

const FILE = "notifications.json";
const MAX = 200;

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`;
}

export async function listNotifications(opts?: { unreadOnly?: boolean; limit?: number }): Promise<AdminNotification[]> {
  const all = await readJson<AdminNotification[]>(FILE, []);
  const filtered = opts?.unreadOnly ? all.filter((n) => !n.read) : all;
  const sorted = [...filtered].sort((a, b) => b.at - a.at);
  return opts?.limit ? sorted.slice(0, opts.limit) : sorted;
}

export async function unreadCount(): Promise<number> {
  const all = await readJson<AdminNotification[]>(FILE, []);
  return all.filter((n) => !n.read).length;
}

export async function pushNotification(input: Omit<AdminNotification, "id" | "at" | "read"> & { at?: number }): Promise<AdminNotification> {
  const all = await readJson<AdminNotification[]>(FILE, []);
  // Dedupe: one unread user.registered per userId.
  if (input.type === "user.registered" && input.userId) {
    const dup = all.find((n) => n.type === "user.registered" && n.userId === input.userId && !n.read);
    if (dup) return dup;
  }
  const rec: AdminNotification = {
    id: newId("ntf"),
    at: input.at ?? Date.now(),
    read: false,
    ...input,
  };
  all.push(rec);
  await writeJson(FILE, all.slice(-MAX));
  return rec;
}

export async function markNotificationsRead(ids: string[]): Promise<AdminNotification[]> {
  const all = await readJson<AdminNotification[]>(FILE, []);
  const set = new Set(ids);
  for (const n of all) {
    if (set.has(n.id)) n.read = true;
  }
  await writeJson(FILE, all.slice(-MAX));
  return [...all].sort((a, b) => b.at - a.at);
}

export async function markAllNotificationsRead(): Promise<void> {
  const all = await readJson<AdminNotification[]>(FILE, []);
  for (const n of all) n.read = true;
  await writeJson(FILE, all.slice(-MAX));
}
