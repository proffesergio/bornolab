"use client";
import { useCallback, useEffect, useState } from "react";

export interface LoginUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

/**
 * Tri-state auth for login-gated buttons. `loggedIn` is null while the
 * session check is in flight — callers must render a neutral state for null
 * and only show a "login" CTA when it is definitively false. This avoids
 * flashing "Login to download" at users who are already signed in.
 */
export function useLogin() {
  const [user, setUser] = useState<LoginUser | null>(null);
  const [checked, setChecked] = useState(false);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const r = await fetch("/api/auth/me");
      const j = await r.json();
      const u = (j.user ?? null) as LoginUser | null;
      setUser(u);
      return u !== null;
    } catch {
      setUser(null);
      return false;
    } finally {
      setChecked(true);
    }
  }, []);

  // Initial session check (auth API read) — setState-in-effect is intended here
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { user, loggedIn: checked ? user !== null : null, refresh };
}
