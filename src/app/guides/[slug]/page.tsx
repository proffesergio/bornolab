import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui";
import { AdUnits } from "@/components/ads";
import { GUIDES, getGuide } from "@/lib/guides";
import { getSiteUrl } from "@/lib/site-url";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: `${getSiteUrl()}/guides/${guide.slug}` },
    openGraph: { type: "article", title: guide.title, description: guide.description },
  };
}

/** Article + FAQ schema for rich results; CTAs funnel readers into tools. */
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="font-extrabold">Guide not found</p>
        <Link href="/guides" className="mt-4 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white">← All guides</Link>
      </GlassCard>
    );
  }
  const related = GUIDES.filter((g) => g.slug !== guide.slug && g.category === guide.category)
    .concat(GUIDES.filter((g) => g.slug !== guide.slug && g.category !== guide.category))
    .slice(0, 2);
  const url = `${getSiteUrl()}/guides/${guide.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.updatedAt,
    dateModified: guide.updatedAt,
    author: { "@type": "Organization", name: "BornoLab" },
    mainEntityOfPage: url,
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <Link href="/guides" className="hover:underline">Guides</Link>
        <span>/</span>
        <span className="truncate text-slate-700 dark:text-slate-200">{guide.category}</span>
      </nav>

      <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">{guide.category}</p>
      <h1 className="mt-1 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">{guide.title}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1"><Clock size={13} /> {guide.minutes} min read</span>
        <span>• Updated {guide.updatedAt}</span>
        <span>• By BornoLab</span>
      </p>

      <div className="mt-4 max-w-3xl space-y-3 text-[14.5px] leading-8 text-slate-700 dark:text-slate-300">
        {guide.intro.map((p, i) => <p key={i}>{p}</p>)}
      </div>

      {guide.sections.map((s, i) => (
        <section key={s.heading} className="mt-8 max-w-3xl">
          <h2 className="text-xl font-black">{i + 1}. {s.heading}</h2>
          <div className="mt-2 space-y-3 text-[14.5px] leading-8 text-slate-700 dark:text-slate-300">
            {s.paras.map((p, j) => <p key={j}>{p}</p>)}
            {s.list && (
              <ul className="list-disc space-y-1.5 pl-5">
                {s.list.map((li) => <li key={li}>{li}</li>)}
              </ul>
            )}
          </div>
          {i === 0 && <AdUnits slot="inFeed" className="mt-6" />}
        </section>
      ))}

      <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {guide.ctas.map((c) => (
          <Link key={c.href} href={c.href} className="glass hover-glow group rounded-2xl p-4">
            <span className="font-extrabold group-hover:text-cyan-700 dark:group-hover:text-cyan-200">{c.label} →</span>
            <span className="mt-0.5 block text-[12.5px] text-slate-500 dark:text-slate-400">{c.desc}</span>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-10 max-w-3xl text-xl font-black">Frequently asked questions</h2>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: guide.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <div className="grid max-w-3xl gap-3">
        {guide.faqs.map((f) => (
          <details key={f.q} className="glass group rounded-2xl p-4">
            <summary className="cursor-pointer text-[14.5px] font-bold">{f.q}</summary>
            <p className="mt-2 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">{f.a}</p>
          </details>
        ))}
      </div>

      {related.length > 0 && (
        <div className="mt-10 max-w-3xl">
          <h2 className="mb-3 text-lg font-black">Keep reading</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/guides/${r.slug}`} className="glass hover-glow rounded-2xl p-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">{r.category}</span>
                <span className="mt-0.5 block font-extrabold leading-6">{r.title}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-bold text-cyan-700 dark:text-cyan-300">Read <ArrowRight size={13} /></span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link href="/guides" className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft size={14} /> All guides
      </Link>
    </div>
  );
}
