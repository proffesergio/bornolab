"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";

interface Me {
  id: string; email: string; name: string; avatar?: string;
}

/** Navbar account control: Login link when logged out, avatar menu when in. */
export function UserMenu() {
  const [user, setUser] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((j) => setUser(j.user)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <span className="glass rounded-full px-3.5 py-2 text-[13px] text-slate-400">…</span>;

  if (!user) {
    return (
      <Link href="/login" className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-[13px] font-bold text-white">
        <LogIn size={15} /> <span className="hidden sm:inline">Login</span>
      </Link>
    );
  }

  const initial = (user.name || user.email).trim().charAt(0).toUpperCase() || "•";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        title={user.email}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 py-1 pl-1 pr-3 text-[13px] font-bold text-white"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime OAuth avatar, not optimizable
          <img src={user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/25 text-[13px] font-black">{initial}</span>
        )}
        <span className="hidden max-w-[110px] truncate sm:inline">{user.name}</span>
      </button>
      {open && (
        <div role="menu" className="glass absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl p-2 shadow-2xl">
          <p className="truncate px-3 py-2 text-[12px] font-semibold text-slate-500">{user.email}</p>
          <button
            onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); setOpen(false); }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-500/10"
          >
            <LogOut size={15} /> Logout
          </button>
          <p className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-slate-400"><UserIcon size={12} /> Signed in with BornoLab</p>
        </div>
      )}
    </div>
  );
}
