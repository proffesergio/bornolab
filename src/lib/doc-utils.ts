"use client";
/** Client-side doc helpers: range parser, download, text extraction fallback */

export function parseRangePattern(pattern: string, total: number): number[] {
  // e.g. "1-3, 5, 7-12" → 1-indexed → 0-indexed unique sorted
  const out = new Set<number>();
  for (const part of pattern.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = Math.max(1, parseInt(m[1], 10));
      let b = Math.min(total, parseInt(m[2], 10));
      if (a > b) [a, b] = [b, a];
      for (let p = a; p <= b; p++) out.add(p - 1);
    } else if (/^\d+$/.test(part)) {
      const p = parseInt(part, 10);
      if (p >= 1 && p <= total) out.add(p - 1);
    }
  }
  return [...out].sort((a, b) => a - b);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function fileToArrayBuffer(f: File): Promise<ArrayBuffer> {
  return await f.arrayBuffer();
}
