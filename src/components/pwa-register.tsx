"use client";
import { useEffect } from "react";

/** Register the BornoLab service worker (offline reading shell). No-op where unsupported. */
export function PwaRegister() {
  // Registration only — setState-in-effect is not needed here.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline shell unavailable — app still works online */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
