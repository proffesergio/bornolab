/** Client-safe: types + defaults only. No fs — importable from Client Components. */

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
