"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/** Cohort band card for results pages (opt-in only; aggregate bands, never peer data). */
export function PercentileCard({ version }: { version: string }) {
  const [state, setState] = useState<{ status: "loading" | "off" | "locked" | "ready" | "hidden"; bandBn?: string; bandEn?: string; n?: number; userPct?: number; reason?: string }>({ status: "loading" });

  useEffect(() => {
    fetch(`/api/study-platform/percentile?version=${encodeURIComponent(version)}`).then(async (r) => {
      if (r.status === 401) { setState({ status: "hidden" }); return; }
      const j = await r.json();
      if (!j.optedIn) setState({ status: "off" });
      else if (!j.available) setState({ status: "locked", n: j.n, reason: j.reason });
      else setState({ status: "ready", bandBn: j.copy.bn, bandEn: j.copy.en, n: j.n, userPct: j.userPct });
    }).catch(() => setState({ status: "hidden" }));
  }, [version]);

  if (state.status === "loading" || state.status === "hidden") return null;
  if (state.status === "off") {
    return (
      <div className="glass rounded-2xl p-4 text-[13px]">
        <p className="font-extrabold">👥 Cohort তুলনা (ঐচ্ছিক)</p>
        <p className="mt-1 text-slate-500">Opt-in করলে, ৩০+ জনের cohort-এ আপনার ব্যান্ড দেখাবে — কারো ব্যক্তিগত স্কোর কখনো দেখানো হয় না।</p>
        <Link href="/study/progress" className="mt-2 inline-block rounded-full bg-slate-900 px-4 py-1.5 text-[12.5px] font-bold text-white dark:bg-white dark:text-slate-900">Opt-in →</Link>
      </div>
    );
  }
  if (state.status === "locked") {
    return (
      <div className="glass rounded-2xl p-4 text-[13px]">
        <p className="font-extrabold">👥 Cohort ব্যান্ড</p>
        <p className="mt-1 text-slate-500">{state.reason}</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-4 text-[13px]">
      <p className="font-extrabold">👥 আপনার ব্যান্ড: {state.bandBn} <span className="font-semibold text-slate-500">({state.bandEn})</span></p>
      <p className="mt-1 text-slate-500">{state.n} জনের opted-in cohort • আপনার স্কোর {state.userPct}% • নির্দেশনা মাত্র, ভবিষ্যদ্বাণী নয়।</p>
    </div>
  );
}
