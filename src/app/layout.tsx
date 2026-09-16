import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";
import { Navbar } from "@/components/navbar";
import { AnnouncementBar, Tracker } from "@/components/site-widgets";
import { getSiteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const cfg = await getSiteConfig();
    return {
      title: cfg.seo.title,
      description: cfg.seo.description,
      keywords: cfg.seo.keywords,
      icons: { icon: "/icon.svg" },
    };
  } catch {
    return { title: "BornoLab — বাংলা Font & Document Suite", icons: { icon: "/icon.svg" } };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let adsense = "";
  try {
    adsense = (await getSiteConfig()).seo.adsenseClient.trim();
  } catch { /* defaults */ }

  return (
    <html lang="bn" className="h-full dark" suppressHydrationWarning>
      <head>
        {adsense && (
          <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsense)}`} crossOrigin="anonymous" />
        )}
      </head>
      <body className="flex min-h-full flex-col bg-white text-slate-900 antialiased dark:bg-[#070b16] dark:text-slate-100 dark:bg-[radial-gradient(60rem_30rem_at_20%_-10%,rgba(34,211,238,.15),transparent),radial-gradient(50rem_28rem_at_90%_0%,rgba(168,85,247,.18),transparent)]">
        <ThemeProvider>
          <Tracker />
          <AnnouncementBar />
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-500">
            <p>
              <span className="font-bold text-slate-700 dark:text-slate-300">BornoLab</span> • Client-first Bangla toolkit • n8n automation-ready •{" "}
              <a className="underline decoration-cyan-500/50 underline-offset-2" href="/fonts">Fonts</a> •{" "}
              <a className="underline decoration-purple-500/50 underline-offset-2" href="/convert">Converter</a> •{" "}
              <a className="underline decoration-slate-400/50 underline-offset-2" href="/software">Software</a> •{" "}
              <a className="underline decoration-slate-400/50 underline-offset-2" href="/admin/login">Admin</a>
            </p>
            <p className="mt-1">Made for Bangladeshi creators, authors & DTP studios. See <code>docs/plans.md</code> for the print-automation roadmap.</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
