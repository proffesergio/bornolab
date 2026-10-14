/** Bilingual search with synonyms + chapter/post aliases. Pure + lightweight. */
import { PLATFORM_POSTS, PLATFORM_SUBJECTS } from "./curriculum";
import { getChapters } from "./catalog";

const SYNONYMS: Record<string, string[]> = {
  subnet: ["subnetting", "সাবনেট", "সাবনেটিং", "cidr", "vlsm"],
  সাবনেট: ["subnet", "subnetting", "cidr"],
  sql: ["ডাটাবেজ", "database", "join", "normalization", "নরমালাইজেশন"],
  ডাটাবেজ: ["database", "sql"],
  oop: ["অবজেক্ট", "inheritance", "polymorphism", "ইনহেরিট্যান্স"],
  network: ["নেটওয়ার্ক", "osi", "tcp", "ip"],
  নেটওয়ার্ক: ["network", "osi", "tcp"],
  bangla: ["বাংলা", "ব্যাকরণ", "সন্ধি", "সমাস"],
  বাংলা: ["bangla", "grammar"],
  english: ["ইংরেজি", "grammar", "tense", "voice"],
  ইংরেজি: ["english"],
  math: ["গণিত", "বীজগণিত", "জ্যামিতি", "probability"],
  গণিত: ["math"],
  os: ["অপারেটিং", "deadlock", "scheduling", "পেজিং"],
  security: ["নিরাপত্তা", "cryptography", "firewall", "xss", "sql injection"],
};

function norm(s: string): string {
  return (s ?? "").normalize("NFC").toLowerCase().trim();
}

function expandQuery(q: string): string[] {
  const n = norm(q);
  const parts = n.split(/\s+/).filter(Boolean);
  const out = new Set<string>([n, ...parts]);
  for (const p of parts) {
    for (const syn of SYNONYMS[p] ?? []) out.add(norm(syn));
  }
  for (const [k, syns] of Object.entries(SYNONYMS)) {
    if (n.includes(norm(k))) for (const s of syns) out.add(norm(s));
  }
  return [...out];
}

export interface SearchHit {
  kind: "post" | "subject" | "chapter";
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  score: number;
}

export function searchPlatform(query: string, limit = 20): SearchHit[] {
  const terms = expandQuery(query);
  if (terms.every((t) => !t)) return [];
  const hits: SearchHit[] = [];
  const scoreText = (hay: string): number => {
    const h = norm(hay);
    let s = 0;
    for (const t of terms) {
      if (!t) continue;
      if (h === t) s += 10;
      else if (h.startsWith(t)) s += 6;
      else if (h.includes(t)) s += 3;
    }
    return s;
  };
  for (const p of PLATFORM_POSTS) {
    const s = scoreText(`${p.title.bn} ${p.title.en} ${p.aliases.join(" ")} ${p.org.bn} ${p.org.en} ${p.track}`);
    if (s > 0) hits.push({ kind: "post", id: p.id, slug: p.slug, titleBn: p.title.bn, titleEn: p.title.en, score: s });
  }
  for (const s of PLATFORM_SUBJECTS) {
    const sc = scoreText(`${s.title.bn} ${s.title.en} ${s.aliases.join(" ")} ${s.overview.bn} ${s.overview.en}`);
    if (sc > 0) hits.push({ kind: "subject", id: s.id, slug: s.slug, titleBn: s.title.bn, titleEn: s.title.en, score: sc + 1 });
  }
  for (const c of getChapters()) {
    const sc = scoreText(`${c.title.bn} ${c.title.en} ${c.aliases.join(" ")} ${c.overview.bn} ${c.overview.en}`);
    if (sc > 0) hits.push({ kind: "chapter", id: c.id, slug: c.slug, titleBn: c.title.bn, titleEn: c.title.en, score: sc + 2 });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
