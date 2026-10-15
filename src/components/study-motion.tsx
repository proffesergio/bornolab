"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Fade-up reveal on scroll — the shared section entrance for the Study hub. */
export function FadeUp({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — children wrapped in <StaggerItem> cascade in. */
export function StaggerGrid({ children, className, role, ariaLabel }: { children: ReactNode; className?: string; role?: string; ariaLabel?: string }) {
  return (
    <motion.div
      className={className}
      role={role}
      aria-label={ariaLabel}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, role }: { children: ReactNode; className?: string; role?: string }) {
  return (
    <motion.div
      className={className}
      role={role}
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}
