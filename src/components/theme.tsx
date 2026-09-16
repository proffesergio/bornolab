"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: true, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always match the server on first render (dark) to avoid hydration
  // mismatch; then sync with the saved preference after mount. The
  // blocking theme-init <Script> in layout.tsx already sets the
  // <html> class pre-hydration, so there is no flash.
  const [dark, setDark] = useState<boolean>(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bornolab-theme") ?? "dark";
      const isDark = saved === "dark";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time post-hydration sync so server + client first render identically (dark)
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch {
      document.documentElement.classList.toggle("dark", true);
    }
  }, []);
  const toggle = () => {
    const nd = !dark;
    setDark(nd);
    try {
      document.documentElement.classList.toggle("dark", nd);
      localStorage.setItem("bornolab-theme", nd ? "dark" : "light");
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  };
  return <ThemeCtx.Provider value={{ dark, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
