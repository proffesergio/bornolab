import type { Metadata } from "next";
import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact BornoLab: support for the Bijoy converter, fonts, PDF tools, order help and feedback. We reply within 2 business days.",
};

export default function ContactPage() {
  return (
    <div>
      <SectionTitle
        kicker="Support"
        title="Contact BornoLab"
        desc="প্রশ্ন, সমস্যা বা পরামর্শ? Every message below is read by a human — usually within 2 business days."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h2 className="text-lg font-black">Email us</h2>
          <p className="mt-2 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            For converter bugs, PDF tool issues, order and payment help, font licensing, advertising
            enquiries or takedown requests, write to:
          </p>
          <p className="mt-3">
            <a
              href="mailto:support@bornolab.example"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-bold text-white hover:brightness-110"
            >
              support@bornolab.example
            </a>
          </p>
          <p className="mt-3 text-[12.5px] leading-6 text-slate-500 dark:text-slate-400">
            Tip: include the tool name (e.g. “Split PDF”), your browser, and — for order help — your sender
            number plus transaction ID. Screenshots of converter output help us fix encoding bugs fastest.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-black">Before you write</h2>
          <ul className="mt-2 space-y-2 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            <li><b>Bijoy looks like English?</b> Install SutonnyMJ, or keep the live Bangla preview on — see the <Link className="underline" href="/bijoy-unicode-converter">converter FAQ</Link>.</li>
            <li><b>Scanned PDF has no text?</b> Image-only pages need OCR — our guides explain the free n8n route.</li>
            <li><b>Order pending?</b> Manual bKash/Nagad verification takes up to 24 hours; check the txn ID first.</li>
            <li><b>Found a bug?</b> Tell us the exact steps and file type — anonymous reports welcome.</li>
          </ul>
        </GlassCard>
      </div>
      <GlassCard className="mt-4">
        <h2 className="text-lg font-black">Office hours & address</h2>
        <p className="mt-1.5 max-w-3xl text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
          BornoLab is an online-first project based in Dhaka, Bangladesh, serving Bangla creators worldwide.
          Support hours: Saturday–Thursday, 10:00–18:00 (BST). This page plus the{" "}
          <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/about">About page</Link>,{" "}
          <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/privacy">Privacy Policy</Link> and{" "}
          <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/terms">Terms of Use</Link>{" "}
          form our complete public contact and accountability surface for readers and advertisers.
        </p>
      </GlassCard>
    </div>
  );
}
