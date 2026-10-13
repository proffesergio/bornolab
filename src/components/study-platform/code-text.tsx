import { cn } from "@/lib/cn";

/**
 * Wrapping-safe bilingual text: long code, formulas, URLs and English words
 * wrap instead of overflowing; `code` segments render monospace.
 * Server-safe (no hooks) — usable in server + client components.
 */
export function CodeText({ text, className }: { text: string; className?: string }) {
  const parts = String(text ?? "").split(/(`[^`]+`)/g);
  return (
    <span className={cn("whitespace-pre-wrap break-words [overflow-wrap:anywhere]", className)}>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
          <code key={i} className="rounded bg-slate-900/[.07] px-1.5 py-0.5 font-mono text-[0.92em] dark:bg-white/10">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
