/** Privacy-safe cohort percentiles: opt-in members only, aggregate bands, k-anonymity floor. */
export const MIN_COHORT = 30;

export type Band = "top-10" | "top-25" | "top-50" | "below-50";

export const BAND_COPY: Record<Band, { bn: string; en: string }> = {
  "top-10": { bn: "শীর্ষ ১০%", en: "Top 10% of the opted-in cohort" },
  "top-25": { bn: "শীর্ষ ২৫%", en: "Top 25% of the opted-in cohort" },
  "top-50": { bn: "শীর্ষ ৫০%", en: "Top half of the opted-in cohort" },
  "below-50": { bn: "নিচের অর্ধেক", en: "Lower half of the opted-in cohort" },
};

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)));
  return sorted[i];
}

/** Distribution summary — never individual scores. */
export function cohortBands(scores: number[]): { n: number; p50: number; p75: number; p90: number } | null {
  const clean = scores.filter((s) => Number.isFinite(s)).sort((a, b) => a - b);
  if (clean.length < MIN_COHORT) return null;
  return { n: clean.length, p50: quantile(clean, 0.5), p75: quantile(clean, 0.75), p90: quantile(clean, 0.9) };
}

/** Band a single pct against the aggregate (no rank, no peer data). */
export function bandFor(pct: number, dist: { p50: number; p75: number; p90: number }): Band {
  if (pct >= dist.p90) return "top-10";
  if (pct >= dist.p75) return "top-25";
  if (pct >= dist.p50) return "top-50";
  return "below-50";
}
