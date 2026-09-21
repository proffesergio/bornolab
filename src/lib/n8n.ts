/** n8n bridge — client calls Next.js proxy, proxy calls n8n webhook with secret. */

export const N8N_JOBS = {
  formatDocx: "/api/n8n/format",
  translate: "/api/n8n/translate",
  splitPdf: "/api/n8n/split",
} as const;

export type N8nJob = keyof typeof N8N_JOBS;

export async function callN8nProxy(path: string, payload: Record<string, unknown>) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, client: "bornolab-web", at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`n8n proxy ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Liveness per job — asks our own proxy (server env is invisible to the
 * browser, so NEXT_PUBLIC_* checks could never work; this replaces them).
 */
export async function n8nJobStatus(job: N8nJob): Promise<boolean> {
  try {
    const res = await fetch(N8N_JOBS[job], { method: "GET" });
    if (!res.ok) return false;
    return Boolean((await res.json()).configured);
  } catch {
    return false;
  }
}
