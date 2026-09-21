export type FontType = "Unicode" | "ANSI" | "Dual";
export type FontCategory = "Serif" | "Sans-Serif" | "Display" | "Stylized";
export type LicenseType = "Free" | "Paid";

export interface BanglaFont {
  id: string;
  name: string;
  designer: string;
  license: LicenseType;
  type: FontType;
  category: FontCategory;
  bangla: boolean;
  fileUrl: string; // direct stream URL (or /fonts/*.ttf local fallback)
  fallbackUrl: string;
  previewWeight?: number;
  premium?: boolean; // true → buy-to-download (admin can override per font)
  priceBDT?: number; // 0 / undefined = free
}

// Catalog: entries with /fonts/*.ttf ship in this repo (noto, baloo, hind,
// tiro, inter, playfair). Vendor-only entries (kalpurush, solaimanlipi,
// nikosh, boishakhi, lekhni) fall back to the foundry page until the licensed
// file is dropped into /public/fonts/. Premium entries route to checkout.
export const FONTS: BanglaFont[] = [
  { id: "kalpurush", name: "Kalpurush", designer: "Bengali OpenType", license: "Free", type: "Unicode", category: "Sans-Serif", bangla: true, fileUrl: "/fonts/Kalpurush.ttf", fallbackUrl: "https://www.omicronlab.com/bangla-fonts.html" },
  { id: "solaimanlipi", name: "SolaimanLipi", designer: "Solaiman Karim", license: "Free", type: "Unicode", category: "Serif", bangla: true, fileUrl: "/fonts/SolaimanLipi.ttf", fallbackUrl: "https://www.omicronlab.com/bangla-fonts.html" },
  { id: "nikosh", name: "Nikosh", designer: "Bangladesh Govt", license: "Free", type: "Unicode", category: "Sans-Serif", bangla: true, fileUrl: "/fonts/Nikosh.ttf", fallbackUrl: "https://bsbk.portal.gov.bd" },
  { id: "noto-bengali", name: "Noto Sans Bengali", designer: "Google Fonts", license: "Free", type: "Unicode", category: "Sans-Serif", bangla: true, fileUrl: "/fonts/notosansbengali/NotoSansBengali.ttf", fallbackUrl: "https://fonts.google.com/noto/specimen/Noto+Sans+Bengali" },
  { id: "baloo-da2", name: "Baloo Da 2", designer: "Ek Type", license: "Free", type: "Unicode", category: "Display", bangla: true, fileUrl: "/fonts/balooda2/BalooDa2.ttf", fallbackUrl: "https://fonts.google.com/specimen/Baloo+Da+2" },
  { id: "hind-siliguri", name: "Hind Siliguri", designer: "Google Fonts", license: "Free", type: "Unicode", category: "Sans-Serif", bangla: true, fileUrl: "/fonts/hindsiliguri/HindSiliguri-Regular.ttf", fallbackUrl: "https://fonts.google.com/specimen/Hind+Siliguri" },
  { id: "tiro-bangla", name: "Tiro Bangla", designer: "Tiro Typeworks", license: "Free", type: "Unicode", category: "Serif", bangla: true, fileUrl: "/fonts/tirobangla/TiroBangla-Regular.ttf", fallbackUrl: "https://fonts.google.com/specimen/Tiro+Bangla" },
  { id: "sutonny", name: "SutonnyMJ", designer: "Bijoy / Mustafa Jabbar", license: "Paid", type: "ANSI", category: "Serif", bangla: true, fileUrl: "/fonts/SutonnyMJ.ttf", fallbackUrl: "https://www.bijoyekushe.net", premium: true, priceBDT: 499 },
  { id: "bornopro-sans", name: "BornoPro Sans", designer: "BornoLab Studio", license: "Paid", type: "Dual", category: "Sans-Serif", bangla: true, fileUrl: "#", fallbackUrl: "#", premium: true, priceBDT: 799 },
  { id: "shurjo-lipi", name: "Shurjo Lipi", designer: "BornoLab Studio", license: "Paid", type: "Unicode", category: "Display", bangla: true, fileUrl: "#", fallbackUrl: "#", premium: true, priceBDT: 599 },
  { id: "boishakhi", name: "Boishakhi", designer: "Legacy DTP", license: "Free", type: "ANSI", category: "Serif", bangla: true, fileUrl: "/fonts/Boishakhi.ttf", fallbackUrl: "https://www.omicronlab.com" },
  { id: "lekhnilipi", name: "Lekhani Stylish", designer: "BornoLab Studio", license: "Free", type: "Dual", category: "Stylized", bangla: true, fileUrl: "/fonts/Lekhani.ttf", fallbackUrl: "https://www.omicronlab.com/bangla-fonts.html" },
  { id: "inter", name: "Inter", designer: "Rasmus Andersson", license: "Free", type: "Unicode", category: "Sans-Serif", bangla: false, fileUrl: "/fonts/inter/Inter.ttf", fallbackUrl: "https://fonts.google.com/specimen/Inter" },
  { id: "playfair", name: "Playfair Display", designer: "Claus Eggers", license: "Free", type: "Unicode", category: "Display", bangla: false, fileUrl: "/fonts/playfair/PlayfairDisplay.ttf", fallbackUrl: "https://fonts.google.com/specimen/Playfair+Display" },
];

export const DEFAULT_PREVIEW_TEXT = "আমার সোনার বাংলা, আমি তোমায় ভালোবাসি • ১২৩";

/** Merge admin catalog overrides (premium / price / visibility). */
export function applyFontOverrides(
  fonts: BanglaFont[],
  overrides: Record<string, { premium?: boolean; priceBDT?: number; enabled?: boolean }>
): (BanglaFont & { enabled: boolean })[] {
  return fonts.map((f) => {
    const ov = overrides[f.id] ?? {};
    return {
      ...f,
      premium: ov.premium ?? f.premium ?? f.license === "Paid",
      priceBDT: ov.priceBDT ?? f.priceBDT ?? 0,
      enabled: ov.enabled ?? true,
    };
  });
}

/** CSS font-family used for the live preview of each catalog entry */
export function previewFamily(id: string): string {
  switch (id) {
    case "hind-siliguri": return '"Hind Siliguri","Noto Sans Bengali",sans-serif';
    case "tiro-bangla": return '"Tiro Bangla","Noto Sans Bengali",serif';
    case "baloo-da2": return '"Baloo Da 2","Noto Sans Bengali",sans-serif';
    case "noto-bengali": return '"Noto Sans Bengali",sans-serif';
    case "kalpurush": return '"Kalpurush","Noto Sans Bengali",sans-serif';
    case "solaimanlipi": return '"SolaimanLipi","Noto Sans Bengali",serif';
    case "nikosh": return '"Nikosh","Noto Sans Bengali",sans-serif';
    case "sutonny": return '"SutonnyMJ","Boishakhi",monospace';
    case "bornopro-sans": return '"BornoPro Sans","Noto Sans Bengali",sans-serif';
    case "shurjo-lipi": return '"Shurjo Lipi","Baloo Da 2","Noto Sans Bengali",sans-serif';
    case "inter": return '"Inter",sans-serif';
    case "playfair": return '"Playfair Display",serif';
    default: return '"Noto Sans Bengali",sans-serif';
  }
}
