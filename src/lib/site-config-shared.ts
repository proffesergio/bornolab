/** Client-safe: types + defaults only. No fs — importable from Client Components. */

export type ToolKey = "convert" | "fonts" | "styler" | "translate" | "split" | "software";

/** Per-tool caps + ops telemetry for the PDF Tools suite (Admin CRM managed). */
export type PdfToolKey = "merge" | "split" | "translate" | "compress";

export interface PdfToolCaps {
  enabled: boolean;
  maxMB: number; // max bytes per file, in megabytes
  maxFiles: number; // max files per job (1 = single-file tools)
}

export interface PdfOp {
  at: number; // epoch ms
  tool: string; // PdfToolKey (string to tolerate future tools)
  files: number;
  pages: number;
  ms: number; // client-measured processing time
  ok: boolean;
  err?: string;
}

export interface AdSlotConfig {
  enabled: boolean;
  network: string; // e.g. AdSense, Media.net, custom
  code: string; // raw HTML/JS snippet
}

export interface SiteConfig {
  brand: { name: string; tagline: string };
  announcement: { enabled: boolean; text: string };
  tools: Record<ToolKey, boolean>;
  pdfTools: Record<PdfToolKey, PdfToolCaps>;
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
  pdfTools: {
    merge: { enabled: true, maxMB: 25, maxFiles: 20 },
    split: { enabled: true, maxMB: 25, maxFiles: 1 },
    translate: { enabled: true, maxMB: 25, maxFiles: 1 },
    compress: { enabled: false, maxMB: 25, maxFiles: 5 },
  },
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
