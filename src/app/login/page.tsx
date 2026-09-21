"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailCheck, KeyRound, Link2 } from "lucide-react";

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.3 7.5 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.6-2.8-.1.1C.5 8.7 0 10.2 0 12s.5 3.3 1.4 4.7l3.8-2.3z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.4 6.8l3.8 2.9c1-2.9 3.7-5 6.8-5z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3v-3.5h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 1-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z" />
    </svg>
  );
}
import { GlassCard, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/cn";

interface Providers { google: boolean; facebook: boolean; otp: boolean; magicLink: boolean }

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [providers, setProviders] = useState<Providers | null>(null);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"otp" | "link">("otp");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));
  const [devCode, setDevCode] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers").then((r) => r.json()).then(setProviders).catch(() => {});
    fetch("/api/auth/me").then((r) => r.json()).then((j) => { if (j.user) router.push("/"); }).catch(() => {});
  }, [router]);

  const send = async () => {
    setError(null); setDevCode(null); setDevLink(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid email address."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), mode }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not send code.");
      if (j.dev && j.code) { setDevCode(j.code); setDevLink(j.linkUrl ?? null); }
      setStep("code");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) { setError("Enter the 6-digit code."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), name: name.trim() || undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Verification failed.");
      router.push("/");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const socialBtn = "flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mx-auto max-w-md">
      <SectionTitle kicker="Account" title="Login to BornoLab" desc="Save preferences, sync plans and check out faster." />
      <GlassCard>
        {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[13px] font-semibold text-red-600 dark:text-red-300">{error}</p>}

        <div className="grid gap-2">
          <form action="/api/auth/oauth/google" method="GET" onSubmit={(e) => { if (!providers?.google) e.preventDefault(); }}>
            <button
              type="submit"
              disabled={!providers?.google}
              className={cn(socialBtn, "bg-white text-slate-800 shadow dark:bg-white/10 dark:text-white")}
              title={providers?.google ? "Continue with Google" : "Google login is not configured (see Admin → Access)"}
            >
              <GoogleMark /> Continue with Google {!providers?.google && <span className="text-[11px] font-semibold opacity-60">• not configured</span>}
            </button>
          </form>
          <form action="/api/auth/oauth/facebook" method="GET" onSubmit={(e) => { if (!providers?.facebook) e.preventDefault(); }}>
            <button
              type="submit"
              disabled={!providers?.facebook}
              className={cn(socialBtn, "bg-[#1877F2] text-white")}
              title={providers?.facebook ? "Continue with Facebook" : "Facebook login is not configured (see Admin → Access)"}
            >
              <FacebookMark /> Continue with Facebook {!providers?.facebook && <span className="text-[11px] font-semibold opacity-70">• not configured</span>}
            </button>
          </form>
        </div>

        <div className="my-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          <span className="h-px flex-1 bg-slate-300/50 dark:bg-white/10" /> or with email <span className="h-px flex-1 bg-slate-300/50 dark:bg-white/10" />
        </div>

        {step === "email" ? (
          <>
            <div className="flex gap-1.5" role="group" aria-label="Email login mode">
              {(providers?.otp !== false) && (
                <button onClick={() => setMode("otp")} aria-pressed={mode === "otp"} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-bold", mode === "otp" ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass")}>
                  <KeyRound size={14} /> 6-digit code
                </button>
              )}
              {(providers?.magicLink !== false) && (
                <button onClick={() => setMode("link")} aria-pressed={mode === "link"} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-bold", mode === "link" ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass")}>
                  <Link2 size={14} /> Magic link
                </button>
              )}
            </div>
            <label htmlFor="login-email" className="mt-3 block text-xs font-bold">Email address</label>
            <input
              id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
              placeholder="you@example.com"
              className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none dark:bg-black/30"
            />
            <button onClick={send} disabled={busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <MailCheck size={16} />}
              {mode === "otp" ? "Send login code" : "Send magic link"}
            </button>
          </>
        ) : (
          <>
            <p className="text-[13px] text-slate-600 dark:text-slate-400">
              {mode === "otp" ? <>We sent a 6-digit code to <b>{email}</b> (valid 10 min).</> : <>We sent a magic link to <b>{email}</b> — or paste the code below.</>}
              <button onClick={() => setStep("email")} className="ml-2 font-bold text-cyan-700 underline dark:text-cyan-300">Change</button>
            </p>
            {devCode && (
              <p className="mt-2 rounded-xl bg-amber-500/10 p-3 font-mono text-[13px] font-bold text-amber-700 dark:text-amber-200">
                Dev mode — code: {devCode}
                {devLink && <> • <a className="underline" href={devLink}>open magic link</a></>}
              </p>
            )}
            <label htmlFor="login-name" className="mt-3 block text-xs font-bold">Name <span className="font-normal text-slate-400">(first login only, optional)</span></label>
            <input
              id="login-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none dark:bg-black/30"
            />
            <label htmlFor="login-code" className="mt-3 block text-xs font-bold">6-digit code</label>
            <input
              id="login-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") void verify(); }}
              placeholder="••••••"
              className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-3 text-center font-mono text-xl tracking-[0.4em] outline-none dark:bg-black/30"
            />
            <button onClick={verify} disabled={busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Verify & Login
            </button>
          </>
        )}
      </GlassCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
