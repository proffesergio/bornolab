/**
 * Question Bank Solutions module — department → subject → chapter taxonomy
 * plus the document catalog (admin-uploaded PDFs attached to a section).
 *
 * Template status (verified 2026-10-15 from Telegram Desktop PDFs):
 * - "পেট্রোবাংলার_সাধারণ_গণিত_ও_সাধারণ_জ্ঞান_প্রশ্ন_সমাধান_.pdf" — 140 pages, scanned (no extractable text) → needs OCR/manual.
 * - "GK Sheet.pdf" — 9 pages, extractable but broken font encoding (~150 GK Q&A) → needs cleanup.
 * - "Math Full With Answer.pdf" — 207 pages, p1 scanned + body in legacy Bijoy encoding → needs Bijoy→Unicode conversion.
 * - "Computer Fundamentals Bengali.pdf" — 6 pages, fully scanned images → needs OCR.
 * - "বাংলা_সাহিত্য_এ_টু_জেড_httpst_meBCS_OtherJobs.pdf" — 25 pages, CamScanner scans → needs OCR.
 * - "Trump Repeated Threat.pdf" — 16 pages, extractable English vocab digest → supplementary English material.
 */

export interface QBBilingual {
  bn: string;
  en: string;
}

export interface QBChapter {
  id: string;
  slug: string;
  subjectId: string;
  title: QBBilingual;
  order: number;
}

export interface QBSubject {
  id: string;
  slug: string;
  deptId: string;
  title: QBBilingual;
  blurb: QBBilingual;
  chapters: QBChapter[];
}

export interface QBDepartment {
  id: string;
  slug: string;
  title: QBBilingual;
  blurb: QBBilingual;
  /** Gradient classes for department cards. */
  grad: string;
  subjects: QBSubject[];
}

function ch(
  id: string,
  slug: string,
  subjectId: string,
  bn: string,
  en: string,
  order: number
): QBChapter {
  return { id, slug, subjectId, title: { bn, en }, order };
}

function subj(
  id: string,
  slug: string,
  deptId: string,
  bn: string,
  en: string,
  blurbBn: string,
  blurbEn: string,
  chapters: QBChapter[]
): QBSubject {
  return { id, slug, deptId, title: { bn, en }, blurb: { bn: blurbBn, en: blurbEn }, chapters };
}

export const QB_DEPARTMENTS: QBDepartment[] = [
  {
    id: "petrobangla",
    slug: "petrobangla",
    title: { bn: "পেট্রোবাংলা", en: "Petrobangla" },
    blurb: {
      bn: "পেট্রোবাংলা নিয়োগ পরীক্ষার বিষয়ভিত্তিক প্রশ্ন-ব্যাংক ও সমাধান — অধ্যায়별로 সাজানো।",
      en: "Subject-wise Petrobangla recruitment question bank with solutions, arranged chapter by chapter.",
    },
    grad: "from-amber-500 to-orange-600",
    subjects: [
      subj(
        "qb-petrobangla-gk",
        "general-knowledge",
        "petrobangla",
        "সাধারণ জ্ঞান",
        "General Knowledge",
        "বাংলাদেশ বিষয়াবলি, জ্বালানি খাত, সংবিধান ও সাম্প্রতিক তথ্য।",
        "Bangladesh affairs, energy sector, constitution and current affairs.",
        [
          ch("qb-ch-gk-bd", "bangladesh-affairs", "qb-petrobangla-gk", "বাংলাদেশ বিষয়াবলি", "Bangladesh Affairs", 1),
          ch("qb-ch-gk-lib", "liberation-war-constitution", "qb-petrobangla-gk", "মুক্তিযুদ্ধ ও সংবিধান", "Liberation War & Constitution", 2),
          ch("qb-ch-gk-energy", "energy-gas-sector", "qb-petrobangla-gk", "জ্বালানি ও গ্যাস খাত", "Energy & Gas Sector", 3),
          ch("qb-ch-gk-current", "current-affairs", "qb-petrobangla-gk", "সাম্প্রতিক ঘটনা", "Current Affairs", 4),
          ch("qb-ch-gk-intl", "international-gk", "qb-petrobangla-gk", "আন্তর্জাতিক সাধারণ জ্ঞান", "International GK", 5),
        ]
      ),
      subj(
        "qb-petrobangla-math",
        "general-math",
        "petrobangla",
        "সাধারণ গণিত",
        "General Math",
        "পাটিগণিত, বীজগণিত, জ্যামিতি — ব্যাখ্যাসহ সমাধান।",
        "Arithmetic, algebra, geometry — solved with explanations.",
        [
          ch("qb-ch-math-arith", "arithmetic", "qb-petrobangla-math", "পাটিগণিত", "Arithmetic", 1),
          ch("qb-ch-math-algebra", "algebra", "qb-petrobangla-math", "বীজগণিত", "Algebra", 2),
          ch("qb-ch-math-geo", "geometry-mensuration", "qb-petrobangla-math", "জ্যামিতি ও পরিমিতি", "Geometry & Mensuration", 3),
          ch("qb-ch-math-trick", "speed-tricks", "qb-petrobangla-math", "দ্রুত সমাধান কৌশল", "Speed Tricks", 4),
        ]
      ),
      subj(
        "qb-petrobangla-bangla",
        "bangla",
        "petrobangla",
        "বাংলা",
        "Bangla",
        "ব্যাকরণ ও সাহিত্য (এ-টু-জেড) — প্রশ্ন-ব্যাংক সমাধানসহ।",
        "Grammar & literature (A-to-Z) with question-bank solutions.",
        [
          ch("qb-ch-ban-grammar", "grammar", "qb-petrobangla-bangla", "ব্যাকরণ", "Grammar", 1),
          ch("qb-ch-ban-lit", "literature-a-to-z", "qb-petrobangla-bangla", "সাহিত্য (এ-টু-জেড)", "Literature (A-to-Z)", 2),
        ]
      ),
      subj(
        "qb-petrobangla-english",
        "english",
        "petrobangla",
        "ইংরেজি",
        "English",
        "গ্রামার, ভোকাবুলারি ও কম্প্রিহেনশন — সমাধানসহ।",
        "Grammar, vocabulary & comprehension with solutions.",
        [
          ch("qb-ch-eng-grammar", "grammar", "qb-petrobangla-english", "গ্রামার", "Grammar", 1),
          ch("qb-ch-eng-vocab", "vocabulary", "qb-petrobangla-english", "ভোকাবুলারি", "Vocabulary", 2),
          ch("qb-ch-eng-comp", "comprehension", "qb-petrobangla-english", "কম্প্রিহেনশন", "Comprehension", 3),
        ]
      ),
      subj(
        "qb-petrobangla-cs",
        "computer-fundamentals",
        "petrobangla",
        "কম্পিউটার মৌলিক বিষয়",
        "Computer Fundamentals",
        "হার্ডওয়্যার, সফটওয়্যার, সংখ্যা পদ্ধতি ও অফিস ধারণা।",
        "Hardware, software, number systems and office concepts.",
        [
          ch("qb-ch-cs-hw", "hardware-software", "qb-petrobangla-cs", "হার্ডওয়্যার ও সফটওয়্যার", "Hardware & Software", 1),
          ch("qb-ch-cs-num", "number-systems", "qb-petrobangla-cs", "সংখ্যা পদ্ধতি", "Number Systems", 2),
          ch("qb-ch-cs-office", "office-internet", "qb-petrobangla-cs", "অফিস ও ইন্টারনেট", "Office & Internet", 3),
        ]
      ),
    ],
  },
  {
    id: "bank-it",
    slug: "bank-it",
    title: { bn: "ব্যাংক আইটি", en: "Bank IT" },
    blurb: {
      bn: "সহকারী প্রোগ্রামার / অফিসার (আইটি) প্রশ্ন-ব্যাংক — বিষয়ভিত্তিক সমাধান।",
      en: "Assistant Programmer / Officer (IT) question bank — subject-wise solutions.",
    },
    grad: "from-cyan-500 to-blue-600",
    subjects: [
      subj("qb-bank-it-tech", "it-technical", "bank-it", "আইটি টেকনিক্যাল", "IT Technical", "প্রোগ্রামিং, ডেটাবেস, নেটওয়ার্কিং।", "Programming, databases, networking.", [
        ch("qb-ch-bank-prog", "programming", "qb-bank-it-tech", "প্রোগ্রামিং", "Programming", 1),
        ch("qb-ch-bank-db", "dbms", "qb-bank-it-tech", "ডেটাবেস", "DBMS", 2),
      ]),
      subj("qb-bank-general", "general-part", "bank-it", "সাধারণ অংশ", "General Part", "বাংলা, ইংরেজি, গণিত, সাধারণ জ্ঞান।", "Bangla, English, math, GK.", [
        ch("qb-ch-bank-gen", "mixed-general", "qb-bank-general", "মিশ্র সাধারণ", "Mixed General", 1),
      ]),
    ],
  },
  {
    id: "bcs",
    slug: "bcs",
    title: { bn: "বিসিএস", en: "BCS" },
    blurb: {
      bn: "বিসিএস প্রিলি/লিখিত প্রশ্ন-ব্যাংক — বিষয়ভিত্তিক সমাধান।",
      en: "BCS preliminary/written question bank — subject-wise solutions.",
    },
    grad: "from-emerald-500 to-teal-600",
    subjects: [
      subj("qb-bcs-gk", "gk-bd-intl", "bcs", "সাধারণ জ্ঞান", "General Knowledge", "বাংলাদেশ, আন্তর্জাতিক, বিজ্ঞান।", "Bangladesh, international, science.", [
        ch("qb-ch-bcs-gk", "gk-mixed", "qb-bcs-gk", "মিশ্র সাধারণ জ্ঞান", "Mixed GK", 1),
      ]),
    ],
  },
  {
    id: "buet-pg",
    slug: "buet-pg",
    title: { bn: "বুয়েট পিজি", en: "BUET PG" },
    blurb: {
      bn: "বুয়েট স্নাতকোত্তর ভর্তি প্রশ্ন-ব্যাংক — গ্রুপভিত্তিক সমাধান।",
      en: "BUET postgraduate admission question bank — group-wise solutions.",
    },
    grad: "from-purple-500 to-pink-600",
    subjects: [
      subj("qb-buet-cse", "cse-group1", "buet-pg", "CSE গ্রুপ-১", "CSE Group-1", "১০টি টপিকের প্রশ্ন-ব্যাংক।", "Question bank for all 10 topics.", [
        ch("qb-ch-buet-cse", "group1-mixed", "qb-buet-cse", "গ্রুপ-১ মিশ্র", "Group-1 Mixed", 1),
      ]),
    ],
  },
];

export type QBFileType = "pdf" | "html" | "link";

export interface QBDocument {
  id: string;
  deptId: string;
  subjectId?: string;
  chapterId?: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: QBFileType;
  /** Original source PDF filename from Telegram Desktop (traceability). */
  sourcePdf?: string;
  sourcePages?: number;
  questionCount?: number;
  access?: "free" | "paid";
  priceBDT?: number;
  featured?: boolean;
  enabled?: boolean;
  createdAt?: number;
}

export const DEFAULT_QB_PREVIEW_PAGES = 3;

/**
 * Seed template — structural placeholders the admin fills by uploading the
 * real PDFs (Admin → Study → Question Bank). fileUrl "#" = awaiting upload.
 */
export const QB_SEED_DOCS: QBDocument[] = [
  {
    id: "qb-seed-petrobangla-gk",
    deptId: "petrobangla",
    subjectId: "qb-petrobangla-gk",
    title: "Petrobangla General Knowledge Question Bank Solutions",
    description:
      "150 GK Q&A auto-extracted from GK Sheet (9 pp) into chapter drafts — see extracted-gk.ts (RAW, proofread pending). " +
      "Note: the sheet is general Bangladesh-affairs GK (≈0 energy-sector Qs); Petrobangla energy/current-affairs content awaits OCR of the 140-page scan.",
    fileUrl: "#",
    fileType: "pdf",
    sourcePdf: "পেট্রোবাংলার_সাধারণ_গণিত_ও_সাধারণ_জ্ঞান_প্রশ্ন_সমাধান_.pdf + GK Sheet.pdf",
    sourcePages: 149,
    questionCount: 150,
    featured: true,
    enabled: true,
  },
  {
    id: "qb-seed-petrobangla-math",
    deptId: "petrobangla",
    subjectId: "qb-petrobangla-math",
    title: "Petrobangla General Math Question Bank with Answers",
    description:
      "Chapter-by-chapter math solutions (arithmetic, algebra, geometry & speed tricks) from the Petrobangla math section + Math Full With Answer (207 pages, Bijoy-encoded — needs Unicode conversion).",
    fileUrl: "#",
    fileType: "pdf",
    sourcePdf: "Math Full With Answer.pdf",
    sourcePages: 207,
    enabled: true,
  },
  {
    id: "qb-seed-petrobangla-bangla",
    deptId: "petrobangla",
    subjectId: "qb-petrobangla-bangla",
    title: "Petrobangla Bangla Question Bank with Solutions",
    description:
      "Bangla grammar + literature (A-to-Z) solutions. Source: বাংলা সাহিত্য এ টু জেড (25 pages, CamScanner scans — needs OCR).",
    fileUrl: "#",
    fileType: "pdf",
    sourcePdf: "বাংলা_সাহিত্য_এ_টু_জেড_httpst_meBCS_OtherJobs.pdf",
    sourcePages: 25,
    enabled: true,
  },
  {
    id: "qb-seed-petrobangla-english",
    deptId: "petrobangla",
    subjectId: "qb-petrobangla-english",
    title: "Petrobangla English Question Bank with Solutions",
    description:
      "English grammar, vocabulary & comprehension solutions. Supplementary vocab source available (16-page digest, extractable). Awaiting the Petrobangla English section upload.",
    fileUrl: "#",
    fileType: "pdf",
    sourcePdf: "Trump Repeated Threat.pdf (supplementary vocab)",
    sourcePages: 16,
    enabled: true,
  },
  {
    id: "qb-seed-petrobangla-cs",
    deptId: "petrobangla",
    subjectId: "qb-petrobangla-cs",
    title: "Petrobangla Computer Fundamentals Question Bank",
    description:
      "Hardware/software, number systems, office & internet — chapter by chapter. Source: Computer Fundamentals Bengali (6 pages, scanned — needs OCR).",
    fileUrl: "#",
    fileType: "pdf",
    sourcePdf: "Computer Fundamentals Bengali.pdf",
    sourcePages: 6,
    enabled: true,
  },
];

export function qbDeptBySlug(slug: string): QBDepartment | undefined {
  return QB_DEPARTMENTS.find((d) => d.slug === slug || d.id === slug);
}

export function qbSubjectById(id: string): QBSubject | undefined {
  for (const d of QB_DEPARTMENTS) {
    const s = d.subjects.find((s) => s.id === id || s.slug === id);
    if (s) return s;
  }
  return undefined;
}

export function qbChapterById(id: string): QBChapter | undefined {
  for (const d of QB_DEPARTMENTS) {
    for (const s of d.subjects) {
      const c = s.chapters.find((c) => c.id === id || c.slug === id);
      if (c) return c;
    }
  }
  return undefined;
}

/** Full catalog: seed template + admin docs, with visibility overrides. */
export function buildQuestionBankCatalog(
  overrides: Record<string, { enabled?: boolean }> = {},
  custom: QBDocument[] = []
): (QBDocument & { enabled: boolean })[] {
  return [...QB_SEED_DOCS, ...custom].map((d) => ({
    ...d,
    enabled: overrides[d.id]?.enabled ?? d.enabled ?? true,
  }));
}

export function qbCounts(docs: QBDocument[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const d of docs) {
    m[d.deptId] = (m[d.deptId] ?? 0) + 1;
    if (d.subjectId) m[d.subjectId] = (m[d.subjectId] ?? 0) + 1;
  }
  return m;
}
