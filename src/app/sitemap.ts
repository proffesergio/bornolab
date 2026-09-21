import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

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
    "/software",
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
