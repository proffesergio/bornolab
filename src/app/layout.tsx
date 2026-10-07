import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";
import { Navbar } from "@/components/navbar";
import { AnnouncementBar, Tracker } from "@/components/site-widgets";
import { getSiteConfig } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  try {
    const cfg = await getSiteConfig();
    const title = cfg.seo.title?.trim() || "BornoLab — বাংলা Font & Document Suite";
    const description =
      cfg.seo.description?.trim() ||
      "Free Bangla toolkit: Bijoy to Unicode converter, Bangla fonts, text styler, PDF to DOCX, PDF splitter & merger. Private, in-browser, AdSense-friendly guides.";
    return {
      metadataBase: new URL(SITE_URL),
      title: { default: title, template: "%s • BornoLab" },
      description,
      keywords: cfg.seo.keywords,
      authors: [{ name: "BornoLab" }],
      alternates: { canonical: "/" },
      openGraph: {
        type: "website",
        siteName: "BornoLab",
        title,
        description,
        url: "/",
        locale: "bn_BD",
      },
      twitter: { card: "summary_large_image", title, description },
      robots: { index: true, follow: true },
      icons: { icon: "/icon.svg" },
    };
  } catch {
    return {
      metadataBase: new URL(SITE_URL),
      title: "BornoLab — বাংলা Font & Document Suite",
      icons: { icon: "/icon.svg" },
    };
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070b16" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

/** Strip inline event handlers + javascript: URLs so admin-injected snippets can't break hydration or XSS the storefront. */
function sanitizeInject(raw: string): string {
  return (raw ?? "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "");
}

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BornoLab",
  url: SITE_URL,
  slogan: "বাংলা Font & Document Suite",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let adsense = "";
  let adsEnabled = true;
  let headerScripts = "";
  let footerScripts = "";
  try {
    const cfg = await getSiteConfig();
    adsense = (cfg.seo.adsenseClient ?? "").trim();
    adsEnabled = cfg.ads.enabled !== false;
    headerScripts = sanitizeInject(cfg.seo.headerScripts ?? "");
    footerScripts = sanitizeInject(cfg.seo.footerScripts ?? "");
  } catch { /* defaults */ }
  if (!adsEnabled) adsense = "";

  return (
    <html lang="bn" className="h-full dark" suppressHydrationWarning>
    
      <body className="flex min-h-full flex-col bg-white text-slate-900 antialiased dark:bg-[#070b16] dark:text-slate-100 dark:bg-[radial-gradient(60rem_30rem_at_20%_-10%,rgba(34,211,238,.15),transparent),radial-gradient(50rem_28rem_at_90%_0%,rgba(168,85,247,.18),transparent)]">
        <Script
          id="bornolab-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("bornolab-theme")||"dark";var d=t==="dark";document.documentElement.classList.toggle("dark",d);}catch(e){}`,
          }}
        />
        <Script id="bornolab-org-jsonld" type="application/ld+json" strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }} />
        {adsense ? (
          <Script
            id="bornolab-adsense"
            strategy="afterInteractive"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsense)}`}
            crossOrigin="anonymous"
          />
          
        ) : null}
        {headerScripts ? (
          <Script id="bornolab-header-inject" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: headerScripts }} />
        ) : null}
        <ThemeProvider>
          <Tracker />
          <AnnouncementBar />
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 dark:border-white/10">
            <div className="mx-auto w-full max-w-7xl px-4 py-10">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 via-violet-600 to-pink-500 p-6 text-center shadow-[0_0_40px_rgba(168,85,247,.25)] sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_10rem_at_50%_-20%,rgba(255,255,255,.25),transparent)]" />
                <p className="relative text-[11px] font-bold uppercase tracking-[0.3em] text-white/80">Support BornoLab</p>
                <h2 className="relative mx-auto mt-2 max-w-xl text-xl font-black text-white sm:text-2xl">Keep 10 PDF tools free for Bangladesh — forever</h2>
                <p className="relative mx-auto mt-2 max-w-xl text-[13px] leading-6 text-white/85">
                  BornoLab runs on supporter love, not paywalls. Every premium font or software purchase —
                  and every share — keeps the converters, PDF tools and styler free for students, newsrooms
                  and creators. <b>Thank you to all our early supporters.</b>
                </p>
                <div className="relative mt-4 flex flex-wrap justify-center gap-3">
                  <a href="/software" className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-slate-900 shadow hover:brightness-95">Go Premium — Support Us</a>
                  <a href="/contact" className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/10">Say Thanks</a>
                </div>
                <p className="relative mt-3 text-[11.5px] text-white/70">bKash • Nagad • Bank • Binance accepted</p>
              </div>

              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 text-lg font-black text-white">ব</span>
                    <span className="text-[16px] font-extrabold tracking-tight">BornoLab</span>
                  </span>
                  <p className="mt-3 max-w-xs text-[12.5px] leading-6 text-slate-500 dark:text-slate-400">
                    বাংলা Font & Document Suite — Bijoy to Unicode, fonts, styler and PDF tools. Private by design: files never leave your browser.
                  </p>
                </div>
                <nav aria-label="PDF Tools">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">PDF Tools</p>
                  <ul className="mt-3 space-y-2 text-[13px] font-medium">
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/pdf-tools">All PDF Tools</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/merge">Merge PDF</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/translate">PDF to DOCX</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/split">Split PDF</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/compress">Compress PDF</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/summarize">AI Summarizer</a></li>
                  </ul>
                </nav>
                <nav aria-label="Studio">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Studio</p>
                  <ul className="mt-3 space-y-2 text-[13px] font-medium">
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/bijoy-unicode-converter">Bijoy {"<>"} Unicode</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/fonts">Font Directory</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/styler">Text Styler</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/format">Auto-Format</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/software">Software Store</a></li>
                  </ul>
                </nav>
                <nav aria-label="Company">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Company</p>
                  <ul className="mt-3 space-y-2 text-[13px] font-medium">
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/about">About</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/contact">Contact</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/privacy">Privacy Policy</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/terms">Terms of Use</a></li>
                    <li><a className="hover:text-cyan-600 dark:hover:text-cyan-300" href="/admin/login">Admin</a></li>
                  </ul>
                </nav>
              </div>

              <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-5 text-[12px] text-slate-500 dark:border-white/10 sm:flex-row">
                <p>© {new Date().getFullYear()} <b className="text-slate-700 dark:text-slate-300">BornoLab</b> • Made for Bangladeshi creators, authors & DTP studios.</p>
                <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> 100% client-side • No uploads</p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
        {footerScripts ? (
          <Script id="bornolab-footer-inject" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: footerScripts }} />
        ) : null}
        <meta name="google-site-verification" content="1K6AxjUFKTfzqFLOWn1Ugtlc7Ctbr3dwrLrGmvDl6K4" />
      </body>
    </html>
  );
}
