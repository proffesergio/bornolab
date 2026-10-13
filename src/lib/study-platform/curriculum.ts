/** Bilingual taxonomy: IT-post list + 15-subject curriculum skeleton. All text original. */
import type { Chapter, Exam, ExamVersion, Post, Subject } from "./types";

export const LAWFUL_RESOURCES = {
  bpsc: "http://bpsc.gov.bd/",
  rfc791: "https://www.rfc-editor.org/rfc/rfc791",
  rfc8200: "https://www.rfc-editor.org/rfc/rfc8200",
  rfc9293: "https://datatracker.ietf.org/doc/html/rfc9293",
  nist145: "https://csrc.nist.gov/pubs/sp/800/145/final",
  owaspSqli: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
  mdnMethods: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods",
  mdnSop: "https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy",
  mitDijkstra: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-16-dijkstra/",
  openstaxInduct: "https://openstax.org/books/college-physics/pages/23-9-inductance",
  openstaxRlc: "https://openstax.org/books/college-physics/pages/23-12-rlc-series-ac-circuits",
} as const;

export const PLATFORM_POSTS: Post[] = [
  { id: "post-bcs-ict", slug: "bcs-ict-computer-science", title: { bn: "বিসিএস (ICT/কম্পিউটার বিজ্ঞান)", en: "BCS ICT & Computer Science" }, org: { bn: "বাংলাদেশ সরকারি কর্ম কমিশন", en: "Bangladesh Public Service Commission" }, grade: "9", track: "bcs-ict", eligibilityNote: { bn: "সংশ্লিষ্ট বিষয়ে স্নাতক; সাবজেক্ট কোড পরিবার 281/971 দেখুন", en: "Relevant graduation; see subject-code families 281/971" }, aliases: ["bcs", "বিসিএস", "281", "971", "ict cadre"], examIds: ["exam-bcs-ict-preli"], sourceNotes: { bn: "সিলেবাসের জন্য BPSC নোটিশ দেখুন", en: "See BPSC notices for syllabus" }, enabled: true },
  { id: "post-bank-ap", slug: "bank-assistant-programmer", title: { bn: "সহকারী প্রোগ্রামার (ব্যাংক)", en: "Assistant Programmer (Bank)" }, org: { bn: "বাংলাদেশ ব্যাংক / BSCS", en: "Bangladesh Bank / BSCS" }, grade: "9", track: "bank-it", eligibilityNote: { bn: "CSE/CS/SE/IT-এ স্নাতক", en: "Graduation in CSE/CS/SE/IT" }, aliases: ["assistant programmer", "সহকারী প্রোগ্রামার", "bb", "bscs", "bibm"], examIds: ["exam-bank-it-mcq", "exam-bank-it-written"], sourceNotes: { bn: "ব্যাংকের নিয়োগ বিজ্ঞপ্তি অনুসরণ করুন", en: "Follow bank recruitment circulars" }, enabled: true },
  { id: "post-bank-officer-it", slug: "bank-officer-it", title: { bn: "অফিসার (আইটি)", en: "Officer (IT)" }, org: { bn: "রাষ্ট্রায়ত্ত ব্যাংক / BSCS", en: "State-owned banks / BSCS" }, grade: "10", track: "bank-it", eligibilityNote: { bn: "আইটি/সিএসই পটভূমি", en: "IT/CSE background" }, aliases: ["officer it", "অফিসার আইটি"], examIds: ["exam-bank-it-mcq"], sourceNotes: { bn: "BSCS সমন্বিত সার্কুলার", en: "BSCS combined circulars" }, enabled: true },
  { id: "post-bank-ae", slug: "bank-assistant-engineer-it", title: { bn: "সহকারী প্রকৌশলী (আইটি)", en: "Assistant Engineer (IT)" }, org: { bn: "ব্যাংক / আর্থিক প্রতিষ্ঠান", en: "Banks / FIs" }, grade: "9", track: "bank-it", eligibilityNote: { bn: "প্রকৌশল ডিগ্রি (CSE/ECE)", en: "Engineering degree (CSE/ECE)" }, aliases: ["assistant engineer", "সহকারী প্রকৌশলী", "maintenance engineer"], examIds: ["exam-bank-it-mcq"], sourceNotes: { bn: "প্রতিষ্ঠানভেদে সিলেবাস ভিন্ন", en: "Syllabus varies by institution" }, enabled: true },
  { id: "post-btrc", slug: "btrc-assistant-director", title: { bn: "সহকারী পরিচালক (BTRC/টেলিকম)", en: "Assistant Director (BTRC/Telecom)" }, org: { bn: "BTRC / টেলিকম নিয়ন্ত্রক", en: "BTRC / telecom regulator" }, grade: "9", track: "telecom", eligibilityNote: { bn: "টেলিকম/ইইই/সিএসই", en: "Telecom/EEE/CSE" }, aliases: ["btrc", "বিটিআরসি", "telecom"], examIds: ["exam-btrc-tech"], sourceNotes: { bn: "BTRC সার্কুলার", en: "BTRC circulars" }, enabled: true },
  { id: "post-sparrso", slug: "sparrso-technical", title: { bn: "কারিগরি পদ (SPARRSO)", en: "Technical post (SPARRSO)" }, org: { bn: "SPARRSO", en: "SPARRSO" }, grade: "9", track: "research-ict", eligibilityNote: { bn: "বিজ্ঞান/প্রকৌশল পটভূমি", en: "Science/engineering background" }, aliases: ["sparrso", "স্পারসো"], examIds: ["exam-sparrso-tech"], sourceNotes: { bn: "SPARRSO বিজ্ঞপ্তি", en: "SPARRSO notices" }, enabled: true },
  { id: "post-bof", slug: "ordnance-factories-technical", title: { bn: "কারিগরি পদ (অর্ডন্যান্স ফ্যাক্টরি)", en: "Technical post (Ordnance Factories)" }, org: { bn: "বাংলাদেশ অর্ডন্যান্স ফ্যাক্টরিজ", en: "Bangladesh Ordnance Factories" }, grade: "9-10", track: "engineering", eligibilityNote: { bn: "CSE/EEE/ME", en: "CSE/EEE/ME" }, aliases: ["bof", "ordnance", "অর্ডন্যান্স"], examIds: ["exam-bof-tech"], sourceNotes: { bn: "BOF সার্কুলার", en: "BOF circulars" }, enabled: true },
  { id: "post-power", slug: "power-utility-ict", title: { bn: "আইসিটি পদ (বিদ্যুৎ/ইউটিলিটি)", en: "ICT post (Power/Utility)" }, org: { bn: "DESCO / বিদ্যুৎ খাত", en: "DESCO / power sector" }, grade: "9-10", track: "power-ict", eligibilityNote: { bn: "CSE/ECE/EEE", en: "CSE/ECE/EEE" }, aliases: ["desco", "ডেসকো", "power", "বিদ্যুৎ", "utility"], examIds: ["exam-power-ict"], sourceNotes: { bn: "ইউটিলিটি নিয়োগ বিজ্ঞপ্তি", en: "Utility recruitment notices" }, enabled: true },
  { id: "post-bksp", slug: "bksp-assistant-programmer", title: { bn: "সহকারী প্রোগ্রামার (BKSP)", en: "Assistant Programmer (BKSP)" }, org: { bn: "BKSP", en: "BKSP" }, grade: "9", track: "institutional-ict", eligibilityNote: { bn: "CSE/IT স্নাতক", en: "CSE/IT graduation" }, aliases: ["bksp", "বিকেএসপি"], examIds: ["exam-bksp-ict"], sourceNotes: { bn: "BKSP সার্কুলার", en: "BKSP circulars" }, enabled: true },
  { id: "post-railway", slug: "railway-telecom-computer", title: { bn: "কারিগরি পদ (রেলওয়ে টেলিকম/কম্পিউটার)", en: "Technical post (Railway Telecom/Computer)" }, org: { bn: "বাংলাদেশ রেলওয়ে", en: "Bangladesh Railway" }, grade: "10-13", track: "railway-tech", eligibilityNote: { bn: "টেলিকম/ইলেকট্রনিক্স/কম্পিউটার", en: "Telecom/electronics/computer" }, aliases: ["railway", "রেলওয়ে"], examIds: ["exam-railway-tech"], sourceNotes: { bn: "রেলওয়ে বিজ্ঞপ্তি", en: "Railway notices" }, enabled: true },
  { id: "post-lecturer", slug: "lecturer-ict-registration", title: { bn: "প্রভাষক/শিক্ষক নিবন্ধন (ICT)", en: "Lecturer/Teacher Registration (ICT)" }, org: { bn: "NTRCA / শিক্ষা", en: "NTRCA / education" }, grade: "9", track: "teacher-ict", eligibilityNote: { bn: "ICT/CS-এ স্নাতক + নিবন্ধন", en: "ICT/CS graduation + registration" }, aliases: ["ntrca", "lecturer", "প্রভাষক", "teacher"], examIds: ["exam-lecturer-ict"], sourceNotes: { bn: "NTRCA সিলেবাস", en: "NTRCA syllabus" }, enabled: true },
  { id: "post-noncadre", slug: "noncadre-cse-it-9-20", title: { bn: "নন-ক্যাডার CSE/IT (গ্রেড ৯–২০)", en: "Non-cadre CSE/IT (grades 9–20)" }, org: { bn: "সরকারি/স্বায়ত্তশাসিত প্রতিষ্ঠান", en: "Government/autonomous bodies" }, grade: "9-20", track: "non-cadre", eligibilityNote: { bn: "পদভেদে HSC/ডিপ্লোমা/স্নাতক", en: "HSC/diploma/graduation by post" }, aliases: ["non-cadre", "নন-ক্যাডার", "autonomous"], examIds: ["exam-noncadre-ict"], sourceNotes: { bn: "BPSC নন-ক্যাডার বিজ্ঞপ্তি", en: "BPSC non-cadre notices" }, enabled: true },
];

export const PLATFORM_EXAMS: Exam[] = [
  { id: "exam-bcs-ict-preli", slug: "bcs-ict-preli", postIds: ["post-bcs-ict"], family: { bn: "বিসিএস প্রিলিমিনারি (ICT অংশ)", en: "BCS Preliminary (ICT part)" }, enabled: true },
  { id: "exam-bank-it-mcq", slug: "bank-it-mcq", postIds: ["post-bank-ap", "post-bank-officer-it", "post-bank-ae"], family: { bn: "ব্যাংক আইটি MCQ", en: "Bank IT MCQ" }, enabled: true },
  { id: "exam-bank-it-written", slug: "bank-it-written", postIds: ["post-bank-ap"], family: { bn: "ব্যাংক টেকনিক্যাল লিখিত", en: "Bank technical written" }, enabled: true },
  { id: "exam-demo", slug: "demo-20q-15min", postIds: ["post-bank-ap", "post-bcs-ict"], family: { bn: "ডেমো অনুশীলন (২০ প্রশ্ন)", en: "Demo practice (20 questions)" }, enabled: true },
];

export const PLATFORM_VERSIONS: ExamVersion[] = [
  {
    id: "ver-demo-20q",
    slug: "demo-20q-15min-v1",
    examId: "exam-demo",
    postSlugs: ["bank-assistant-programmer", "bcs-ict-computer-science"],
    year: "demo",
    label: { bn: "ডেমো সংস্করণ — ২০ প্রশ্ন / ১৫ মিনিট", en: "Demo version — 20 questions / 15 minutes" },
    durationSec: 15 * 60,
    totalMarks: 20,
    sections: [
      { id: "sec-demo-bangla", title: { bn: "বাংলা", en: "Bangla" }, subjectIds: ["sub-bangla"], questionCount: 3, marks: 3 },
      { id: "sec-demo-english", title: { bn: "ইংরেজি", en: "English" }, subjectIds: ["sub-english"], questionCount: 3, marks: 3 },
      { id: "sec-demo-it", title: { bn: "কম্পিউটার/ICT", en: "Computer/ICT" }, subjectIds: ["sub-cs-fund", "sub-prog", "sub-dsa", "sub-dbms", "sub-net", "sub-os"], questionCount: 14, marks: 14 },
    ],
    policy: { marksPerQuestion: 1, negativeMark: 0.5, unansweredPenalty: 0 },
    leave: { allowLeave: true, leaveAction: "warn", message: { bn: "পরীক্ষা চলাকালে পেজ ছাড়লে সতর্কতা দেখানো হবে; সময় থামবে না।", en: "Leaving mid-exam shows a warning; the timer keeps running." } },
    shuffleQuestions: true,
    shuffleOptions: true,
    syllabusRef: "demo-fixture",
    sources: [{ url: "https://web.livemcq.com/demo-exam", title: "LiveMCQ public demo (UX reference only — no content copied)", retrievalDate: "2026-10-13", provenance: "public demo page observation", licenseOrPermission: "research-reference-only" }],
    demo: true,
    enabled: true,
  },
  {
    id: "ver-bank-it-v1",
    slug: "bank-it-mcq-v1",
    examId: "exam-bank-it-mcq",
    postSlugs: ["bank-assistant-programmer", "bank-officer-it"],
    label: { bn: "ব্যাংক আইটি MCQ — সংস্করণ ১", en: "Bank IT MCQ — version 1" },
    durationSec: 60 * 60,
    totalMarks: 80,
    sections: [
      { id: "sec-bank-bangla", title: { bn: "বাংলা", en: "Bangla" }, subjectIds: ["sub-bangla"], questionCount: 10, marks: 10 },
      { id: "sec-bank-english", title: { bn: "ইংরেজি", en: "English" }, subjectIds: ["sub-english"], questionCount: 10, marks: 10 },
      { id: "sec-bank-math", title: { bn: "গণিত", en: "Math" }, subjectIds: ["sub-math"], questionCount: 15, marks: 15 },
      { id: "sec-bank-it", title: { bn: "আইটি", en: "IT" }, subjectIds: ["sub-cs-fund", "sub-prog", "sub-dsa", "sub-dbms", "sub-net", "sub-os", "sub-sec"], questionCount: 45, marks: 45 },
    ],
    policy: { marksPerQuestion: 1, negativeMark: 0.25, unansweredPenalty: 0 },
    leave: { allowLeave: true, leaveAction: "warn", message: { bn: "রিফ্রেশ করলেও সময় বাড়বে না।", en: "Refreshing does not extend the deadline." } },
    shuffleQuestions: true,
    shuffleOptions: true,
    sources: [],
    enabled: true,
  },
];

export const PLATFORM_SUBJECTS: Subject[] = [
  { id: "sub-bangla", slug: "bangla", title: { bn: "বাংলা ভাষা ও সাহিত্য", en: "Bangla Language & Literature" }, overview: { bn: "ব্যাকরণ, বানান, সাহিত্য ও লেখা — চাকরির পরীক্ষার ভিত্তি।", en: "Grammar, spelling, literature and writing for job exams." }, aliases: ["bangla", "বাংলা", "ব্যাকরণ"], order: 1 },
  { id: "sub-english", slug: "english", title: { bn: "ইংরেজি ভাষা", en: "English Language" }, overview: { bn: "গ্রামার, ভোকাবুলারি, কম্প্রিহেনশন ও রাইটিং।", en: "Grammar, vocabulary, comprehension and writing." }, aliases: ["english", "ইংরেজি"], order: 2 },
  { id: "sub-gk", slug: "bangladesh-affairs-gk", title: { bn: "বাংলাদেশ বিষয়াবলি ও সাধারণ জ্ঞান", en: "Bangladesh Affairs & GK" }, overview: { bn: "মুক্তিযুদ্ধ, সংবিধান, অর্থনীতি, ডিজিটাল সরকার ও সাম্প্রতিক।", en: "Liberation war, constitution, economy, digital govt and current affairs." }, aliases: ["gk", "বাংলাদেশ", "current affairs"], order: 3 },
  { id: "sub-math", slug: "math-mental-ability", title: { bn: "গণিত ও মানসিক দক্ষতা", en: "Math & Mental Ability" }, overview: { bn: "পাটিগণিত, বীজগণিত, জ্যামিতি ও লজিক — দ্রুত সমাধান কৌশলসহ।", en: "Arithmetic, algebra, geometry and logic with speed tricks." }, aliases: ["math", "গণিত", "mental ability"], order: 4 },
  { id: "sub-cs-fund", slug: "computer-fundamentals", title: { bn: "কম্পিউটার মৌলিক বিষয়", en: "Computer Fundamentals" }, overview: { bn: "হার্ডওয়্যার, মেমরি, সংখ্যা পদ্ধতি, ক্লাউড ও অফিস ধারণা।", en: "Hardware, memory, number systems, cloud and office concepts." }, aliases: ["fundamentals", "কম্পিউটার"], order: 5 },
  { id: "sub-prog", slug: "programming-oop", title: { bn: "প্রোগ্রামিং ও OOP", en: "Programming & OOP" }, overview: { bn: "C/C++/Java/Python, OOP, কোড ট্রেসিং ও কমপ্লেক্সিটি।", en: "C/C++/Java/Python, OOP, tracing and complexity." }, aliases: ["programming", "প্রোগ্রামিং", "oop", "c", "java", "python"], order: 6 },
  { id: "sub-dsa", slug: "data-structures-algorithms", title: { bn: "ডেটা স্ট্রাকচার ও অ্যালগরিদম", en: "Data Structures & Algorithms" }, overview: { bn: "লিস্ট, ট্রি, গ্রাফ, সর্টিং, DP ও Big-O।", en: "Lists, trees, graphs, sorting, DP and Big-O." }, aliases: ["dsa", "ডেটা স্ট্রাকচার", "algorithm"], order: 7 },
  { id: "sub-dbms", slug: "dbms-sql", title: { bn: "ডেটাবেস ও SQL", en: "DBMS, SQL & Warehousing" }, overview: { bn: "রিলেশনাল মডেল, নরমালাইজেশন, JOIN, ACID, ইনডেক্স।", en: "Relational model, normalization, JOINs, ACID, indexes." }, aliases: ["dbms", "sql", "ডেটাবেজ"], order: 8 },
  { id: "sub-net", slug: "networking", title: { bn: "নেটওয়ার্কিং ও ডেটা কমিউনিকেশন", en: "Networking & Data Communication" }, overview: { bn: "OSI/TCP-IP, IPv4/IPv6, সাবনেটিং, TCP/UDP, TLS।", en: "OSI/TCP-IP, IPv4/IPv6, subnetting, TCP/UDP, TLS." }, aliases: ["network", "নেটওয়ার্ক", "subnet", "tcp", "ip"], order: 9 },
  { id: "sub-os", slug: "operating-systems", title: { bn: "অপারেটিং সিস্টেম", en: "Operating Systems" }, overview: { bn: "প্রসেস, শিডিউলিং, ডেডলক, মেমরি ও ফাইল সিস্টেম।", en: "Processes, scheduling, deadlocks, memory and files." }, aliases: ["os", "অপারেটিং"], order: 10 },
  { id: "sub-sec", slug: "cybersecurity", title: { bn: "সাইবার নিরাপত্তা", en: "Cybersecurity" }, overview: { bn: "CIA, ম্যালওয়্যার, ক্রিপ্টোগ্রাফি, OWASP, ফায়ারওয়াল।", en: "CIA, malware, crypto, OWASP, firewalls." }, aliases: ["security", "নিরাপত্তা", "cyber"], order: 11 },
  { id: "sub-se", slug: "software-engineering", title: { bn: "সফটওয়্যার ইঞ্জিনিয়ারিং", en: "Software Engineering & Testing" }, overview: { bn: "SDLC, Agile, UML, টেস্টিং স্তর ও রিলিজ।", en: "SDLC, Agile, UML, testing levels and release." }, aliases: ["sdlc", "testing", "agile"], order: 12 },
  { id: "sub-logic", slug: "digital-logic-arch", title: { bn: "ডিজিটাল লজিক ও মাইক্রোপ্রসেসর", en: "Digital Logic & Microprocessors" }, overview: { bn: "বুলিয়ান, K-map, ফ্লিপ-ফ্লপ, RISC/CISC, 8086।", en: "Boolean, K-maps, flip-flops, RISC/CISC, 8086." }, aliases: ["logic", "লজিক", "8086"], order: 13 },
  { id: "sub-ai", slug: "ai-ml", title: { bn: "কৃত্রিম বুদ্ধিমত্তা", en: "AI, ML & Emerging Tech" }, overview: { bn: "সার্চ, লার্নিং ধরন, KNN, নিউরাল নেট, দায়িত্বশীল AI।", en: "Search, learning types, KNN, neural nets, responsible AI." }, aliases: ["ai", "ml", "এআই"], order: 14 },
  { id: "sub-sci", slug: "general-science-telecom", title: { bn: "সাধারণ বিজ্ঞান ও টেলিকম বেসিক", en: "General Science & Telecom Basics" }, overview: { bn: "পদার্থ, ইলেকট্রনিক্স, ট্রান্সফরমার, ফাইবার ও অ্যান্টেনা।", en: "Physics, electronics, transformers, fiber and antennas." }, aliases: ["science", "বিজ্ঞান", "telecom"], order: 15 },
];

function chap(
  id: string, slug: string, subjectId: string,
  bn: string, en: string, overviewBn: string, overviewEn: string,
  aliases: string[], order: number,
  links: { labelBn: string; labelEn: string; url: string }[] = [],
): Chapter {
  return {
    id, slug, subjectId,
    title: { bn, en },
    overview: { bn: overviewBn, en: overviewEn },
    objectives: [
      { bn: "মূল ধারণা ব্যাখ্যা করতে পারা", en: "Explain the core concepts" },
      { bn: "পরীক্ষার প্রশ্ন সমাধান করতে পারা", en: "Solve exam-style questions" },
    ],
    keyTerms: [],
    workedExamples: [],
    commonTraps: [{ bn: "মুখস্থ উত্তরের উপর নির্ভর না করে যুক্তি যাচাই করুন", en: "Verify reasoning instead of memorizing printed keys" }],
    revisionNotes: [{ bn: "পরীক্ষার আগে সংক্ষিপ্ত নোট রিভাইজ করুন", en: "Revise the quick notes before the exam" }],
    resourceLinks: links.map((l) => ({ label: { bn: l.labelBn, en: l.labelEn }, url: l.url, license: "external-open" })),
    aliases, order,
  };
}

export const PLATFORM_CHAPTERS: Chapter[] = [
  chap("ch-bangla-spelling", "shuddha-banan", "sub-bangla", "শুদ্ধ বানান", "Correct spelling", "পরীক্ষায় বারবার আসা বানান-ভুলের নিয়ম।", "Frequently tested spelling rules.", ["বানান", "spelling"], 1),
  chap("ch-bangla-sandhi", "sandhi", "sub-bangla", "সন্ধি ও সন্ধি-বিচ্ছেদ", "Sandhi", "সন্ধির সূত্র ও বিচ্ছেদ-কৌশল।", "Sandhi rules and splitting.", ["সন্ধি", "sandhi"], 2),
  chap("ch-eng-tense", "tense-voice-narration", "sub-english", "Tense, Voice ও Narration", "Tense, Voice & Narration", "বাক্য-গঠনের ভুল এড়ানোর নিয়ম।", "Rules to avoid sentence errors.", ["tense", "voice"], 1),
  chap("ch-gk-lib", "liberation-war-constitution", "sub-gk", "মুক্তিযুদ্ধ ও সংবিধান", "Liberation War & Constitution", "ইতিহাস, সংবিধান ও রাষ্ট্র-কাঠামো।", "History, constitution and state structure.", ["মুক্তিযুদ্ধ", "সংবিধান"], 1),
  chap("ch-math-percent", "ratio-percentage-profit", "sub-math", "অনুপাত, শতকরা ও লাভ-ক্ষতি", "Ratio, Percentage & Profit", "ক্যালকুলেটর ছাড়া দ্রুত হিসাব।", "Fast calculator-free arithmetic.", ["শতকরা", "percentage"], 1),
  chap("ch-csf-number", "number-systems-encoding", "sub-cs-fund", "সংখ্যা পদ্ধতি ও এনকোডিং", "Number systems & Encoding", "বাইনারি, হেক্স, কমপ্লিমেন্ট ও UTF।", "Binary, hex, complements and UTF.", ["বাইনারি", "binary", "number system"], 1),
  chap("ch-prog-c", "c-basics-pointers", "sub-prog", "C মৌলিক ও পয়েন্টার", "C basics & Pointers", "টাইপ, অপারেটর, অ্যারে, স্ট্রিং ও পয়েন্টার।", "Types, operators, arrays, strings and pointers.", ["c", "pointer", "পয়েন্টার"], 1),
  chap("ch-prog-oop", "oop-inheritance-poly", "sub-prog", "OOP: ইনহেরিট্যান্স ও পলিমরফিজম", "OOP: Inheritance & Polymorphism", "ওভারলোডিং বনাম ওভাররাইডিং, ভার্চুয়াল।", "Overloading vs overriding, virtual dispatch.", ["oop", "inheritance", "পলিমরফিজম"], 2),
  chap("ch-dsa-sort", "sorting-searching-hash", "sub-dsa", "সর্টিং, সার্চিং ও হ্যাশিং", "Sorting, Searching & Hashing", "জটিলতাসহ তুলনা ও ট্রেস টেবিল।", "Comparisons with complexity and trace tables.", ["sorting", "সর্টিং"], 1),
  chap("ch-dsa-graph", "graphs-bfs-dfs-dijkstra", "sub-dsa", "গ্রাফ: BFS/DFS/ডাইকস্ট্রা", "Graphs: BFS/DFS/Dijkstra", "অ্যাডজাসেন্সি, shortest path ও MST ধারণা।", "Adjacency, shortest paths and MST ideas.", ["graph", "গ্রাফ", "dijkstra"], 2, [{ labelBn: "MIT ডাইকস্ট্রা লেকচার", labelEn: "MIT Dijkstra lecture", url: LAWFUL_RESOURCES.mitDijkstra }]),
  chap("ch-db-norm", "normalization-bcnf", "sub-dbms", "নরমালাইজেশন (1NF–BCNF)", "Normalization (1NF–BCNF)", "FD, ট্রানজিটিভ নির্ভরতা ও ডিকম্পোজিশন।", "FDs, transitive deps and decomposition.", ["normalization", "নরমালাইজেশন", "bcnf"], 1),
  chap("ch-db-sql", "joins-subquery-aggregate", "sub-dbms", "JOIN, সাবকোয়েরি ও GROUP BY", "JOINs, Subqueries & GROUP BY", "কার্টেসিয়ান বনাম JOIN, HAVING বনাম WHERE।", "Cartesian vs JOIN, HAVING vs WHERE.", ["join", "sql", "group by"], 2),
  chap("ch-net-ip", "ipv4-subnetting", "sub-net", "IPv4 ও সাবনেটিং", "IPv4 & Subnetting", "CIDR, VLSM, NAT, DHCP/DNS-সহ।", "CIDR, VLSM, NAT, DHCP/DNS.", ["subnet", "সাবনেট", "cidr", "ipv4"], 1, [
    { labelBn: "RFC 791 (IPv4)", labelEn: "RFC 791 (IPv4)", url: LAWFUL_RESOURCES.rfc791 },
    { labelBn: "RFC 8200 (IPv6)", labelEn: "RFC 8200 (IPv6)", url: LAWFUL_RESOURCES.rfc8200 },
  ]),
  chap("ch-net-tcp", "tcp-udp-http-tls", "sub-net", "TCP/UDP, HTTP ও TLS", "TCP/UDP, HTTP & TLS", "পোর্ট, হ্যান্ডশেক, HTTPS ধারণা।", "Ports, handshakes and HTTPS.", ["tcp", "udp", "http"], 2, [
    { labelBn: "RFC 9293 (TCP)", labelEn: "RFC 9293 (TCP)", url: LAWFUL_RESOURCES.rfc9293 },
    { labelBn: "MDN HTTP methods", labelEn: "MDN HTTP methods", url: LAWFUL_RESOURCES.mdnMethods },
  ]),
  chap("ch-os-deadlock", "deadlock-bankers", "sub-os", "ডেডলক ও Banker's অ্যালগরিদম", "Deadlocks & Banker's", "চার শর্ত, প্রতিরোধ ও এড়ানো।", "Four conditions, prevention and avoidance.", ["deadlock", "ডেডলক"], 1),
  chap("ch-sec-crypto", "crypto-hashing-pki", "sub-sec", "ক্রিপ্টোগ্রাফি ও PKI", "Crypto & PKI", "হ্যাশ, স্বাক্ষর, TLS ও পাসওয়ার্ড-নীতি।", "Hashes, signatures, TLS and password policy.", ["crypto", "hashing"], 1),
  chap("ch-sec-web", "sqli-xss-csrf", "sub-sec", "SQLi, XSS, CSRF প্রতিরোধ", "SQLi, XSS, CSRF prevention", "প্যারামিটারাইজড কোয়েরি ও নিরাপদ কুকি।", "Parameterized queries and secure cookies.", ["sqli", "xss", "owasp"], 2, [
    { labelBn: "OWASP SQLi প্রতিরোধ", labelEn: "OWASP SQLi prevention", url: LAWFUL_RESOURCES.owaspSqli },
    { labelBn: "MDN same-origin policy", labelEn: "MDN same-origin policy", url: LAWFUL_RESOURCES.mdnSop },
  ]),
  chap("ch-se-testing", "testing-levels", "sub-se", "টেস্টিং স্তর", "Testing levels", "ইউনিট→ইন্টিগ্রেশন→সিস্টেম→অ্যাকসেপ্ট্যান্স; black/white-box।", "Unit→integration→system→acceptance; black/white-box.", ["testing", "টেস্টিং"], 1),
  chap("ch-logic-kmap", "boolean-kmap-gates", "sub-logic", "বুলিয়ান ও K-map", "Boolean & K-maps", "সত্যক-সারণি, ইউনিভার্সাল গেট।", "Truth tables and universal gates.", ["kmap", "boolean"], 1),
  chap("ch-ai-overfit", "overfitting-evaluation", "sub-ai", "ওভারফিটিং ও মূল্যায়ন", "Overfitting & Evaluation", "রেগুলারাইজেশন, precision/recall/F1।", "Regularization, precision/recall/F1.", ["overfitting", "ওভারফিটিং"], 1),
  chap("ch-sci-power", "transformer-rlc-fiber", "sub-sci", "ট্রান্সফরমার, RLC ও ফাইবার", "Transformers, RLC & Fiber", "ইন্ডাকশন, RLC ও অপটিক্স বেসিক।", "Induction, RLC and optics basics.", ["transformer", "rlc", "fiber"], 1, [
    { labelBn: "OpenStax ইন্ডাকশন", labelEn: "OpenStax induction", url: LAWFUL_RESOURCES.openstaxInduct },
    { labelBn: "OpenStax RLC", labelEn: "OpenStax RLC", url: LAWFUL_RESOURCES.openstaxRlc },
  ]),
];

export function postBySlug(slug: string): Post | undefined {
  return PLATFORM_POSTS.find((p) => p.slug === slug);
}
export function chapterBySlug(slug: string): Chapter | undefined {
  return PLATFORM_CHAPTERS.find((c) => c.slug === slug);
}
export function subjectBySlug(slug: string): Subject | undefined {
  return PLATFORM_SUBJECTS.find((s) => s.slug === slug);
}
export function versionBySlug(slug: string): ExamVersion | undefined {
  return PLATFORM_VERSIONS.find((v) => v.slug === slug);
}
