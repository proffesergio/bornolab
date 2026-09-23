/** Client-safe: types + defaults only. No fs — importable from Client Components. */
import {
  DEFAULT_AUTH_CONFIG,
  type AdUnit,
  type AuthProviderConfig,
} from "./members-shared";
import type { BanglaFont } from "./fonts-data";
import type { Software } from "./software-data";

export type { AdUnit, AuthProviderConfig };

export type ToolKey = "convert" | "fonts" | "styler" | "translate" | "split" | "software";

/** Per-tool caps + ops telemetry for the PDF Tools suite (Admin CRM managed). */
export type PdfToolKey = "merge" | "split" | "translate" | "compress" | "images";

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

export type PaymentMethod = "bkash" | "nagad" | "bank" | "binance" | "card";

export interface ProcessorState {
  enabled: boolean;
}

export interface SiteConfig {
  brand: { name: string; tagline: string };
  announcement: { enabled: boolean; text: string };
  tools: Record<ToolKey, boolean>;
  pdfTools: Record<PdfToolKey, PdfToolCaps>;
  fontOverrides: Record<string, { premium?: boolean; priceBDT?: number; enabled?: boolean }>;
  softwareOverrides: Record<string, { priceBDT?: number; enabled?: boolean }>;
  /** Admin-added catalog entries (Admin → Catalog). Stored + served like overrides. */
  customFonts: BanglaFont[];
  customSoftware: Software[];
  ads: Record<"header" | "inFeed" | "footer", AdSlotConfig> & { units: AdUnit[] };
  seo: { title: string; description: string; keywords: string; gaId: string; adsenseClient: string; googleSiteVerification: string };
  payments: { bkash: string; nagad: string; bank: string; binance: string; cardKey: string } & {
    processors: Record<PaymentMethod, ProcessorState>;
  };
  auth: AuthProviderConfig;
}

export const DEFAULT_CONFIG: SiteConfig = {  brand: { name: "BornoLab", tagline: "বাংলা Font & Document Suite" },
  announcement: { enabled: false, text: "নতুন: প্রিমিয়াম ফন্ট এখন বিকাশ/নগদে কিনুন!" },
  tools: { convert: true, fonts: true, styler: true, translate: true, split: true, software: true },
  pdfTools: {
    merge: { enabled: true, maxMB: 25, maxFiles: 20 },
    split: { enabled: true, maxMB: 25, maxFiles: 1 },
    translate: { enabled: true, maxMB: 25, maxFiles: 1 },
    compress: { enabled: true, maxMB: 25, maxFiles: 5 },
    images: { enabled: true, maxMB: 15, maxFiles: 30 },
  },
  fontOverrides: {},
  softwareOverrides: {},
  customFonts: [],
  customSoftware: [],
  ads: {
    header: { enabled: false, network: "AdSense", code: "" },
    inFeed: { enabled: false, network: "AdSense", code: "" },
    footer: { enabled: false, network: "AdSense", code: "" },
    units: [],
  },
  seo: {
    title: "BornoLab — বাংলা Font & Document Suite",
    description: "Unicode⇆Bijoy converter, Bangla font directory, text styler, PDF⇆DOCX translator, PDF splitter. n8n-ready.",
    keywords: "bijoy converter, unicode to bijoy, bangla fonts, sutonnymj, pdf to docx, bangla styler",
    gaId: "",
    adsenseClient: "",
    googleSiteVerification: "",
  },
  payments: {
    bkash: "01XXXXXXXXX",
    nagad: "01XXXXXXXXX",
    bank: "Bank Name • A/C 000-000-000 • Branch",
    binance: "Binance Pay ID / UID",
    cardKey: "",
    processors: {
      bkash: { enabled: true },
      nagad: { enabled: true },
      bank: { enabled: true },
      binance: { enabled: true },
      card: { enabled: false },
    },
  },
  auth: DEFAULT_AUTH_CONFIG,
};

/** Crash-safe caps lookup — tolerates stored configs missing newer tool keys. */
export function pdfCaps(config: SiteConfig, key: PdfToolKey): PdfToolCaps {
  return { ...DEFAULT_CONFIG.pdfTools[key], ...(config.pdfTools?.[key] ?? {}) };
}
