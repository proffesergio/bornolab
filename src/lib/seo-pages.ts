/** Client-safe: per-page SEO resolution. No fs — importable anywhere. */
import type { SiteConfig } from "./site-config-shared";

/** Request header the middleware sets so layout knows the current route. */
export const PATHNAME_HEADER = "x-bornolab-path";

/** Known storefront routes offered in Admin → SEO (plus free-form custom paths). */
export const SEO_ROUTE_OPTIONS = [
  "/",
  "/bijoy-unicode-converter",
  "/fonts",
  "/styler",
  "/study",
  "/translate",
  "/split",
  "/merge",
  "/compress",
  "/images-to-pdf",
  "/pdf-tools",
  "/format",
  "/software",
  "/about",
  "/contact",
  "/login",
] as const;

export interface ResolvedPageSeo {
  title: string;
  description: string;
  noindex: boolean;
}

/** Normalize a request path to an override key ("/study/abc" → "/study/abc", trailing slash trimmed). */
export function normalizeSeoPath(pathname: string): string {
  const p = (pathname || "/").split("?")[0].split("#")[0].trim() || "/";
  return p.length > 1 ? p.replace(/\/+$/, "") : "/";
}

/**
 * Resolve effective SEO for a path: exact override wins, else longest-prefix
 * override (so "/study" covers "/study/xyz"), else global defaults.
 */
export function resolvePageSeo(pathname: string, config: SiteConfig): ResolvedPageSeo {
  const fallback = {
    title: config.seo.title,
    description: config.seo.description,
    noindex: false,
  };
  const pages = config.seoPages ?? {};
  const path = normalizeSeoPath(pathname);
  const exact = pages[path];
  if (exact && (exact.title || exact.description || exact.noindex)) {
    return {
      title: exact.title?.trim() || fallback.title,
      description: exact.description?.trim() || fallback.description,
      noindex: exact.noindex === true,
    };
  }
  let best: string | null = null;
  for (const key of Object.keys(pages)) {
    const k = normalizeSeoPath(key);
    if (k !== "/" && path.startsWith(k + "/") && (!best || k.length > best.length)) best = k;
  }
  if (best) {
    const ov = pages[best];
    return {
      title: ov.title?.trim() || fallback.title,
      description: ov.description?.trim() || fallback.description,
      noindex: ov.noindex === true,
    };
  }
  return fallback;
}
