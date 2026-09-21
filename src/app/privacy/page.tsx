import type { Metadata } from "next";
import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "BornoLab privacy policy: client-first processing, what analytics and cookies we use, Google AdSense disclosure, and how to contact us.",
};

export default function PrivacyPage() {
  return (
    <div>
      <SectionTitle
        kicker="Legal"
        title="Privacy Policy"
        desc="Last updated: September 2026. Plain-language summary of what BornoLab collects — and the long list of what it doesn't."
      />
      <div className="grid gap-4">
        <GlassCard>
          <h2 className="font-extrabold">1. Client-first processing</h2>
          <p className="mt-1.5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            Text conversion, font previews, styling, PDF splitting, merging and PDF-to-DOCX translation run
            entirely in your browser using JavaScript libraries. Your documents, pasted text and uploaded
            files are <b>never sent to our servers</b> for these tools. Closing the tab erases them from memory.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="font-extrabold">2. What we do collect</h2>
          <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            <li><b>Anonymous page-view counts</b> (URL + timestamp) to understand which tools are popular. No IP fingerprinting, no cross-site tracking.</li>
            <li><b>Manual-payment orders:</b> when you buy a premium font or software, we store the item, amount, payment method, sender number and transaction ID you submit — solely to verify and deliver your order.</li>
            <li><b>Admin settings</b> you configure in the dashboard (kept in a JSON store / environment seed).</li>
          </ul>
        </GlassCard>
        <GlassCard>
          <h2 className="font-extrabold">3. Cookies & advertising (Google AdSense)</h2>
          <p className="mt-1.5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            We use a theme-preference entry in <code>localStorage</code> (not a cookie) to remember dark/light
            mode. If analytics or advertising is enabled, third parties may set cookies:
          </p>
          <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            <li><b>Google Analytics (optional):</b> only loads when the site owner configures a measurement ID. It helps count visits. You can block it with any ad-blocker or “Do Not Track”.</li>
            <li><b>Google AdSense (future):</b> ad slots on this site are clearly labelled “Advertisement”. Google may use cookies to serve personalised or non-personalised ads. Learn how Google uses data at{" "}
              <a className="underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">policies.google.com/technologies/ads</a>{" "}
              and manage your ad choices at{" "}
              <a className="underline" href="https://adssettings.google.com" target="_blank" rel="noreferrer">adssettings.google.com</a>.
            </li>
          </ul>
        </GlassCard>
        <GlassCard>
          <h2 className="font-extrabold">4. Data sharing, retention & your rights</h2>
          <p className="mt-1.5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            We never sell personal data. Order records are kept only as long as needed for delivery, refunds
            and fraud prevention. Analytics aggregates contain no identities. You may request a copy or
            deletion of your order record at any time via the{" "}
            <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/contact">contact page</Link>.
            Children under 13 should use BornoLab with a guardian — the tools are general-audience utilities
            with no accounts, chats or user-generated public content.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="font-extrabold">5. Changes</h2>
          <p className="mt-1.5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            If this policy changes materially, the “Last updated” date above changes and significant changes
            are announced on the homepage announcement bar. Continued use of the site after changes means you
            accept the updated policy.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
