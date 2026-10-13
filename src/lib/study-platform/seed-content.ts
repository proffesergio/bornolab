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

/** Deep-chapter enrichment for two chapters (objectives, terms, examples). */
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
  return null;
}

export function enrichedChapters(): Chapter[] {
  return PLATFORM_CHAPTERS.map((c) => ({ ...c, ...(deepChapterPatch(c.id) ?? {}) }));
}
