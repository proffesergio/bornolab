/** Server-only: reads/writes data/site-config.json. Never import from Client Components. */
import { readJson, writeJson } from "./store";
import { DEFAULT_CONFIG, type SiteConfig } from "./site-config-shared";

export type { SiteConfig, ToolKey, AdSlotConfig } from "./site-config-shared";
export { DEFAULT_CONFIG } from "./site-config-shared";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object") {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  // Precedence: code defaults < SITE_CONFIG_JSON env seed < dashboard file edits.
  // The env seed is the durable layer on serverless hosts (Vercel), where
  // filesystem writes are ephemeral — see docs/admin.md.
  const overrides = await readJson<DeepPartial<SiteConfig>>("site-config.json", {});
  return deepMerge(deepMerge(DEFAULT_CONFIG, envSeed()), overrides);
}

/** Optional durable seed via env: SITE_CONFIG_JSON='{"seo":{"gaId":"G-…"},…}'. */
function envSeed(): DeepPartial<SiteConfig> {
  try {
    const raw = process.env.SITE_CONFIG_JSON;
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DeepPartial<SiteConfig>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function updateSiteConfig(patch: DeepPartial<SiteConfig>): Promise<SiteConfig> {
  const current = await readJson<DeepPartial<SiteConfig>>("site-config.json", {});
  const next = deepMerge(current, patch);
  await writeJson("site-config.json", next);
  return deepMerge(DEFAULT_CONFIG, next);
}
