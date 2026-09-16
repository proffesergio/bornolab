import { readJson, writeJson } from "./store";

export type ToolKey = "convert" | "fonts" | "styler" | "translate" | "split" | "software";

export interface AdSlotConfig {
  enabled: boolean;
  network: string; // e.g. AdSense, Media.net, custom
  code: string; // raw HTML/JS snippet
}

export interface SiteConfig {
  brand: { name: string; tagline: string };
  announcement: { enabled: boolean; text: string };
  tools: Record<ToolKey, boolean>;
  fontOverrides: Record<string, { premium?: boolean; priceBDT?: number; enabled?: boolean }>;
  softwareOverrides: Record<string, { priceBDT?: number; enabled?: boolean }>;
  ads: Record<"header" | "inFeed" | "footer", AdSlotConfig>;
  seo: { title: string; description: string; keywords: string; gaId: string; adsenseClient: string };
  payments: { bkash: string; nagad: string; bank: string; binance: string };
}

export const DEFAULT_CONFIG: SiteConfig = {
  brand: { name: "BornoLab", tagline: "বাংলা Font & Document Suite" },
  announcement: { enabled: false, text: "নতুন: প্রিমিয়াম ফন্ট এখন বিকাশ/নগদে কিনুন!" },
  tools: { convert: true, fonts: true, styler: true, translate: true, split: true, software: true },
  fontOverrides: {},
  softwareOverrides: {},
  ads: {
    header: { enabled: false, network: "AdSense", code: "" },
    inFeed: { enabled: false, network: "AdSense", code: "" },
    footer: { enabled: false, network: "AdSense", code: "" },
  },
  seo: {
    title: "BornoLab — বাংলা Font & Document Suite",
    description: "Unicode⇆Bijoy converter, Bangla font directory, text styler, PDF⇆DOCX translator, PDF splitter. n8n-ready.",
    keywords: "bijoy converter, unicode to bijoy, bangla fonts, sutonnymj, pdf to docx, bangla styler",
    gaId: "",
    adsenseClient: "",
  },
  payments: {
    bkash: "01XXXXXXXXX",
    nagad: "01XXXXXXXXX",
    bank: "Bank Name • A/C 000-000-000 • Branch",
    binance: "Binance Pay ID / UID",
  },
};

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
  const overrides = await readJson<DeepPartial<SiteConfig>>("site-config.json", {});
  return deepMerge(DEFAULT_CONFIG, overrides);
}

export async function updateSiteConfig(patch: DeepPartial<SiteConfig>): Promise<SiteConfig> {
  const current = await readJson<DeepPartial<SiteConfig>>("site-config.json", {});
  const next = deepMerge(current, patch);
  await writeJson("site-config.json", next);
  return deepMerge(DEFAULT_CONFIG, next);
}
