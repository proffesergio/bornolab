/** Original seed bank — paraphrased learner items. No third-party wording copied. */
import type { Chapter, Question } from "./types";
import { LAWFUL_RESOURCES, PLATFORM_CHAPTERS } from "./curriculum";

let n = 0;
function q(
  base: Partial<Question> & { bnStem: string; enStem: string; bnOpts: string[]; enOpts: string[]; answer: number; bnExp: string; enExp: string },
): Question {
  n += 1;
  const id = base.id ?? `seed-q-${String(n).padStart(3, "0")}`;
  const now = Date.now();
  const options = base.bnOpts.map((bn, i) => ({
    id: `${id}-o${i + 1}`,
    order: i + 1,
    locale: { bn, en: base.enOpts[i] ?? bn } as Record<"bn" | "en", string>,
  }));
  return {
    id,
    stableId: id,
    type: base.type ?? "mcq",
    difficulty: base.difficulty ?? "medium",
    cognitive: base.cognitive ?? "recall",
    chapterId: base.chapterId ?? "ch-net-ip",
    topicId: base.topicId,
    postSlugs: base.postSlugs ?? ["bank-assistant-programmer"],
    examVersionIds: base.examVersionIds ?? ["ver-demo-20q"],
    tags: base.tags ?? [],
    locale: {
      bn: { stem: base.bnStem, options: base.bnOpts, explanation: base.bnExp },
      en: { stem: base.enStem, options: base.enOpts, explanation: base.enExp },
    },
    options,
    key: {
      optionId: options[base.answer]?.id ?? options[0].id,
      status: base.key?.status ?? "approved",
      confidence: base.key?.confidence ?? "high",
      checkedBy: "editorial-seed",
      checkedAt: new Date(now).toISOString(),
    },
    citations: base.citations ?? [],
    license: base.license ?? { status: "original", note: "Original BornoLab stem, distractors and explanation." },
    status: base.status ?? "published",
    version: 1,
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}

const BPSC = { url: LAWFUL_RESOURCES.bpsc, title: "Bangladesh Public Service Commission — notices & syllabi", retrievalDate: "2026-10-13", provenance: "official notices", licenseOrPermission: "link-only" };
const RFC791 = { url: LAWFUL_RESOURCES.rfc791, title: "IETF RFC 791 — Internet Protocol (IPv4)", retrievalDate: "2026-10-13", provenance: "IETF", licenseOrPermission: "link-only" };
const RFC8200 = { url: LAWFUL_RESOURCES.rfc8200, title: "IETF RFC 8200 — IPv6", retrievalDate: "2026-10-13", provenance: "IETF", licenseOrPermission: "link-only" };
const RFC9293 = { url: LAWFUL_RESOURCES.rfc9293, title: "IETF RFC 9293 — TCP", retrievalDate: "2026-10-13", provenance: "IETF", licenseOrPermission: "link-only" };
const OWASP = { url: LAWFUL_RESOURCES.owaspSqli, title: "OWASP SQL Injection Prevention Cheat Sheet", retrievalDate: "2026-10-13", provenance: "OWASP", licenseOrPermission: "link-only" };
const MDN_M = { url: LAWFUL_RESOURCES.mdnMethods, title: "MDN — HTTP methods", retrievalDate: "2026-10-13", provenance: "MDN", licenseOrPermission: "link-only" };
const MIT_D = { url: LAWFUL_RESOURCES.mitDijkstra, title: "MIT OCW — Dijkstra lecture", retrievalDate: "2026-10-13", provenance: "MIT OCW", licenseOrPermission: "link-only" };
const OSX_I = { url: LAWFUL_RESOURCES.openstaxInduct, title: "OpenStax College Physics — Inductance", retrievalDate: "2026-10-13", provenance: "OpenStax", licenseOrPermission: "link-only" };

export const SEED_QUESTIONS: Question[] = [
  q({ id: "seed-subnet-01", chapterId: "ch-net-ip", difficulty: "medium", cognitive: "apply", tags: ["subnetting", "cidr"], bnStem: "192.168.10.45/27 নেটওয়ার্কে নেটওয়ার্ক অ্যাড্রেস, ব্রডকাস্ট ও ব্যবহারযোগ্য হোস্ট সংখ্যা কত?", enStem: "For 192.168.10.45/27, what are the network, broadcast and usable host count?", bnOpts: ["নেটওয়ার্ক .32, ব্রডকাস্ট .63, ৩০টি হোস্ট", "নেটওয়ার্ক .0, ব্রডকাস্ট .31, ৩০টি হোস্ট", "নেটওয়ার্ক .32, ব্রডকাস্ট .62, ৩২টি হোস্ট", "নেটওয়ার্ক .45, ব্রডকাস্ট .63, ৬২টি হোস্ট"], enOpts: ["Network .32, broadcast .63, 30 hosts", "Network .0, broadcast .31, 30 hosts", "Network .32, broadcast .62, 32 hosts", "Network .45, broadcast .63, 62 hosts"], answer: 0, bnExp: "ব্লক = 256−224 = 32; 45-এর নিচে 32-এর গুণিতক .32; ব্রডকাস্ট = পরের ব্লক −1 = .63; হোস্ট = 2^5−2 = 30।", enExp: "Block = 256−224 = 32; multiple of 32 at/below 45 is .32; broadcast = next block −1 = .63; usable = 2^5−2 = 30.", citations: [RFC791] }),
  q({ id: "seed-subnet-02", chapterId: "ch-net-ip", difficulty: "easy", cognitive: "recall", tags: ["cidr"], bnStem: "/26 প্রিফিক্সে ব্যবহারযোগ্য হোস্ট কয়টি?", enStem: "How many usable hosts in a /26?", bnOpts: ["৬২", "৬৪", "৩০", "১২৬"], enOpts: ["62", "64", "30", "126"], answer: 0, bnExp: "2^6 − 2 = 62 (নেটওয়ার্ক ও ব্রডকাস্ট বাদ)।", enExp: "2^6 − 2 = 62 (minus network and broadcast).", citations: [RFC791] }),
  q({ id: "seed-ipv6-01", chapterId: "ch-net-ip", difficulty: "easy", cognitive: "recall", tags: ["ipv6"], bnStem: "IPv6 অ্যাড্রেসের দৈর্ঘ্য কত বিট?", enStem: "What is the length of an IPv6 address?", bnOpts: ["১২৮ বিট", "৬৪ বিট", "৩২ বিট", "৪৮ বিট"], enOpts: ["128 bits", "64 bits", "32 bits", "48 bits"], answer: 0, bnExp: "IPv6 = 128 বিট; IPv4 = 32 বিট।", enExp: "IPv6 is 128 bits; IPv4 is 32 bits.", citations: [RFC8200] }),
  q({ id: "seed-tcp-01", chapterId: "ch-net-tcp", difficulty: "medium", cognitive: "recall", tags: ["tcp"], bnStem: "HTTPS সাধারণত কোন পোর্ট ও প্রোটোকল ব্যবহার করে?", enStem: "Which port and protocol does HTTPS normally use?", bnOpts: ["443 / TCP", "80 / UDP", "25 / TCP", "53 / UDP"], enOpts: ["443 / TCP", "80 / UDP", "25 / TCP", "53 / UDP"], answer: 0, bnExp: "HTTPS = HTTP over TLS, TCP 443; HTTP = TCP 80।", enExp: "HTTPS is HTTP over TLS on TCP 443; plain HTTP is TCP 80.", citations: [RFC9293, MDN_M] }),
  q({ id: "seed-http-01", chapterId: "ch-net-tcp", difficulty: "medium", cognitive: "analyze", tags: ["http", "methods"], bnStem: "কোন HTTP মেথড নিরাপদ (safe) ও idempotent — বারবার পাঠালেও রিসোর্স বদলায় না?", enStem: "Which HTTP method is safe and idempotent — repeats do not change the resource?", bnOpts: ["GET", "POST", "PATCH", "CONNECT"], enOpts: ["GET", "POST", "PATCH", "CONNECT"], answer: 0, bnExp: "GET রিসোর্স পড়ে, বদলায় না; POST সাধারণত idempotent নয়। নিরাপত্তা ≠ এনক্রিপশন — POST স্বয়ংক্রিয়ভাবে ‘নিরাপদ’ নয়।", enExp: "GET reads without changing state; POST is generally not idempotent. POST is not automatically 'more secure' than GET.", citations: [MDN_M] }),
  q({ id: "seed-db-norm-01", chapterId: "ch-db-norm", difficulty: "medium", cognitive: "apply", tags: ["normalization"], bnStem: "R(A,B,C), FD: A→B, B→C। কোন নরমাল ফর্মে আছে এবং কীভাবে ভাঙবেন?", enStem: "R(A,B,C) with A→B, B→C. Which normal form, and how to decompose?", bnOpts: ["2NF, কিন্তু 3NF নয়; R1(A,B), R2(B,C)", "3NF-এ আছে; ভাঙার দরকার নেই", "1NF-ও নয়; R1(A), R2(B,C)", "BCNF-এ আছে"], enOpts: ["In 2NF but not 3NF; decompose to R1(A,B), R2(B,C)", "Already in 3NF; no split needed", "Not even 1NF; split to R1(A), R2(B,C)", "Already in BCNF"], answer: 0, bnExp: "B→C ট্রানজিটিভ নির্ভরতা (non-prime C); 3NF শর্ত ভাঙে।", enExp: "B→C is a transitive dependency on non-prime C, violating 3NF.", citations: [] }),
  q({ id: "seed-db-sql-01", chapterId: "ch-db-sql", difficulty: "easy", cognitive: "apply", tags: ["joins"], bnStem: "student-এ ৫ সারি, takes-এ ১৫ সারি। WHERE ছাড়া `SELECT * FROM student, takes` কয় সারি দেবে?", enStem: "student has 5 rows, takes has 15. How many rows does `SELECT * FROM student, takes` return with no WHERE?", bnOpts: ["৭৫", "২০", "১৫", "৫"], enOpts: ["75", "20", "15", "5"], answer: 0, bnExp: "কমা-জয়েন = কার্টেসিয়ান গুণ: 5×15। JOIN শর্তে ছেঁকে নিতে হয়।", enExp: "Comma join is a Cartesian product: 5×15. A join condition filters it.", citations: [] }),
  q({ id: "seed-db-acid-01", chapterId: "ch-db-sql", difficulty: "easy", cognitive: "recall", tags: ["acid"], bnStem: "ACID-এর অংশ নয় কোনটি?", enStem: "Which is NOT part of ACID?", bnOpts: ["Concurrency", "Atomicity", "Isolation", "Durability"], enOpts: ["Concurrency", "Atomicity", "Isolation", "Durability"], answer: 0, bnExp: "ACID = Atomicity, Consistency, Isolation, Durability।", enExp: "ACID = Atomicity, Consistency, Isolation, Durability.", citations: [] }),
  q({ id: "seed-sqli-01", chapterId: "ch-sec-web", difficulty: "medium", cognitive: "apply", tags: ["sqli", "owasp"], bnStem: "SQL injection-এর প্রাথমিক প্রতিরোধ কোনটি?", enStem: "What is the primary SQL injection defense?", bnOpts: ["প্যারামিটারাইজড কোয়েরি + least privilege", "শুধু ক্লায়েন্ট-সাইড ভ্যালিডেশন", "টেবিলের নাম গোপন রাখা", "GET-এর বদলে POST ব্যবহার"], enOpts: ["Parameterized queries + least privilege", "Client-side validation only", "Hiding table names", "Using POST instead of GET"], answer: 0, bnExp: "বাইন্ড ভেরিয়েবল + least privilege; POST ব্যবহার নিরাপত্তা দেয় না।", enExp: "Bind variables plus least privilege; switching to POST alone gives no security.", citations: [OWASP] }),
  q({ id: "seed-c-01", chapterId: "ch-prog-c", difficulty: "medium", cognitive: "code-trace", tags: ["c", "ub"], bnStem: "C-তে `int a = 5; printf(\"%d\", a++ + ++a);` — সঠিক উত্তর?", enStem: "In C, `int a = 5; printf(\"%d\", a++ + ++a);` — correct answer?", bnOpts: ["Undefined behavior", "11", "12", "13"], enOpts: ["Undefined behavior", "11", "12", "13"], answer: 0, bnExp: "একই সিকোয়েন্স পয়েন্টে দুবার পরিবর্তন = undefined।", enExp: "Two modifications between sequence points is undefined.", citations: [] }),
  q({ id: "seed-oop-01", chapterId: "ch-prog-oop", difficulty: "medium", cognitive: "recall", tags: ["oop"], bnStem: "রানটাইম পলিমরফিজম কীভাবে হয়?", enStem: "What enables runtime polymorphism?", bnOpts: ["ওভাররাইডিং + ডাইনামিক ডিসপ্যাচ", "শুধু ওভারলোডিং", "শুধু static মেথড", "শুধু কনস্ট্রাক্টর"], enOpts: ["Overriding + dynamic dispatch", "Overloading only", "Static methods only", "Constructors only"], answer: 0, bnExp: "ওভারলোডিং কম্পাইল-টাইম; ওভাররাইডিং রান-টাইম। C++-এ virtual দরকার।", enExp: "Overloading is compile-time; overriding is run-time. C++ needs virtual.", citations: [] }),
  q({ id: "seed-sort-01", chapterId: "ch-dsa-sort", difficulty: "medium", cognitive: "apply", tags: ["complexity"], bnStem: "T(n) = 2T(n/2) + n — সমাধান?", enStem: "Solve T(n) = 2T(n/2) + n.", bnOpts: ["Θ(n log n)", "Θ(n)", "Θ(n²)", "Θ(log n)"], enOpts: ["Θ(n log n)", "Θ(n)", "Θ(n²)", "Θ(log n)"], answer: 0, bnExp: "Master theorem case 2।", enExp: "Master theorem case 2.", citations: [] }),
  q({ id: "seed-graph-01", chapterId: "ch-dsa-graph", difficulty: "medium", cognitive: "apply", tags: ["dijkstra"], bnStem: "নেগেটিভ ওজন থাকলে Dijkstra কেন নিরাপদ নয়?", enStem: "Why is Dijkstra unsafe with negative weights?", bnOpts: ["চূড়ান্ত ধরা ভার্টেক্স পরে আরও ছোট পথ পেতে পারে", "গ্রাফ ধীর হয়", "শুধু ধনাত্মক গ্রাফে চলে না", "মেমরি ফুরায়"], enOpts: ["A finalized vertex may later get a shorter path", "Graphs get slow", "It never runs on positive graphs", "Memory runs out"], answer: 0, bnExp: "Dijkstra ধরে নেয় পরের পথ ছোট হবে না — নেগেটিভ এজে ভাঙে; Bellman-Ford ব্যবহার করুন।", enExp: "Dijkstra assumes later paths cannot be shorter — broken by negative edges; use Bellman-Ford.", citations: [MIT_D] }),
  q({ id: "seed-deadlock-01", chapterId: "ch-os-deadlock", difficulty: "medium", cognitive: "recall", tags: ["deadlock"], bnStem: "ডেডলকের চার শর্তের বাইরে কোনটি?", enStem: "Which is NOT one of the four deadlock conditions?", bnOpts: ["Time-sharing", "Mutual exclusion", "Hold-and-wait", "Circular wait"], enOpts: ["Time-sharing", "Mutual exclusion", "Hold-and-wait", "Circular wait"], answer: 0, bnExp: "চারটি: mutual exclusion, hold-and-wait, no preemption, circular wait।", enExp: "The four: mutual exclusion, hold-and-wait, no preemption, circular wait.", citations: [] }),
  q({ id: "seed-crypto-01", chapterId: "ch-sec-crypto", difficulty: "easy", cognitive: "recall", tags: ["hashing"], bnStem: "পাসওয়ার্ড সংরক্ষণে সঠিক পন্থা?", enStem: "Correct way to store passwords?", bnOpts: ["সল্টেড slow hash (bcrypt/argon2)", "প্লেইন টেক্সট", "শুধু MD5", "Base64 এনকোড"], enOpts: ["Salted slow hash (bcrypt/argon2)", "Plain text", "Plain MD5", "Base64 encoding"], answer: 0, bnExp: "দ্রুত হ্যাশ (MD5/SHA1) পাসওয়ার্ডে অপর্যাপ্ত; slow KDF + salt।", enExp: "Fast hashes are insufficient for passwords; use a slow salted KDF.", citations: [] }),
  q({ id: "seed-test-01", chapterId: "ch-se-testing", difficulty: "medium", cognitive: "analyze", tags: ["testing"], bnStem: "Black-box বনাম white-box — সঠিক পার্থক্য?", enStem: "Black-box vs white-box — correct distinction?", bnOpts: ["Black-box: আচরণ; white-box: ভেতরের পথ", "Black-box সবসময় ভালো", "White-box মানে ম্যানুয়াল টেস্ট", "দুটো একই"], enOpts: ["Black-box: behavior; white-box: internal paths", "Black-box is always better", "White-box means manual testing", "They are the same"], answer: 0, bnExp: "মুদ্রিত উৎসের অতিসরল দাবি যাচাই ছাড়া মানবেন না।", enExp: "Do not trust oversimplified printed keys without checking.", citations: [] }),
  q({ id: "seed-kmap-01", chapterId: "ch-logic-kmap", difficulty: "medium", cognitive: "apply", tags: ["kmap"], bnStem: "F(A,B,C) = Σm(1,3,5,7) সরল করলে?", enStem: "Simplify F(A,B,C) = Σm(1,3,5,7).", bnOpts: ["F = C", "F = A", "F = B", "F = A⊕B"], enOpts: ["F = C", "F = A", "F = B", "F = A⊕B"], answer: 0, bnExp: "1,3,5,7 ঠিক C=1 সারিগুলো — K-map quad।", enExp: "Minterms 1,3,5,7 are exactly C=1 rows — a K-map quad.", citations: [] }),
  q({ id: "seed-ai-01", chapterId: "ch-ai-overfit", difficulty: "medium", cognitive: "recall", tags: ["overfitting"], bnStem: "Overfitting-এর লক্ষণ ও প্রতিকার?", enStem: "Sign and remedy of overfitting?", bnOpts: ["Train কম, validation বেশি → regularization/early-stopping", "দুটোই বেশি → আরও জটিল মডেল", "দুটোই কম → কম ডেটা", "কোনো ব্যবস্থা নেই"], enOpts: ["Low train, high validation error → regularization/early-stopping", "Both high → more complex model", "Both low → less data", "Nothing helps"], answer: 0, bnExp: "High variance; cross-validation, dropout, more data।", enExp: "High variance; use cross-validation, dropout, more data.", citations: [] }),
  q({ id: "seed-sci-01", chapterId: "ch-sci-power", difficulty: "medium", cognitive: "recall", tags: ["transformer"], bnStem: "আদর্শ ট্রান্সফরমারে ভোল্টেজ অনুপাত কিসের সমানুপাতিক?", enStem: "In an ideal transformer, voltage ratio equals?", bnOpts: ["পাকসংখ্যার অনুপাত (N2/N1)", "রোধের অনুপাত", "তারের দৈর্ঘ্য", "কোরের ওজন"], enOpts: ["Turns ratio (N2/N1)", "Resistance ratio", "Wire length", "Core weight"], answer: 0, bnExp: "V2/V1 = N2/N1 (আদর্শ, লসহীন)।", enExp: "V2/V1 = N2/N1 (ideal, lossless).", citations: [OSX_I] }),
  q({ id: "seed-bangla-01", chapterId: "ch-bangla-spelling", difficulty: "easy", cognitive: "recall", tags: ["spelling"], bnStem: "শুদ্ধ বানান কোনটি?", enStem: "Which spelling is correct in Bangla?", bnOpts: ["মুমূর্ষু", "মুমুর্ষু", "মুমূর্ষূ", "মূমূর্ষু"], enOpts: ["মুমূর্ষু (correct form)", "মুমুর্ষু", "মুমূর্ষূ", "মূমূর্ষু"], answer: 0, bnExp: "ণ-ত্ব/ষ-ত্ব ও হ্রস্ব-দীর্ঘ যাচাই করে শিখুন।", enExp: "Check na-tva/sha-tva and vowel length.", citations: [BPSC] }),
  q({ id: "seed-eng-01", chapterId: "ch-eng-tense", difficulty: "easy", cognitive: "apply", tags: ["tense"], bnStem: "Choose the correct sentence.", enStem: "Choose the correct sentence.", bnOpts: ["He has been working here since 2020.", "He is working here since 2020.", "He has been working here from 2020.", "He works here since 2020."], enOpts: ["He has been working here since 2020.", "He is working here since 2020.", "He has been working here from 2020.", "He works here since 2020."], answer: 0, bnExp: "since + point of time → present perfect continuous।", enExp: "Since + point of time takes present perfect continuous.", citations: [] }),
  q({ id: "seed-math-01", chapterId: "ch-math-percent", difficulty: "easy", cognitive: "math-solve", tags: ["percentage"], bnStem: "১২০-এর ১৫% কত?", enStem: "What is 15% of 120?", bnOpts: ["১৮", "১৫", "২০", "১২"], enOpts: ["18", "15", "20", "12"], answer: 0, bnExp: "10% = 12, 5% = 6 → 18।", enExp: "10% = 12, 5% = 6 → 18.", citations: [] }),
  q({ id: "seed-num-01", chapterId: "ch-csf-number", difficulty: "easy", cognitive: "apply", tags: ["binary"], bnStem: "-13-এর 8-বিট two's complement?", enStem: "8-bit two's complement of −13?", bnOpts: ["11110011", "00001101", "11110010", "10001101"], enOpts: ["11110011", "00001101", "11110010", "10001101"], answer: 0, bnExp: "13=00001101 → invert → +1।", enExp: "13=00001101 → invert → +1.", citations: [] }),
  q({ id: "seed-arp-01", chapterId: "ch-net-ip", difficulty: "medium", cognitive: "analyze", tags: ["arp"], bnStem: "ARP ও RARP-এর সঠিক ভূমিকা?", enStem: "Correct roles of ARP and RARP?", bnOpts: ["ARP: IP→MAC; RARP: MAC→IP (legacy)", "দুটোই IP→MAC", "দুটোই MAC→IP", "ARP: MAC→IP; RARP: IP→MAC"], enOpts: ["ARP: IP→MAC; RARP: MAC→IP (legacy)", "Both IP→MAC", "Both MAC→IP", "ARP: MAC→IP; RARP: IP→MAC"], answer: 0, bnExp: "মুদ্রিত উৎসের ARP/RARP বাক্য যাচাই ছাড়া মানবেন না।", enExp: "Verify printed ARP/RARP wording; do not memorize blindly.", citations: [RFC791] }),
  q({ id: "seed-dhcp-01", chapterId: "ch-net-ip", difficulty: "medium", cognitive: "recall", tags: ["dhcp", "security"], bnStem: "DHCP starvation আক্রমণের প্রতিরোধ?", enStem: "Defense against DHCP starvation?", bnOpts: ["DHCP snooping + port security", "শুধু পাসওয়ার্ড বদল", "Wi-Fi বন্ধ", "ARP বন্ধ"], enOpts: ["DHCP snooping + port security", "Just changing passwords", "Turning Wi-Fi off", "Disabling ARP"], answer: 0, bnExp: "ভুয়া MAC বন্যা → পুল শেষ; snooping + rate-limit।", enExp: "Spoofed-MAC flood exhausts the pool; use snooping + rate limits.", citations: [] }),
  q({ id: "seed-groupby-01", chapterId: "ch-db-sql", difficulty: "medium", cognitive: "apply", tags: ["group-by"], bnStem: "গ্রুপ ফিল্টারে সঠিক ক্লজ?", enStem: "Correct clause to filter groups?", bnOpts: ["HAVING", "WHERE", "ORDER BY", "LIMIT"], enOpts: ["HAVING", "WHERE", "ORDER BY", "LIMIT"], answer: 0, bnExp: "WHERE = সারি-ফিল্টার (grouping-এর আগে); HAVING = গ্রুপ-ফিল্টার।", enExp: "WHERE filters rows before grouping; HAVING filters groups.", citations: [] }),
  q({ id: "seed-pipeline-01", chapterId: "ch-prog-c", difficulty: "hard", cognitive: "recall", tags: ["pipelining"], bnStem: "৫-ধাপ পাইপলাইন, ১০০ নির্দেশ, stall নেই — non-pipelined-এর তুলনায় speedup?", enStem: "5-stage pipeline, 100 instructions, no stalls — speedup vs non-pipelined?", bnOpts: ["≈4.81", "≈5.5", "≈2.0", "≈1.0"], enOpts: ["≈4.81", "≈5.5", "≈2.0", "≈1.0"], answer: 0, bnExp: "(n×k)/(k+n−1) = 500/104।", enExp: "(n×k)/(k+n−1) = 500/104.", citations: [] }),
  q({ id: "seed-precision-01", chapterId: "ch-ai-overfit", difficulty: "medium", cognitive: "math-solve", tags: ["metrics"], bnStem: "TP=40, FP=10, FN=20, TN=30 হলে precision ও recall?", enStem: "With TP=40, FP=10, FN=20, TN=30, precision and recall?", bnOpts: ["0.80 ও 0.667", "0.667 ও 0.80", "0.70 ও 0.70", "0.50 ও 0.50"], enOpts: ["0.80 and 0.667", "0.667 and 0.80", "0.70 and 0.70", "0.50 and 0.50"], answer: 0, bnExp: "P=40/50, R=40/60।", enExp: "P=40/50, R=40/60.", citations: [] }),
  q({ id: "seed-provisional-01", chapterId: "ch-net-tcp", difficulty: "easy", cognitive: "recall", tags: ["demo", "provisional"], bnStem: "ডেমো: TCP হ্যান্ডশেকে কয়টি বার্তা? (provisional key — রিভিউ বাকি)", enStem: "Demo: how many messages in a TCP handshake? (provisional key — pending review)", bnOpts: ["৩", "২", "৪", "১"], enOpts: ["3", "2", "4", "1"], answer: 0, bnExp: "SYN, SYN-ACK, ACK — এই কী এখনও provisional।", enExp: "SYN, SYN-ACK, ACK — this key is still provisional.", citations: [RFC9293], key: { optionId: "", status: "provisional", confidence: "medium" }, status: "reference_attached" }),
  q({ id: "seed-current-01", chapterId: "ch-gk-lib", difficulty: "easy", cognitive: "recall", tags: ["current-affairs"], bnStem: "ডেমো সাম্প্রতিক: উৎস, তারিখ ও মেয়াদসহ পড়ুন — BPSC নোটিশ কোথায় পাবেন?", enStem: "Demo current-affairs: read with dated source — where are BPSC notices published?", bnOpts: ["bpsc.gov.bd", "অযাচাইকৃত ফেসবুক পোস্ট", "পুরোনো গাইডের ফটোকপি", "উৎসহীন মিম"], enOpts: ["bpsc.gov.bd", "Unverified social post", "Old guide photocopy", "Unsourced meme"], answer: 0, bnExp: "সাম্প্রতিক দাবিতে তারিখসহ কর্তৃপক্ষের উৎস ও মেয়াদ লাগে।", enExp: "Current-affairs claims need a dated authoritative source plus expiry.", citations: [{ url: "http://bpsc.gov.bd/", title: "BPSC official site", retrievalDate: "2026-10-13", provenance: "official", licenseOrPermission: "link-only", expiresAt: "2027-04-13" }] }),
];

/** Chapter notes for every chapter — original BN/EN study material (objectives, terms, examples, traps, revision). */
const NOTES: Record<string, Partial<Chapter>> = {
  "ch-bangla-spelling": {
    objectives: [
      { bn: "ণ-ত্ব/ষ-ত্ব ও হ্রস্ব-দীর্ঘের নিয়ম প্রয়োগ করা", en: "Apply na-tva/sha-tva and vowel-length rules" },
      { bn: "ভুল-প্রবণ শব্দ যুক্তি দিয়ে শেখা, মুখস্থ নয়", en: "Learn error-prone words by rule, not rote" },
    ],
    keyTerms: [
      { term: { bn: "ণ-ত্ব", en: "Na-tva" }, def: { bn: "ট-বর্গের আগে দন্ত্য-ন → মূর্ধন্য-ণ", en: "Dental-n becomes retroflex-n before ta-class letters" } },
      { term: { bn: "ষ-ত্ব", en: "Sha-tva" }, def: { bn: "নির্দিষ্ট প্রত্যয়/সন্ধিতে স → ষ", en: "S becomes sh in specific suffixes/sandhi" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ: মুমূর্ষু", en: "Example: mumurshu" }, body: { bn: "দ্বিতীয় স্বর দীর্ঘ-ঊ, শেষে মূর্ধন্য-ষ — ষ-ত্বের নিয়মে।", en: "Second vowel is long-u, final sh is retroflex by rule." } },
    ],
    commonTraps: [
      { bn: "ফটোকপি-গাইডের ভিন্ন বানান মুখস্থ করা", en: "Memorizing conflicting printed-guide spellings" },
      { bn: "ণ/ন ও ষ/স গুলিয়ে ফেলা", en: "Mixing na/na and sha/sa" },
    ],
    revisionNotes: [{ bn: "ট-বর্গ + ঋ/র/ষ-এর পর ণ; ই/উ-প্রত্যয়ে ষ", en: "Na after ta-class/r-sounds; sha in i/u suffixes" }],
  },
  "ch-bangla-sandhi": {
    objectives: [
      { bn: "স্বর/ব্যঞ্জন/বিসর্গ সন্ধি চেনা ও বিচ্ছেদ করা", en: "Identify and split vowel/consonant/visarga sandhi" },
    ],
    keyTerms: [
      { term: { bn: "স্বরসন্ধি", en: "Vowel sandhi" }, def: { bn: "স্বর + স্বর মিলে নতুন স্বর", en: "Vowel + vowel merge into a new vowel" } },
      { term: { bn: "সন্ধি-বিচ্ছেদ", en: "Sandhi split" }, def: { bn: "যুক্ত রূপকে মূল দুই অংশে ভাঙা", en: "Splitting the joined form into its two roots" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ: বিদ্যালয়", en: "Example: bidyaloy" }, body: { bn: "বিদ্যা + আলয়; আ + আ = আ (দীর্ঘ)।", en: "Bidya + aloy; a + a = long a." } },
    ],
    commonTraps: [
      { bn: "সন্ধি ও সমাস গুলিয়ে ফেলা", en: "Confusing sandhi with compound (samas)" },
      { bn: "যুক্তবর্ণকে সন্ধি ভাবা", en: "Mistaking conjuncts for sandhi" },
    ],
    revisionNotes: [{ bn: "সমান স্বর মিলে দীর্ঘ: আ+আ=আ, ই+ই=ঈ, উ+উ=ঊ", en: "Like vowels lengthen: a+a=A, i+i=I, u+u=U" }],
  },
  "ch-eng-tense": {
    objectives: [
      { bn: "since/for সঠিক ব্যবহার ও voice/narration রূপান্তর", en: "Correct since/for use and voice/narration conversion" },
    ],
    keyTerms: [
      { term: { bn: "since বনাম for", en: "Since vs for" }, def: { bn: "since + নির্দিষ্ট সময়; for + সময়ের পরিমাণ", en: "Since + point of time; for + duration" } },
      { term: { bn: "Present perfect continuous", en: "Present perfect continuous" }, def: { bn: "has/have been + V-ing — since/for-এর সাথে", en: "Has/have been + V-ing — used with since/for" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "He has been working here since 2020. (since + সাল → has been + V-ing)", en: "He has been working here since 2020. (since + year → has been + V-ing)" } },
    ],
    commonTraps: [
      { bn: "since-এর সাথে from বসানো", en: "Using from with since" },
      { bn: "Present continuous + since", en: "Present continuous with since" },
    ],
    revisionNotes: [{ bn: "since + point, for + duration; passive = be + V3", en: "Since + point, for + duration; passive = be + V3" }],
  },
  "ch-gk-lib": {
    objectives: [
      { bn: "মুক্তিযুদ্ধের ধারাবাহিকতা ও সংবিধান-কাঠামো ব্যাখ্যা", en: "Explain the liberation timeline and constitution structure" },
      { bn: "প্রতিটি তারিখ উৎসসহ যাচাই করে পড়া", en: "Study each date with its source verified" },
    ],
    keyTerms: [
      { term: { bn: "স্বাধীনতা ঘোষণা", en: "Declaration of independence" }, def: { bn: "২৬ মার্চ ১৯৭১", en: "26 March 1971" } },
      { term: { bn: "সংবিধান", en: "Constitution" }, def: { bn: "গৃহীত ৪ নভেম্বর ১৯৭২; কার্যকর ১৬ ডিসেম্বর ১৯৭২", en: "Adopted 4 Nov 1972; effective 16 Dec 1972" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ: তারিখ-ক্রম", en: "Example: date order" }, body: { bn: "২৬ মার্চ ১৯৭১ (ঘোষণা) → ১৬ ডিসেম্বর ১৯৭১ (বিজয়) → ৪ নভেম্বর ১৯৭২ (সংবিধান গৃহীত)।", en: "26 Mar 1971 (declaration) → 16 Dec 1971 (victory) → 4 Nov 1972 (constitution adopted)." } },
    ],
    commonTraps: [
      { bn: "পুরোনো গাইডের বিতর্কিত দাবি যাচাই ছাড়া মুখস্থ", en: "Memorizing disputed printed claims without checking BPSC/official sources" },
      { bn: "সাম্প্রতিক তথ্যে তারিখ/মেয়াদ না দেখা", en: "Ignoring date/expiry on current-affairs items" },
    ],
    revisionNotes: [{ bn: "তারিখ + উৎস + মেয়াদ — তিনটিই লিখে পড়ুন", en: "Write date + source + expiry together" }],
  },
  "ch-math-percent": {
    objectives: [
      { bn: "ক্যালকুলেটর ছাড়া দ্রুত শতকরা ও লাভ-ক্ষতি", en: "Fast calculator-free percent and profit-loss" },
    ],
    keyTerms: [
      { term: { bn: "১০%-ভাঙন", en: "10% split" }, def: { bn: "15% = 10% + 5%; 10% = দশমিক এক ঘর বামে", en: "15% = 10% + 5%; 10% = shift decimal one place" } },
      { term: { bn: "ক্রয়/বিক্রয়মূল্য", en: "Cost/selling price" }, def: { bn: "লাভ = বিক্রয় − ক্রয়", en: "Profit = selling − cost" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ: ১২০-এর ১৫%", en: "Example: 15% of 120" }, body: { bn: "10% = 12, 5% = 6 → মোট 18।", en: "10% = 12, 5% = 6 → total 18." } },
    ],
    commonTraps: [
      { bn: "x% বৃদ্ধির পর x% হ্রাস = আগের মান ভাবা (আসলে x²/100% কমে)", en: "Thinking x% up then x% down returns to start (it drops by x²/100%)" },
    ],
    revisionNotes: [{ bn: "ক্রমিক পরিবর্তন: net = −(x²/100)%", en: "Successive change: net = −(x²/100)%" }],
  },
  "ch-csf-number": {
    objectives: [
      { bn: "বাইনারি↔হেক্স ও two's complement আয়ত্ত", en: "Master binary↔hex and two's complement" },
    ],
    keyTerms: [
      { term: { bn: "Two's complement", en: "Two's complement" }, def: { bn: "−N = (~N) + 1; MSB=1 মানে ঋণাত্মক", en: "−N = (~N) + 1; MSB 1 means negative" } },
      { term: { bn: "8-বিট রেঞ্জ", en: "8-bit range" }, def: { bn: "−128 … +127", en: "−128 … +127" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ: −13", en: "Example: −13" }, body: { bn: "13 = 00001101 → invert 11110010 → +1 = 11110011।", en: "13 = 00001101 → invert 11110010 → +1 = 11110011." } },
    ],
    commonTraps: [
      { bn: "sign-magnitude-কে complement ভাবা", en: "Confusing sign-magnitude with complement" },
      { bn: "+1 করতে ভুলে যাওয়া (one's-এ থেমে থাকা)", en: "Stopping at one's complement without +1" },
    ],
    revisionNotes: [{ bn: "−N = (~N)+1; MSB দেখে চিহ্ন", en: "−N = (~N)+1; read sign from MSB" }],
  },
  "ch-prog-c": {
    objectives: [
      { bn: "পয়েন্টার/sequence-point ও UB চেনা", en: "Recognize pointers, sequence points and UB" },
    ],
    keyTerms: [
      { term: { bn: "Undefined behavior", en: "Undefined behavior" }, def: { bn: "এক statement-এ একই variable দুবার বদল", en: "Two modifications of one variable in a single statement" } },
      { term: { bn: "Sequence point", en: "Sequence point" }, def: { bn: "; , && || ?: ও ফাংশন-কলের সীমানা", en: "Boundaries at ; , && || ?: and function calls" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "a++ + ++a → undefined; কোনো ‘সঠিক সংখ্যা’ নেই।", en: "a++ + ++a is undefined; there is no correct number." } },
    ],
    commonTraps: [
      { bn: "নিজের কম্পাইলারের আউটপুটকে সার্বজনীন উত্তর ভাবা", en: "Treating one compiler's output as the universal answer" },
    ],
    revisionNotes: [{ bn: "UB অপশন থাকলে সেটিই উত্তর", en: "If UB is an option, it is the answer" }],
  },
  "ch-prog-oop": {
    objectives: [
      { bn: "Overloading বনাম overriding; virtual dispatch", en: "Overloading vs overriding; virtual dispatch" },
    ],
    keyTerms: [
      { term: { bn: "Overloading", en: "Overloading" }, def: { bn: "একই ক্লাসে ভিন্ন প্যারামিটার — compile-time", en: "Same class, different params — compile-time" } },
      { term: { bn: "Overriding", en: "Overriding" }, def: { bn: "subclass-এ পুনঃসংজ্ঞা — run-time dispatch", en: "Subclass redefinition — run-time dispatch" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "Parent-রেফারেন্স → child-এর method চলে; C++-এ virtual দরকার।", en: "Parent reference calls the child's method; C++ needs virtual." } },
    ],
    commonTraps: [
      { bn: "static method-কে override ভাবা (এটা hiding)", en: "Calling static-method hiding an override" },
    ],
    revisionNotes: [{ bn: "overload = compile-time; override = run-time", en: "Overload = compile-time; override = run-time" }],
  },
  "ch-dsa-sort": {
    objectives: [
      { bn: "Complexity তুলনা ও Master theorem প্রয়োগ", en: "Compare complexities and apply Master theorem" },
    ],
    keyTerms: [
      { term: { bn: "Θ (theta)", en: "Theta" }, def: { bn: "tight bound — উপর ও নিচ দুটোই", en: "Tight bound — both upper and lower" } },
      { term: { bn: "Stable sort", en: "Stable sort" }, def: { bn: "সমান key-এর আগের ক্রম বজায় থাকে", en: "Equal keys keep their original order" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ: T(n)=2T(n/2)+n", en: "Example" }, body: { bn: "Master case 2 → Θ(n log n)।", en: "Master case 2 → Θ(n log n)." } },
    ],
    commonTraps: [
      { bn: "Quicksort-কে সবসময় O(n log n) ভাবা (worst O(n²))", en: "Assuming quicksort is always O(n log n) (worst O(n²))" },
    ],
    revisionNotes: [{ bn: "f(n)=n^log_b(a) হলে Θ(n^d log n)", en: "If f(n)=n^log_b(a) then Θ(n^d log n)" }],
  },
  "ch-dsa-graph": {
    objectives: [
      { bn: "BFS/DFS ও shortest-path অ্যালগরিদমের শর্ত", en: "BFS/DFS conditions and shortest-path choice" },
    ],
    keyTerms: [
      { term: { bn: "Relaxation", en: "Relaxation" }, def: { bn: "dist[v] = min(dist[v], dist[u]+w)", en: "dist[v] = min(dist[v], dist[u]+w)" } },
      { term: { bn: "Admissible heuristic", en: "Admissible heuristic" }, def: { bn: "কখনো overestimate করে না", en: "Never overestimates the true cost" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "Negative edge → Dijkstra ভাঙে; Bellman-Ford (V−1 relaxation)।", en: "Negative edges break Dijkstra; use Bellman-Ford (V−1 relaxations)." } },
    ],
    commonTraps: [
      { bn: "সব shortest-path-এ Dijkstra চালানো", en: "Running Dijkstra on every shortest-path problem" },
    ],
    revisionNotes: [{ bn: "non-negative → Dijkstra; negative → Bellman-Ford", en: "Non-negative → Dijkstra; negative → Bellman-Ford" }],
  },
  "ch-db-sql": {
    objectives: [
      { bn: "JOIN বনাম cartesian; HAVING বনাম WHERE", en: "JOIN vs cartesian; HAVING vs WHERE" },
    ],
    keyTerms: [
      { term: { bn: "Cartesian product", en: "Cartesian product" }, def: { bn: "WHERE-ছাড়া কমা-জয়েন: m×n সারি", en: "Comma join without WHERE: m×n rows" } },
      { term: { bn: "HAVING", en: "HAVING" }, def: { bn: "grouping-এর পর গ্রুপ-ফিল্টার", en: "Filters groups after grouping" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ: 5×15", en: "Example: 5×15" }, body: { bn: "SELECT * FROM student, takes → 75 সারি।", en: "SELECT * FROM student, takes → 75 rows." } },
    ],
    commonTraps: [
      { bn: "WHERE দিয়ে group-filter করার চেষ্টা", en: "Trying to filter groups with WHERE" },
    ],
    revisionNotes: [{ bn: "WHERE = সারি-ফিল্টার; HAVING = গ্রুপ-ফিল্টার", en: "WHERE filters rows; HAVING filters groups" }],
  },
  "ch-net-tcp": {
    objectives: [
      { bn: "Port/protocol mapping; safe/idempotent মেথড", en: "Port/protocol mapping; safe/idempotent methods" },
    ],
    keyTerms: [
      { term: { bn: "Safe", en: "Safe" }, def: { bn: "রিসোর্স বদলায় না (GET)", en: "Does not change the resource (GET)" } },
      { term: { bn: "Idempotent", en: "Idempotent" }, def: { bn: "বারবার পাঠালেও একই ফল (GET/PUT/DELETE)", en: "Same effect on repeats (GET/PUT/DELETE)" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "HTTPS = HTTP over TLS, TCP 443; HTTP = TCP 80।", en: "HTTPS is HTTP over TLS on TCP 443; HTTP is TCP 80." } },
    ],
    commonTraps: [
      { bn: "‘POST, GET-এর চেয়ে নিরাপদ’ মুখস্থ-ভুল", en: "The memorized myth that POST is safer than GET" },
    ],
    revisionNotes: [{ bn: "নিরাপত্তা আসে TLS থেকে, মেথড থেকে নয়", en: "Security comes from TLS, not the method" }],
  },
  "ch-os-deadlock": {
    objectives: [
      { bn: "৪ শর্ত + প্রতিরোধ/এড়ানো/শনাক্তকরণ", en: "Four conditions + prevention/avoidance/detection" },
    ],
    keyTerms: [
      { term: { bn: "Circular wait", en: "Circular wait" }, def: { bn: "প্রসেস-চক্রে পরস্পরের রিসোর্স ধরে রাখা", en: "Processes holding resources in a cycle" } },
      { term: { bn: "Banker's algorithm", en: "Banker's algorithm" }, def: { bn: "safe-state যাচাই করে বরাদ্দ (avoidance)", en: "Grants only safe-state allocations (avoidance)" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "সব রিসোর্সে global order → circular-wait ভাঙে।", en: "A global resource order breaks circular-wait." } },
    ],
    commonTraps: [
      { bn: "Prevention বনাম avoidance গুলিয়ে ফেলা", en: "Confusing prevention with avoidance" },
    ],
    revisionNotes: [{ bn: "একটি শর্ত ভাঙলেই deadlock অসম্ভব", en: "Breaking one condition rules out deadlock" }],
  },
  "ch-sec-crypto": {
    objectives: [
      { bn: "Password hashing ও CIA ত্রিভুজ", en: "Password hashing and the CIA triad" },
    ],
    keyTerms: [
      { term: { bn: "Salt + KDF", en: "Salt + KDF" }, def: { bn: "bcrypt/argon2-এর মতো slow hash", en: "Slow hashes like bcrypt/argon2" } },
      { term: { bn: "CIA", en: "CIA" }, def: { bn: "Confidentiality, Integrity, Availability", en: "Confidentiality, Integrity, Availability" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "MD5/SHA1 দ্রুত → brute-force সহজ; password-এ slow KDF + salt।", en: "MD5/SHA1 are fast → easy brute force; use slow KDF + salt." } },
    ],
    commonTraps: [
      { bn: "Base64-কে encryption ভাবা (এটা encoding)", en: "Mistaking Base64 for encryption (it is encoding)" },
      { bn: "Plain-text/MD5-তে password রাখা", en: "Storing passwords plain or in MD5" },
    ],
    revisionNotes: [{ bn: "password → salt + slow KDF; কখনো plain নয়", en: "Passwords → salt + slow KDF; never plain" }],
  },
  "ch-sec-web": {
    objectives: [
      { bn: "SQLi/XSS/CSRF প্রতিরোধ-কৌশল", en: "SQLi/XSS/CSRF defenses" },
    ],
    keyTerms: [
      { term: { bn: "Parameterized query", en: "Parameterized query" }, def: { bn: "bind variable — কোড ও ডেটা আলাদা", en: "Bind variables separate code from data" } },
      { term: { bn: "Least privilege", en: "Least privilege" }, def: { bn: "DB user-কে সর্বনিম্ন অধিকার", en: "Minimum rights for the DB user" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "String-concat SQL → bind variable-এ বদলান।", en: "Replace string-concatenated SQL with bind variables." } },
    ],
    commonTraps: [
      { bn: "শুধু client-side validation-ই যথেষ্ট ভাবা", en: "Relying on client-side validation alone" },
    ],
    revisionNotes: [{ bn: "server-side bind + least privilege", en: "Server-side binding + least privilege" }],
  },
  "ch-se-testing": {
    objectives: [
      { bn: "Testing-স্তর ক্রম ও black/white-box পার্থক্য", en: "Testing-level order and black/white-box distinction" },
    ],
    keyTerms: [
      { term: { bn: "Testing levels", en: "Testing levels" }, def: { bn: "Unit → Integration → System → Acceptance", en: "Unit → Integration → System → Acceptance" } },
      { term: { bn: "Regression", en: "Regression" }, def: { bn: "পরিবর্তনের পর পুরোনো টেস্ট পুনরায় চালানো", en: "Re-running old tests after changes" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "Black-box = আচরণ; white-box = ভেতরের পথ।", en: "Black-box = behavior; white-box = internal paths." } },
    ],
    commonTraps: [
      { bn: "মুদ্রিত অতিসরল সংজ্ঞা (‘black-box সবসময় ভালো’)", en: "Oversimplified printed claims (black-box is always better)" },
    ],
    revisionNotes: [{ bn: "alpha = in-house; beta = real users", en: "Alpha = in-house; beta = real users" }],
  },
  "ch-logic-kmap": {
    objectives: [
      { bn: "K-map grouping দিয়ে সরলীকরণ", en: "Simplify with K-map grouping" },
    ],
    keyTerms: [
      { term: { bn: "Minterm", en: "Minterm" }, def: { bn: "output=1 সারির গুণফল-পদ", en: "Product term for an output-1 row" } },
      { term: { bn: "Quad", en: "Quad" }, def: { bn: "৪-ঘরের group ২টি variable বাদ দেয়", en: "A 4-cell group eliminates 2 variables" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ: Σm(1,3,5,7)", en: "Example" }, body: { bn: "1,3,5,7 = C=1 সারি → F = C।", en: "1,3,5,7 are exactly C=1 rows → F = C." } },
    ],
    commonTraps: [
      { bn: "2^k-এর বাইরে group বানানো", en: "Grouping non-power-of-two cell counts" },
    ],
    revisionNotes: [{ bn: "বড় group = সহজ expression", en: "Bigger groups = simpler expressions" }],
  },
  "ch-ai-overfit": {
    objectives: [
      { bn: "Overfitting নির্ণয় ও precision/recall/F1", en: "Diagnose overfitting; compute precision/recall/F1" },
    ],
    keyTerms: [
      { term: { bn: "Precision / Recall", en: "Precision / Recall" }, def: { bn: "P=TP/(TP+FP); R=TP/(TP+FN)", en: "P=TP/(TP+FP); R=TP/(TP+FN)" } },
      { term: { bn: "Overfitting", en: "Overfitting" }, def: { bn: "train↓ কিন্তু validation↑", en: "Train error falls while validation rises" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "TP=40,FP=10,FN=20 → P=0.80, R=0.667।", en: "TP=40,FP=10,FN=20 → P=0.80, R=0.667." } },
    ],
    commonTraps: [
      { bn: "Imbalanced data-তে শুধু accuracy দেখা", en: "Judging imbalanced data by accuracy alone" },
    ],
    revisionNotes: [{ bn: "overfit → regularization/dropout/early-stop/more data", en: "Overfit → regularization/dropout/early-stop/more data" }],
  },
  "ch-sci-power": {
    objectives: [
      { bn: "Transformer অনুপাত ও RLC বেসিক", en: "Transformer ratios and RLC basics" },
    ],
    keyTerms: [
      { term: { bn: "Turns ratio", en: "Turns ratio" }, def: { bn: "আদর্শ: V2/V1 = N2/N1", en: "Ideal: V2/V1 = N2/N1" } },
      { term: { bn: "Induction", en: "Induction" }, def: { bn: "পরিবর্তী flux → emf", en: "Changing flux induces emf" } },
    ],
    workedExamples: [
      { title: { bn: "উদাহরণ", en: "Example" }, body: { bn: "N2 = 2×N1 হলে V2 = 2×V1 (আদর্শ, লসহীন)।", en: "If N2 = 2×N1 then V2 = 2×V1 (ideal, lossless)." } },
    ],
    commonTraps: [
      { bn: "Ideal সূত্র real transformer-এ সরাসরি বসানো (loss আছে)", en: "Applying ideal formulas to real transformers (losses exist)" },
    ],
    revisionNotes: [{ bn: "ideal: V∝N, I∝1/N", en: "Ideal: V∝N, I∝1/N" }],
  },
};

/** Deep-chapter enrichment: two flagship chapters + full notes for every other chapter. */
export function deepChapterPatch(chapterId: string): Partial<Chapter> | null {
  if (chapterId === "ch-net-ip") {
    return {
      objectives: [
        { bn: "CIDR থেকে নেটওয়ার্ক/ব্রডকাস্ট/রেঞ্জ বের করা", en: "Derive network/broadcast/range from CIDR" },
        { bn: "VLSM-এ সাবনেট ভাগ করা", en: "Split subnets with VLSM" },
        { bn: "RFC উদ্ধৃতি দিয়ে দাবি যাচাই করা", en: "Verify claims with RFC citations" },
      ],
      keyTerms: [
        { term: { bn: "CIDR", en: "CIDR" }, def: { bn: "/n = প্রথম n বিট নেটওয়ার্ক অংশ", en: "/n = first n bits are network" } },
        { term: { bn: "ব্রডকাস্ট", en: "Broadcast" }, def: { bn: "পরের ব্লক − 1", en: "Next block − 1" } },
      ],
      workedExamples: [
        { title: { bn: "উদাহরণ: /27", en: "Example: /27" }, body: { bn: "ব্লক 32; 45 → নেটওয়ার্ক .32, ব্রডকাস্ট .63, .33–.62 ব্যবহারযোগ্য।", en: "Block 32; 45 → network .32, broadcast .63, usable .33–.62." } },
      ],
      commonTraps: [
        { bn: "নেটওয়ার্ক ও ব্রডকাস্টকে ব্যবহারযোগ্য ধরা", en: "Counting network/broadcast as usable" },
        { bn: "2^n থেকে 2 বাদ দিতে ভুলে যাওয়া", en: "Forgetting to subtract 2" },
      ],
      revisionNotes: [{ bn: "ব্লক = 256 − মাস্ক অক্টেট; হোস্ট = 2^h − 2", en: "Block = 256 − mask octet; hosts = 2^h − 2" }],
    };
  }
  if (chapterId === "ch-db-norm") {
    return {
      objectives: [
        { bn: "FD থেকে 2NF/3NF/BCNF নির্ণয়", en: "Determine 2NF/3NF/BCNF from FDs" },
        { bn: "লসলেস ডিকম্পোজিশন করা", en: "Perform lossless decomposition" },
      ],
      keyTerms: [
        { term: { bn: "ট্রানজিটিভ নির্ভরতা", en: "Transitive dependency" }, def: { bn: "non-prime → non-prime পরোক্ষ নির্ভরতা", en: "Indirect non-prime → non-prime dependency" } },
      ],
      workedExamples: [
        { title: { bn: "উদাহরণ: A→B, B→C", en: "Example: A→B, B→C" }, body: { bn: "R1(A,B), R2(B,C)-তে ভাঙুন।", en: "Split into R1(A,B), R2(B,C)." } },
      ],
      commonTraps: [{ bn: "2NF-কে 3NF ভাবা", en: "Mistaking 2NF for 3NF" }],
      revisionNotes: [{ bn: "3NF: X→Y-তে X সুপারকি অথবা Y প্রাইম", en: "3NF: for X→Y, X is a superkey or Y is prime" }],
    };
  }
  return NOTES[chapterId] ?? null;
}

export function enrichedChapters(): Chapter[] {
  return PLATFORM_CHAPTERS.map((c) => ({ ...c, ...(deepChapterPatch(c.id) ?? {}) }));
}
