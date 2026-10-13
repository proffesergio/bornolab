"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { GlassCard } from "@/components/ui";
import { EmptyState } from "./ui";
import { searchPlatform } from "@/lib/study-platform/search";
import type { Post } from "@/lib/study-platform/types";

/** BN/EN post search (titles + org + aliases + track). */
export function PostBrowser({ posts }: { posts: Post[] }) {
  const [q, setQ] = useState("");
  const visible = useMemo(() => {
    const needle = q.trim();
    if (!needle) return posts;
    const ids = new Set(searchPlatform(needle, 30).filter((h) => h.kind === "post").map((h) => h.id));
    return posts.filter((p) => ids.has(p.id));
  }, [posts, q]);
  return (
    <div>
      <label className="glass flex min-w-[220px] items-center gap-2 rounded-full px-4 py-2.5">
        <Search size={15} className="shrink-0 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="খুঁজুন: ব্যাংক, bank, BTRC, রেলওয়ে…"
          aria-label="Search posts in Bangla or English"
          role="searchbox"
          className="w-full bg-transparent text-sm outline-none"
        />
      </label>
      {visible.length === 0 && (
        <div className="mt-3"><EmptyState title="কোনো পদ মেলেনি" desc="অন্য নামে খুঁজুন — যেমন ‘প্রোগ্রামার’ বা ‘programmer’।" /></div>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {visible.map((p) => (
          <Link key={p.id} href={`/study/posts/${p.slug}`}>
            <GlassCard className="h-full p-5 transition hover:border-cyan-500/40">
              <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">{p.org.bn} • গ্রেড {p.grade ?? "—"}</p>
              <h2 className="mt-1 font-extrabold leading-7">{p.title.bn} <span className="font-semibold text-slate-500">({p.title.en})</span></h2>
              <p className="mt-1 text-[12.5px] text-slate-500">{p.eligibilityNote?.bn}</p>
              <span className="mt-2 inline-block text-[13px] font-bold text-cyan-700 dark:text-cyan-300">সিলেবাস ও প্যাটার্ন →</span>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
