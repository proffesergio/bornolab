/** n8n bridge — client calls Next.js proxy, proxy calls n8n webhook with secret. */

export const N8N_JOBS = {
  formatDocx: "/api/n8n/format",
  translate: "/api/n8n/translate",
  splitPdf: "/api/n8n/split",
} as const;

export async function callN8nProxy(path: string, payload: Record<string, unknown>) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, client: "bornolab-web", at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`n8n proxy ${res.status}: ${await res.text()}`);
  return res.json();
}

export function n8nEnvStatus() {
  return {
    format: Boolean(process.env.NEXT_PUBLIC_N8N_FORMAT_URL),
    translate: Boolean(process.env.NEXT_PUBLIC_N8N_TRANSLATE_URL),
    split: Boolean(process.env.NEXT_PUBLIC_N8N_SPLIT_URL),
  };
}
