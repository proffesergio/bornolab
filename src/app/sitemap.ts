import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { GUIDES } from "@/lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
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
