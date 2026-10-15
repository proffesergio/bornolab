import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/admin/", "/api/printing/", "/printing/orders", "/printing/quote", "/print-orders"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
