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

/** Page-view beacon for the admin traffic dashboard.
 * Analytics scripts (GA4 / GTM) are injected server-side in layout.tsx from
 * Admin → SEO settings — never here, so the library never double-loads. */
export function Tracker() {
  const path = usePathname();

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, [path]);

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
