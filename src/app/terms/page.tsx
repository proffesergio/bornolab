import type { Metadata } from "next";
import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "BornoLab terms of use: acceptable use of free converters and PDF tools, premium purchases and refunds, warranties and liability.",
};

export default function TermsPage() {
  return (
    <div>
      <SectionTitle
        kicker="Legal"
        title="Terms of Use"
        desc="Last updated: September 2026. The short, fair rules for using BornoLab's free tools and paid products."
      />
      <div className="grid gap-4">
        <GlassCard>
          <h2 className="font-extrabold">1. Free tools & acceptable use</h2>
          <p className="mt-1.5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            The Bijoy to Unicode converter, font previews, text styler and PDF utilities are free for personal
            and commercial use. You agree not to abuse them: no automated bulk scraping that degrades service
            for others, no uploading content you have no right to process, and no attempting to break access
            controls on the <Link className="underline" href="/admin/login">admin area</Link>. We may rate-limit
            abusive clients to keep the site fast for everyone.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="font-extrabold">2. Your files are your responsibility</h2>
          <p className="mt-1.5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            Because processing happens in your browser, we never see your files — which also means we cannot
            recover them. Keep backups of originals before converting, splitting or merging. PDF password
            tools are provided solely for documents you own or are authorised to handle; removing protection
            from files you have no rights to is prohibited.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="font-extrabold">3. Premium fonts, software & payments</h2>
          <p className="mt-1.5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            Paid items are delivered after manual verification of bKash, Nagad, bank or Binance transfers —
            typically within 24 hours. If your payment cannot be verified, or the download is defective and we
            cannot fix it within 7 days, you are entitled to a re-delivery or a full refund to the same channel.
            Licences are per-buyer unless the product page states otherwise; redistribution or public re-upload
            of paid fonts and software is not permitted.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="font-extrabold">4. Accuracy, warranties & liability</h2>
          <p className="mt-1.5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            The Bijoy ⇄ Unicode engine is tested for reversibility, but exotic ligatures, scanned PDFs and
            machine-generated layouts can produce imperfect output — always proofread before print. Tools are
            provided “as is”, without warranties of any kind. To the maximum extent permitted by the laws of
            Bangladesh, BornoLab is not liable for indirect losses arising from tool output, including
            reprint costs. Nothing here limits rights you hold under applicable consumer law.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="font-extrabold">5. Changes & contact</h2>
          <p className="mt-1.5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            We may update these terms as tools evolve; the “Last updated” date records revisions. Questions
            about these terms belong on the{" "}
            <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/contact">contact page</Link>.
            See also the <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/privacy">Privacy Policy</Link>{" "}
            and <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/about">About page</Link>.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
