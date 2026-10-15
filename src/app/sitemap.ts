import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { GUIDES } from "@/lib/guides";
import {readPrinting} from "@/lib/printing/repository";
export const dynamic="force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  const printing=await readPrinting().catch(()=>null);
  const routes = [
    "/",
    "/bijoy-unicode-converter",
    "/fonts",
    "/styler",
    "/pdf-tools",
    "/merge",
    "/translate",
    "/split",
    "/compress",
    "/images-to-pdf",
    "/html-to-pdf",
    "/protect-pdf",
    "/unlock-pdf",
    "/summarize",
    "/ai-translate",
    "/edit-pdf",
    "/format",
    "/software",
    "/study",
    "/printing",
    "/printing/help",
    ...(printing?.config.enabled?printing.services.filter(s=>s.published&&printing.categories.some(c=>c.id===s.categoryId&&!c.hidden&&!c.archived)).map(s=>`/printing/${s.id}`):[]),
    "/cart",
    "/guides",
    ...GUIDES.map((g) => `/guides/${g.slug}`),
    "/login",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];
  return routes.map((r) => ({
    url: `${base}${r === "/" ? "" : r}`,
    lastModified: now,
    changeFrequency: r === "/" ? "daily" : "weekly",
    priority: r === "/" ? 1 : r === "/bijoy-unicode-converter" ? 0.9 : 0.7,
  }));
}
