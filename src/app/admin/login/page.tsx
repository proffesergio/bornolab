"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, Mail, Lock } from "lucide-react";
import { GlassCard } from "@/components/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Login failed");
      router.push("/admin");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard>
          <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 text-white">
            <ShieldCheck size={22} />
          </span>
          <h1 className="mt-3 text-2xl font-black">Admin Login</h1>
          <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">
            Credentials come from <code>.env.local</code> (<code>ADMIN_EMAIL</code> + <code>ADMIN_PASSWORD</code>). Nothing is stored in the database.
          </p>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="admin-email" className="text-xs font-bold">Email</label>
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="focus-glow w-full rounded-xl bg-slate-100 py-2.5 pl-9 pr-3 text-sm outline-none dark:bg-black/30" placeholder="admin@example.com" />
              </div>
            </div>
            <div>
              <label htmlFor="admin-pass" className="text-xs font-bold">Password</label>
              <div className="relative mt-1">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="admin-pass" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="focus-glow w-full rounded-xl bg-slate-100 py-2.5 pl-9 pr-3 text-sm outline-none dark:bg-black/30" placeholder="••••••••" />
              </div>
            </div>
            {error && <p role="alert" className="text-[12.5px] font-semibold text-rose-500">{error}</p>}
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              {busy && <Loader2 size={15} className="animate-spin" />} Sign in
            </button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
