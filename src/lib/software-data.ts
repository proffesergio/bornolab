export type SoftwareLicense = "Free" | "Paid";

export interface Software {
  id: string;
  name: string;
  tagline: string;
  license: SoftwareLicense;
  priceBDT: number;
  platform: string;
  version: string;
  size: string;
  downloads: string;
  fileUrl: string;
  fallbackUrl: string;
}

export const SOFTWARE: Software[] = [
  { id: "bijoy-pro-converter", name: "BornoPro Bijoy Converter", tagline: "Batch Bijoy⇆Unicode for whole .docx/.xlsx with font-aware runs", license: "Paid", priceBDT: 990, platform: "Windows 10/11", version: "2.1.0", size: "48 MB", downloads: "12k+", fileUrl: "#", fallbackUrl: "#" },
  { id: "dtp-toolkit", name: "DTP Toolkit BD", tagline: "Newspaper-ready templates, Bijoy styles, preflight checks", license: "Paid", priceBDT: 1490, platform: "Windows 10/11", version: "3.0.2", size: "210 MB", downloads: "8k+", fileUrl: "#", fallbackUrl: "#" },
  { id: "pdf-master-bd", name: "PDF Master BD", tagline: "Split, merge, compress & OCR Bangla PDFs offline", license: "Paid", priceBDT: 790, platform: "Windows / macOS", version: "1.8.4", size: "96 MB", downloads: "21k+", fileUrl: "#", fallbackUrl: "#" },
  { id: "bangla-ocr", name: "Bangla OCR Lite", tagline: "Scanned page → editable Unicode text (ben+eng)", license: "Free", priceBDT: 0, platform: "Windows 10/11", version: "1.2.0", size: "64 MB", downloads: "34k+", fileUrl: "#", fallbackUrl: "#" },
  { id: "font-manager", name: "Borno Font Manager", tagline: "Install, preview & activate 500+ Bangla fonts in one click", license: "Free", priceBDT: 0, platform: "Windows 10/11", version: "1.5.1", size: "32 MB", downloads: "47k+", fileUrl: "#", fallbackUrl: "#" },
  { id: "nikosh-office-pack", name: "Nikosh Office Pack", tagline: "Govt-standard Nikosh templates for Word + Excel", license: "Free", priceBDT: 0, platform: "Word / Excel", version: "2026.1", size: "18 MB", downloads: "29k+", fileUrl: "#", fallbackUrl: "#" },
];

/** Full storefront catalog: built-in entries + admin-uploaded custom apps, with overrides. */
export function buildSoftwareCatalog(
  overrides: Record<string, { priceBDT?: number; enabled?: boolean }>,
  custom: Software[] = []
): (Software & { enabled: boolean })[] {
  return applySoftwareOverrides([...SOFTWARE, ...custom], overrides);
}

/** Merge admin store overrides (price / visibility). priceBDT 0 = Free. */
export function applySoftwareOverrides(
  items: Software[],
  overrides: Record<string, { priceBDT?: number; enabled?: boolean }>
): (Software & { enabled: boolean })[] {
  return items.map((s) => {
    const ov = overrides[s.id] ?? {};
    const price = ov.priceBDT ?? s.priceBDT;
    return { ...s, priceBDT: price, license: price > 0 ? "Paid" : "Free" as SoftwareLicense, enabled: ov.enabled ?? true };
  });
}
