"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";

function decodeToken(t: string): { email: string; code: string } | null {
  try {
    const b64 = t.replaceAll("-", "+").replaceAll("_", "/");
    const [email, code] = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)).split(":");
    if (!email || !/^\d{6}$/.test(code ?? "")) return null;
    return { email, code };
  } catch {
    return null;
  }
}

/** GET /login/verify?t= — one-click magic-link login. */
function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("Verifying your magic link…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = params.get("t") ?? "";
      const creds = decodeToken(t);
      if (!creds) {
        if (!cancelled) setMsg("This magic link is invalid. Request a new one from /login.");
        return;
      }
      try {
        const r = await fetch("/api/auth/verify-code", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          if (!cancelled) setMsg(j.error ?? "This link expired. Request a new one from /login.");
          return;
        }
        router.push("/");
        router.refresh();
      } catch {
        if (!cancelled) setMsg("Network error. Try again.");
      }
    })();
    return () => { cancelled = true; };
  }, [params, router]);

  return (
    <div className="mx-auto max-w-md">
      <SectionTitle kicker="Account" title="Magic link" desc="Signing you in…" />
      <GlassCard>
        <p className="flex items-center gap-2 text-[13.5px]"><Loader2 size={15} className="animate-spin" />{msg}</p>
      </GlassCard>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
