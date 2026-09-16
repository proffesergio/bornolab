"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_CONFIG, type SiteConfig } from "@/lib/site-config-shared";

/** Public site config (admin-editable). Falls back to defaults offline. */
export function useSiteConfig(): { config: SiteConfig; loading: boolean } {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => (r.ok ? r.json() : DEFAULT_CONFIG))
      .then((c) => setConfig({ ...DEFAULT_CONFIG, ...c }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { config, loading };
}

/** Page-view beacon + GA4 injection (when admin sets a measurement ID). */
export function Tracker() {
  const path = usePathname();
  const { config } = useSiteConfig();

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, [path]);

  useEffect(() => {
    const gaId = config.seo.gaId.trim();
    if (!gaId || document.getElementById("bornolab-ga")) return;
    const s1 = document.createElement("script");
    s1.id = "bornolab-ga";
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(s1);
    const s2 = document.createElement("script");
    s2.id = "bornolab-ga-init";
    s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}')`;
    document.head.appendChild(s2);
  }, [config.seo.gaId]);

  return null;
}

/** Renders an admin-managed ad slot (header / inFeed / footer). */
export function AdSlot({ slot, className }: { slot: "header" | "inFeed" | "footer"; className?: string }) {
  const { config } = useSiteConfig();
  const ad = config.ads[slot];
  if (!ad?.enabled || !ad.code.trim()) return null;
  return (
    <div className={className} aria-label={`Advertisement (${ad.network})`}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-slate-500">Advertisement • {ad.network}</p>
      <div className="glass overflow-hidden rounded-2xl p-2 text-center" dangerouslySetInnerHTML={{ __html: ad.code }} />
    </div>
  );
}

/** Announcement bar managed from Admin → Settings. */
export function AnnouncementBar() {
  const { config } = useSiteConfig();
  if (!config.announcement.enabled || !config.announcement.text.trim()) return null;
  return (
    <div className="bg-gradient-to-r from-cyan-600 to-purple-600 px-4 py-2 text-center text-[12.5px] font-semibold text-white">
      {config.announcement.text}
    </div>
  );
}
