import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";
import { Navbar } from "@/components/navbar";
import { AnnouncementBar, Tracker } from "@/components/site-widgets";
import { getSiteConfig } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/site-url";
import { GoogleTagManager } from '@next/third-parties/google'

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

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BornoLab",
  url: SITE_URL,
  slogan: "বাংলা Font & Document Suite",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let adsense = "";
  try {
    adsense = ((await getSiteConfig()).seo.adsenseClient ?? "").trim();
  } catch { /* defaults */ }

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
        <ThemeProvider>
          <Tracker />
          <AnnouncementBar />
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-500">
            <p>
              <span className="font-bold text-slate-700 dark:text-slate-300">BornoLab</span> • Client-first Bangla toolkit • n8n automation-ready •{" "}
              <a className="underline decoration-cyan-500/50 underline-offset-2" href="/fonts">Fonts</a> •{" "}
              <a className="underline decoration-purple-500/50 underline-offset-2" href="/bijoy-unicode-converter">Bijoy {"<>"} Unicode</a> •{" "}
              <a className="underline decoration-emerald-500/50 underline-offset-2" href="/pdf-tools">PDF Tools</a> •{" "}
              <a className="underline decoration-slate-400/50 underline-offset-2" href="/software">Software</a>
            </p>
            <p className="mt-2">
              <a className="underline underline-offset-2" href="/about">About</a> •{" "}
              <a className="underline underline-offset-2" href="/contact">Contact</a> •{" "}
              <a className="underline underline-offset-2" href="/privacy">Privacy Policy</a> •{" "}
              <a className="underline underline-offset-2" href="/terms">Terms of Use</a> •{" "}
              <a className="underline decoration-slate-400/50 underline-offset-2" href="/admin/login">Admin</a>
            </p>
            <p className="mt-1">Made for Bangladeshi creators, authors & DTP studios. See <code>docs/plans.md</code> for the print-automation roadmap.</p>
          </footer>
        </ThemeProvider>
        <meta name="google-site-verification" content="1K6AxjUFKTfzqFLOWn1Ugtlc7Ctbr3dwrLrGmvDl6K4" />
        <GoogleTagManager gtmId="G-1WVRY0063T" />      
      </body>
    </html>
  );
}
