/** Study-style long-form guides — the SEO content moat for AdSense approval and organic traffic. */

export interface GuideSection {
  heading: string;
  paras: string[];
  list?: string[];
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  keywords: string;
  category: string;
  minutes: number;
  updatedAt: string;
  intro: string[];
  sections: GuideSection[];
  faqs: GuideFaq[];
  /** Internal links to tools — every guide funnels readers into the product. */
  ctas: { label: string; href: string; desc: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: "bijoy-vs-unicode",
    title: "Bijoy vs Unicode: Why Your Bangla Text Breaks (and How to Fix It)",
    description:
      "Bijoy (ANSI) fonts reuse English letter slots for Bangla glyphs — that is why Bijoy text looks like gibberish without SutonnyMJ. Learn how the encoding works, when to use each, and how to convert losslessly.",
    keywords: "bijoy vs unicode, bijoy to unicode, unicode to bijoy, sutonnymj, bijoy font problem",
    category: "Encoding",
    minutes: 8,
    updatedAt: "2026-09-30",
    intro: [
      "Paste Bijoy text into the wrong place and you get something like “AvBgvov”— readable to no one. This is not corruption: it is Bijoy (ANSI) encoding doing exactly what it was designed to do. This guide explains the two Bangla encodings, why they clash, and how to move text between them without losing a single kar or juktoborno.",
      "If you just need the fix right now, our free Unicode ⇆ Bijoy converter handles pre-kar, reph, ya-fala and ligatures correctly — no signup, files never leave your browser.",
    ],
    sections: [
      {
        heading: "The 30-second version",
        paras: [
          "Unicode assigns every Bangla character its own permanent code point (অ is always U+0985). Bijoy (ANSI) fonts like SutonnyMJ instead reuse the 256 Latin slots: the glyph that looks like “ক” is stored as a Latin letter code. Open that file without the Bijoy font installed and the system renders the raw Latin codes — gibberish.",
        ],
        list: [
          "Unicode = one code per character, works everywhere, searchable, future-proof.",
          "Bijoy = Latin slots remapped to Bangla glyphs, needs SutonnyMJ installed, legacy but still dominant in Bangladeshi newspapers and DTP.",
          "Converting = remapping codes, not retyping — a correct engine must reorder pre-kars (ি, ে, ৈ), reph and ya-fala.",
        ],
      },
      {
        heading: "Why Bijoy still rules Bangladeshi newsrooms",
        paras: [
          "Decades of archives, trained operators, and print pipelines built around Bijoy Keyboard mean most newspapers still produce in SutonnyMJ. Migration happens article by article — which is exactly why batch conversion matters more than single-paragraph toys.",
          "Government offices, meanwhile, standardized on Unicode (Nikosh) years ago. So the same document often lives in both worlds: Bijoy at the press, Unicode at the ministry.",
        ],
      },
      {
        heading: "The conversion traps that eat your text",
        paras: [
          "Naive find-and-replace converters corrupt Bangla because the two encodings order some marks differently. Watch for these four:",
        ],
        list: [
          "Pre-kar reorder: ি/ে/ৈ are typed after the consonant in Unicode but stored before it in Bijoy — কি becomes wK, not Kw.",
          "Reph: র্ + consonant collapses into a single ©-family code in Bijoy.",
          "Ya-fala and hasanta: য-ফলা (্য) and explicit hasanta (্) have dedicated Bijoy codes (¨ and &).",
          "Ligatures: ক্ষ maps to a single glyph (ÿ). Split it and the word breaks.",
        ],
      },
      {
        heading: "When to use which (practical rules)",
        paras: [
          "Writing something new? Use Unicode, always — Google Docs, Word with Noto/Hind Siliguri, the web, ebooks. Sending copy to a newspaper DTP desk? Ask first; many still want SutonnyMJ Bijoy. Archiving? Convert Bijoy archives to Unicode so they become searchable.",
        ],
      },
    ],
    faqs: [
      {
        q: "Why does my Bijoy text show as English letters?",
        a: "Because no Bijoy font (SutonnyMJ) is installed where you are reading it. The file stores Latin codes that only render as Bangla through the Bijoy font. Install SutonnyMJ, or convert the text to Unicode.",
      },
      {
        q: "Is conversion lossless?",
        a: "With a correct engine, yes for all standard text — pre-kar, reph, ya-fala, hasanta and common ligatures round-trip exactly. Our converter is built around a reversible greedy tokenizer for this reason.",
      },
      {
        q: "Can I convert a whole Word file, not just pasted text?",
        a: "Yes — the converter page accepts .docx batch conversion, preserving paragraphs while remapping runs. Font-aware batch pipelines are on our automation roadmap.",
      },
    ],
    ctas: [
      { label: "Open the Unicode ⇆ Bijoy converter", href: "/bijoy-unicode-converter", desc: "Newsroom-grade engine, ghost preview, one-click copy." },
      { label: "Browse Bangla fonts", href: "/fonts", desc: "Unicode and ANSI faces with live preview." },
    ],
  },
  {
    slug: "type-bangla-computer",
    title: "How to Type Bangla on Computer: Unicode, Bijoy & Phonetic Keyboards",
    description:
      "Three ways to type Bangla — Unicode layouts (Avro, Bijoy Unicode mode), legacy Bijoy ANSI for newsrooms, and phonetic (English-to-Bangla) typing. Setup steps for Windows, Mac and the web.",
    keywords: "how to type bangla, bangla keyboard, avro keyboard, bijoy keyboard, bangla typing",
    category: "Typing",
    minutes: 7,
    updatedAt: "2026-09-30",
    intro: [
      "There are three different answers to “how do I type Bangla” and they produce mutually incompatible text. Pick the wrong one for your destination and your document arrives as mojibake. Here is how to choose — and set each up in minutes.",
    ],
    sections: [
      {
        heading: "Option 1 — Unicode typing (recommended for almost everyone)",
        paras: [
          "Unicode output works in Word, browsers, phones and PDFs without special fonts. On Windows install Avro Keyboard (free) and type phonetically — “ami” becomes আমি. macOS ships Bangla input sources under System Settings → Keyboard → Text Input. Android (Gboard) and iOS both include বাংলা keyboards out of the box.",
        ],
        list: [
          "Best for: documents, email, web, ebooks, anything new.",
          "Fonts to pair: Hind Siliguri, Noto Sans Bengali, Tiro Bangla, Nikosh (government work).",
          "Check your output: if it renders correctly with no special font installed, it is Unicode.",
        ],
      },
      {
        heading: "Option 2 — Bijoy ANSI (for newsroom/DTP desks)",
        paras: [
          "Bijoy Bayanno (paid, Bijoy Ekushe) in ANSI mode outputs SutonnyMJ codes for legacy print pipelines. Only use this when the receiving desk explicitly asks for Bijoy — otherwise you are creating future conversion work.",
        ],
      },
      {
        heading: "Option 3 — Phonetic web tools (quick jobs, no install)",
        paras: [
          "For a paragraph or two on a borrowed computer, phonetic web converters beat installing software. Type in Latin letters, copy Unicode Bangla out. For longer or sensitive documents prefer an offline/in-browser tool so text never uploads.",
        ],
      },
      {
        heading: "How to tell what you already have",
        paras: [
          "Select the text, set the font to a plain Latin font like Arial, and look: readable Bangla means Unicode; Latin gibberish means Bijoy ANSI. Convert accordingly instead of retyping — retyping a 50-page archive is how people lose weeks.",
        ],
      },
    ],
    faqs: [
      {
        q: "Avro vs Bijoy keyboard — which should I learn?",
        a: "Avro (free, phonetic + Unicode output) for general use. Bijoy only if your job — typically newspaper DTP — requires ANSI output.",
      },
      {
        q: "Why do my Bangla PDFs break when copied?",
        a: "Usually the PDF embedded a Bijoy/ANSI font without a proper Unicode map, or glyphs were converted to outlines. Converting the source to Unicode before generating the PDF prevents this.",
      },
    ],
    ctas: [
      { label: "Convert existing Bijoy text", href: "/bijoy-unicode-converter", desc: "Paste ANSI gibberish, get clean Unicode." },
      { label: "Get Unicode Bangla fonts", href: "/fonts", desc: "Free faces with live preview." },
    ],
  },
  {
    slug: "bangla-fonts-guide",
    title: "Bangla Fonts Guide: Unicode vs ANSI, and Which Font for Which Job",
    description:
      "Hind Siliguri, Noto Sans Bengali, Tiro Bangla, Nikosh, Kalpurush, SutonnyMJ — what each Bangla font is for, Unicode vs ANSI explained, and how to install and use them in Word and design tools.",
    keywords: "bangla fonts download, unicode bangla font, sutonnymj download, hind siliguri, noto sans bengali, nikosh font",
    category: "Fonts",
    minutes: 9,
    updatedAt: "2026-09-30",
    intro: [
      "Downloading a random “Bangla font” is how documents break: an ANSI font in a Unicode workflow (or vice versa) produces gibberish that looks like a conversion failure but is really a font mismatch. This guide maps the major faces to their jobs.",
    ],
    sections: [
      {
        heading: "Unicode workhorses (use these for new work)",
        paras: ["These ship proper OpenType shaping for kar and juktoborno and work everywhere with no special setup:"],
        list: [
          "Hind Siliguri — clean sans, great on screen and in UI-adjacent documents.",
          "Noto Sans Bengali — Google's neutral default; pairs with Noto Sans for mixed English-Bangla.",
          "Tiro Bangla — elegant serif for books and long-form reading.",
          "Nikosh — the government standard; mandatory for official correspondence.",
          "Baloo Da 2 — friendly display face for headlines, posters and thumbnails.",
          "Kalpurush / SolaimanLipi — beloved print classics, now in Unicode editions.",
        ],
      },
      {
        heading: "ANSI legacy (use only when asked)",
        paras: [
          "SutonnyMJ is the Bijoy newsroom standard; Boishakhi and Lekhani cover stylistic ANSI niches. These only render correctly with the exact font installed — never mix them into Unicode documents.",
        ],
      },
      {
        heading: "Installing and using fonts",
        paras: [
          "Windows: right-click the .ttf → Install (or Install for all users for Word). macOS: double-click → Font Book → Install. In Word, set both the Asian/CS font and the Latin font slots for mixed documents, or English runs fall back to an ugly default. In design tools (Photoshop, Illustrator), prefer the Unicode editions and keep shaping engines on (World-Ready Composer in legacy Photoshop).",
        ],
      },
      {
        heading: "The golden rule",
        paras: [
          "Match font encoding to text encoding: Unicode text + Unicode font, ANSI text + ANSI font. When in doubt, convert the text to Unicode first — then any modern font just works.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which Bangla font looks most professional for a CV?",
        a: "Hind Siliguri or Noto Sans Bengali at 11–12pt — clean, universally readable, and they survive PDF export and applicant-tracking parsers.",
      },
      {
        q: "Why does my document show boxes (tofu)?",
        a: "The active font lacks those glyphs — usually an ANSI font meeting Unicode text or vice versa. Switch to a matching Unicode face like Noto Sans Bengali.",
      },
      {
        q: "Is SutonnyMJ free?",
        a: "SutonnyMJ ships with the paid Bijoy ecosystem. For free work, use Unicode faces; convert legacy text with our converter instead of hunting ANSI fonts.",
      },
    ],
    ctas: [
      { label: "Browse the font directory", href: "/fonts", desc: "15+ faces, live preview, size slider, one-click download." },
      { label: "Fix mismatched text", href: "/bijoy-unicode-converter", desc: "Convert ANSI gibberish to clean Unicode." },
    ],
  },
  {
    slug: "pdf-to-docx-bangla",
    title: "PDF to Word for Bangla Documents (Without Wrecking the Layout)",
    description:
      "Convert PDF to editable DOCX while keeping Bangla text, tables and reading order intact. Why most converters produce text-box soup, how to handle scanned pages, and a free in-browser workflow.",
    keywords: "pdf to docx, pdf to word bangla, convert pdf to editable word, scanned pdf ocr bangla",
    category: "PDF",
    minutes: 7,
    updatedAt: "2026-09-30",
    intro: [
      "Most PDF-to-Word tools shatter Bangla documents into hundreds of absolutely-positioned text boxes — technically editable, practically useless. The difference between soup and a clean document is whether the converter understands text flow. Here is how to get clean output.",
    ],
    sections: [
      {
        heading: "Why PDFs resist clean conversion",
        paras: [
          "PDF is a print format: it stores positioned glyphs, not paragraphs. A good converter must re-infer reading order, merge glyph runs into lines, lines into paragraphs, and detect tables — all before Bangla shaping (kar, juktoborno) even enters the picture.",
        ],
      },
      {
        heading: "A workflow that preserves layout",
        paras: ["Follow this order and 90% of documents come out clean:"],
        list: [
          "Start from a text-based PDF (selectable text). Export to flowing paragraphs, not text boxes.",
          "Fix reading order first — two-column layouts and headers/footers confuse naive tools.",
          "Keep tables as tables: verify header rows repeat and merged cells survive.",
          "Set a Unicode Bangla font (Nikosh/Hind Siliguri) as the document default before editing.",
          "Scanned/image PDFs are a different job — they need OCR (Tesseract with ben+eng data) before any of the above applies.",
        ],
      },
      {
        heading: "DOCX back to PDF",
        paras: [
          "For everyday use, Word's own export is fine. For print fidelity with Bangla fonts, use a print-flow export (or high-fidelity pipeline) so kar positioning survives exactly as composed.",
        ],
      },
    ],
    faqs: [
      {
        q: "My converted DOCX has text in boxes I can't reflow. Why?",
        a: "The tool preserved absolute PDF positioning instead of rebuilding flow. Re-convert with a flow-based exporter that emits real paragraphs.",
      },
      {
        q: "Can I convert a scanned Bangla PDF?",
        a: "Yes, but it needs OCR first — the PDF contains images, not text. Run Tesseract with Bengali + English data, then convert the OCR result.",
      },
      {
        q: "Is uploading my document to a converter safe?",
        a: "Prefer tools that process in your browser (nothing uploads). Server-side conversion is only justified for huge files — and then check the privacy policy.",
      },
    ],
    ctas: [
      { label: "Try the PDF ⇆ DOCX translator", href: "/translate", desc: "Clean paragraphs, tables preserved, runs in your browser." },
      { label: "Split large PDFs first", href: "/split", desc: "Extract just the pages you need." },
    ],
  },
  {
    slug: "pdf-split-merge-guide",
    title: "How to Split and Merge PDFs: Ranges, Page Selection & Export Formats",
    description:
      "Split admission circulars, merge application packets, and export pages as PDF, images or DOCX. Page-range syntax (1-3, 5, 7-12) explained with real workflows for students and offices.",
    keywords: "split pdf, merge pdf, pdf page range, pdf to jpg, combine pdf files",
    category: "PDF",
    minutes: 6,
    updatedAt: "2026-09-30",
    intro: [
      "Admission circular is 40 pages but you need pages 7–12. Five certificates must become one application file. These are five-minute jobs with the right approach — and hours of printing, scanning and WhatsApp-forwarding without it.",
    ],
    sections: [
      {
        heading: "Splitting: the range syntax",
        paras: [
          "Professional splitters accept compact ranges: 1-3 grabs the first three pages, 5 adds page five, 7-12 takes a span — so “1-3, 5, 7-12” describes a whole extraction in one line. Always preview thumbnails with checkboxes before exporting; off-by-one page errors are the classic mistake.",
        ],
      },
      {
        heading: "Merging: order is everything",
        paras: [
          "Merge in the order the reader needs: application form, certificates in chronological order, NID, photo. Reorder before combining — renaming files “01-form, 02-ssc…” beforehand saves confusion. Keep the final file under portal limits (usually 2–10 MB); compress images first if needed.",
        ],
      },
      {
        heading: "Choosing export formats",
        paras: ["Match the format to the destination:"],
        list: [
          "PDF — applications, archives, anything official.",
          "JPG/PNG (zip) — photo uploads, online forms that only take images.",
          "DOCX — when the extracted pages must be edited further.",
        ],
      },
    ],
    faqs: [
      {
        q: "Will splitting reduce quality?",
        a: "No — page extraction copies pages losslessly. Quality only changes if you re-compress or rasterize to images.",
      },
      {
        q: "Is there a file-size limit?",
        a: "Browser-based tools comfortably handle tens of megabytes; very large files (100MB+) belong in a server-side pipeline.",
      },
    ],
    ctas: [
      { label: "Open the PDF splitter", href: "/split", desc: "Thumbnails, ranges, PDF/image/DOCX export." },
      { label: "Open the PDF merger", href: "/merge", desc: "Combine files in custom order." },
    ],
  },
  {
    slug: "buet-msc-admission-guide",
    title: "BUET M.Sc. Admission Guide: Groups, Syllabus & 3-Day Prep Plan",
    description:
      "How BUET M.Sc. (CSE) admission works — Group 1 vs other groups, the 10 topics examiners love, past-paper patterns, and a focused 3-day study plan with free practice materials.",
    keywords: "buet msc admission, buet msc cse syllabus, buet postgraduate admission, buet msc preparation",
    category: "Admission",
    minutes: 10,
    updatedAt: "2026-09-30",
    intro: [
      "BUET's M.Sc. admission test rewards focused revision over months of unfocused reading: the same topic patterns — signed/unsigned traps in C++, pumping-lemma proofs, subnetting drills, Bayes theorem — recur year after year. This guide maps the exam and gives you a 3-day plan plus free practice material.",
    ],
    sections: [
      {
        heading: "How the exam is structured",
        paras: [
          "Applicants choose groups covering different topic sets. Group 1 (core systems) spans Programming, Discrete Math, DSA, Compiler & Theory of Computation, Database, Networks & Security, Software Engineering, Digital Logic, Architecture & OS, and AI/ML. Questions mix MCQ (concepts + output prediction) with written problems (proofs, constructions, SQL, subnetting).",
        ],
      },
      {
        heading: "Patterns from past papers",
        paras: [" Examiners have favorite traps — drill these until they are reflexes:"],
        list: [
          "Programming: mixed signed/unsigned comparisons, Java string-pool equality, undefined-behavior expressions.",
          "Theory: pumping-lemma non-regularity proofs, parity-tracker DFA construction, LL(1) table filling.",
          "Networks: /27-style subnetting arithmetic, DHCP/SYN attack mechanics, RSA toy examples.",
          "Math: pigeonhole setups, Bayes with low prevalence, geometric run lengths.",
          "OS/Arch: pipeline speedup math, FIFO vs LRU vs Optimal faults, deadlock conditions.",
        ],
      },
      {
        heading: "The 3-day plan",
        paras: [
          "Day 1 — highest-frequency core: DSA, Programming, TOC/Compiler, Discrete & Stats; evening flashcard self-test. Day 2 — applied topics: Database, Networks & Security, Software Engineering, AI/ML; redo all review-marked cards. Day 3 — hardware + OS in the morning, then a timed mock (50 MCQs in 50 minutes, 10 written answers in an hour), and a final skim of seen-tagged cards.",
        ],
      },
    ],
    faqs: [
      {
        q: "How competitive is BUET M.Sc. CSE admission?",
        a: "Very — seats are limited and applicants come from across the country. But the syllabus is stable and past-paper patterns repeat, so structured practice beats raw study hours.",
      },
      {
        q: "Calculator allowed?",
        a: "Typically a non-programmable calculator. Confirm against the current admission notice — rules change between sessions.",
      },
      {
        q: "Where can I practice for free?",
        a: "Our Study Hub hosts the full Group-1 prep guide as a readable PDF plus an interactive module with flashcards and exam mode — no login needed to practice.",
      },
    ],
    ctas: [
      { label: "Open the Study Hub", href: "/study", desc: "BUET prep guides + interactive practice." },
      { label: "Practice step by step", href: "/study#practice", desc: "Flashcards and exam mode with progress." },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
