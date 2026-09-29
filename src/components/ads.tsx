"use client";
import { useEffect, useRef, useState } from "react";
import { useSiteConfig } from "./site-widgets";
import type { AdUnit } from "@/lib/members-shared";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const CONSENT_KEY = "bornolab-consent-v1";

/** Push one AdSense unit. Retries briefly while the loader script arrives. */
function pushUnit(el: HTMLElement | null, tries = 0) {
  if (!el) return;
  if (typeof window === "undefined") return;
  try {
    if (window.adsbygoogle) {
      window.adsbygoogle.push({});
      return;
    }
  } catch {
    return; // ad-blocked or policy-blocked — stay silent, keep layout
  }
  if (tries < 10) setTimeout(() => pushUnit(el, tries + 1), 500);
}

function Unit({ client, unit }: { client: string; unit: AdUnit }) {
  const insRef = useRef<HTMLModElement | null>(null);
  useEffect(() => {
    pushUnit(insRef.current);
  }, [unit.id]);
  return (
    <div aria-label={`Advertisement (${unit.name})`}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-slate-500">Advertisement</p>
      <div className="glass min-h-[100px] overflow-hidden rounded-2xl p-2 text-center">
        {/* Reserved space avoids CLS when the creative loads. */}
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={unit.adSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}

/**
 * Renders admin-managed AdSense units for a placement (header / inFeed / footer).
 * Renders nothing until: AdSense client is configured AND at least one enabled
 * unit with a numeric ad-slot id exists for this placement.
 */
export function AdUnits({ slot, className }: { slot: AdUnit["slot"]; className?: string }) {
  const { config } = useSiteConfig();
  const client = (config.seo.adsenseClient ?? "").trim();
  const units = (config.ads.units ?? []).filter(
    (u) => u.enabled && u.slot === slot && /^\d+$/.test(u.adSlotId.trim())
  );
  if (!client || units.length === 0) return null;
  return (
    <div className={className}>
      {units.map((u) => (
        <Unit key={u.id} client={client} unit={u} />
      ))}
    </div>
  );
}

/**
 * Lightweight cookie-consent bar (localStorage; no tracking dependency).
 * NOTE: for EEA/UK traffic Google requires a certified CMP (e.g. Funding
 * Choices) before personalized ads — upgrade this banner then.
 */
export function ConsentBanner() {
  // Start hidden (matches the server render) and reveal after mount only —
  // reading localStorage during render would hydrate differently on client.
  const [visible, setVisible] = useState(false);
  // External store sync (localStorage consent flag) — setState-in-effect is intended here
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  if (!visible) return null;
  const choose = (v: "accepted" | "declined") => {
    try {
      localStorage.setItem(CONSENT_KEY, v);
    } catch { /* private mode — banner simply returns next visit */ }
    setVisible(false);
  };
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4"
    >
      <div className="glass mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-2xl p-4 shadow-2xl">
        <p className="min-w-[220px] flex-1 text-[12.5px] leading-5 text-slate-600 dark:text-slate-300">
          We use cookies for login sessions, preferences and — once enabled — ads/analytics.
          See our <a href="/privacy" className="font-bold underline">Privacy Policy</a>.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => choose("declined")}
            className="glass rounded-full px-4 py-2 text-[12.5px] font-bold"
          >
            Decline
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-[12.5px] font-bold text-white"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
