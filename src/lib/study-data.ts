/** Study module — categories, materials catalog, and step-by-step practice content. */

export type StudyCategory = "admission" | "ssc" | "hsc" | "bachelor" | "masters";

export interface StudyCategoryMeta {
  id: StudyCategory;
  label: string;
  bangla: string;
  desc: string;
}

export const STUDY_CATEGORIES: StudyCategoryMeta[] = [
  { id: "admission", label: "Admission Help", bangla: "ভর্তি সহায়তা", desc: "University, medical, engineering & masters admission prep." },
  { id: "ssc", label: "SSC", bangla: "এসএসসি", desc: "Class 9–10 notes, flashcards and board-style practice." },
  { id: "hsc", label: "HSC", bangla: "এইচএসসি", desc: "Class 11–12 notes, flashcards and board-style practice." },
  { id: "bachelor", label: "Bachelor", bangla: "স্নাতক", desc: "Undergraduate guides, lab notes and semester prep." },
  { id: "masters", label: "Masters", bangla: "স্নাতকোত্তর", desc: "Post-graduate admission & research prep, incl. BUET M.Sc." },
];

export function studyCategoryLabel(id: string): string {
  return STUDY_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export type StudyFileType = "pdf" | "html" | "link";

export interface StudyMaterial {
  id: string;
  title: string;
  category: StudyCategory;
  /** Sub-group inside a category, e.g. "BUET Post Graduate Admission". */
  subcategory?: string;
  description: string;
  /** Direct readable URL — /uploads/study/… file or external https link. */
  fileUrl: string;
  fileType: StudyFileType;
  /** Topic ids (see PRACTICE_TOPICS) attached for step-by-step practice. */
  topics?: string[];
  featured?: boolean;
  enabled?: boolean;
  createdAt?: number;
}

/**
 * Built-in reference materials. The two files ship in
 * /public/uploads/study/ and live under Masters → BUET Post Graduate Admission.
 */
export const BUILT_IN_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: "buet-msc-cse-prep-pdf",
    title: "BUET M.Sc. CSE (Group 1) — 3-Day Prep Guide (PDF)",
    category: "masters",
    subcategory: "BUET Post Graduate Admission",
    description:
      "Q&A with explanations for all 10 Group-1 topics — Programming, Discrete Math, DSA, Compiler & TOC, Database, Networks & Security, Software Engineering, Digital Logic, Architecture & OS, AI/ML — plus a 3-day study plan.",
    fileUrl: "/uploads/study/BUET_MSc_CSE_Group1_Prep_Guide.pdf",
    fileType: "pdf",
    topics: ["prog", "disc", "dsa", "toc", "db", "net", "se", "dld", "arch", "ai"],
    featured: true,
    enabled: true,
  },
  {
    id: "buet-msc-cse-prep-html",
    title: "BUET M.Sc. CSE (Group 1) — Interactive Prep Guide (HTML)",
    category: "masters",
    subcategory: "BUET Post Graduate Admission",
    description:
      "The same 3-day prep guide as an interactive page — topic tabs, reveal-mode self-test cards and a progress bar.",
    fileUrl: "/uploads/study/BUET%20MSc%20CSE%20(Group%201)%20-%203-Day%20Prep%20Guide.html",
    fileType: "html",
    topics: ["prog", "disc", "dsa", "toc", "db", "net", "se", "dld", "arch", "ai"],
    featured: false,
    enabled: true,
  },
];

/** Full storefront catalog: built-ins + admin-added materials, with visibility overrides. */
export function buildStudyCatalog(
  overrides: Record<string, { enabled?: boolean }> = {},
  custom: StudyMaterial[] = []
): (StudyMaterial & { enabled: boolean })[] {
  return [...BUILT_IN_STUDY_MATERIALS, ...custom].map((m) => ({
    ...m,
    enabled: overrides[m.id]?.enabled ?? m.enabled ?? true,
  }));
}

/* ---------------- Step-by-step practice content ---------------- */

export type PracticeItemType = "MCQ" | "Written";

export interface PracticeItem {
  id: string;
  type: PracticeItemType;
  /** Seen tag from past papers, e.g. "Apr 2024". Empty = core concept. */
  seen?: string;
  q: string;
  a: string;
  ex: string;
}

export interface PracticeTopic {
  id: string;
  name: string;
  day: 1 | 2 | 3;
  items: PracticeItem[];
}

/**
 * Practice bank distilled from the BUET M.Sc. CSE Group-1 reference guide.
 * Each topic maps to one step of the 3-day plan: learn → flashcards → exam mode.
 */
export const PRACTICE_TOPICS: PracticeTopic[] = [
  {
    id: "prog",
    name: "Programming (Structured + OOP)",
    day: 1,
    items: [
      { id: "prog-1", type: "MCQ", seen: "Apr 2024", q: 'C++: unsigned i = 10; if (i > -1) print "Yes" else "No". What is printed?', a: "No", ex: "Mixed signed/unsigned comparison converts to unsigned: -1 becomes 4294967295, so 10 > 4294967295 is false." },
      { id: "prog-2", type: "MCQ", seen: "Older paper", q: 'Java: s = new String("hello"), ss = "hello", sp = "hello". Evaluate s==ss, ss==sp, s.equals(ss).', a: "false, true, true", ex: "Literals are interned in the string pool (ss==sp same object); new String is a separate heap object; equals compares content." },
      { id: "prog-3", type: "MCQ", q: "C: int a = 5; printf(a++ + ++a). What is the correct answer?", a: "Undefined behavior", ex: "Modifying the same variable twice between sequence points is undefined in C/C++ — if an option says undefined, pick it." },
      { id: "prog-4", type: "Written", seen: "Apr 2024", q: "What is a functional interface in Java? Give an example.", a: "An interface with exactly one abstract method — the target type for lambdas, e.g. (a,b) -> a+b.", ex: "Built-ins: Runnable, Comparator, Predicate, Function. @FunctionalInterface makes the compiler enforce the rule." },
      { id: "prog-5", type: "Written", q: "Differentiate overloading vs overriding. What enables runtime polymorphism?", a: "Overloading: same class, different params, compile-time. Overriding: subclass redefines method, run-time dispatch.", ex: "Parent-type reference calls the object's actual method. C++ needs virtual (vtable); Java instance methods are virtual by default." },
    ],
  },
  {
    id: "disc",
    name: "Discrete, Probability & Stats",
    day: 1,
    items: [
      { id: "disc-1", type: "MCQ", q: "Minimum people to guarantee two share a birth month?", a: "13", ex: "Pigeonhole principle: 12 months = 12 boxes, 13 people force a repeat." },
      { id: "disc-2", type: "MCQ", q: "Distinct arrangements of the letters of BANANA?", a: "60", ex: "6! / (3! × 2!) = 720/12 = 60 (three A's, two N's repeated)." },
      { id: "disc-3", type: "Written", seen: "Apr 2024", q: "Runs of successes with probability p: P(run length = k) and expected run length?", a: "P = p^(k-1)(1-p), geometric. Expected length = 1/(1-p).", ex: "A run continues with prob p and stops on first failure. Example: p=0.75 gives average success-run length 4." },
      { id: "disc-4", type: "Written", q: "Disease prevalence 1%. Test: 90% sensitivity, 5% false-positive. P(disease | positive)?", a: "~15.4%", ex: "Bayes: (0.9×0.01)/(0.9×0.01 + 0.05×0.99) = 0.009/0.0585 ≈ 0.154. Low prevalence dominates." },
      { id: "disc-5", type: "MCQ", q: "Data 2,4,4,4,5,5,7,9. Mean, population variance, std deviation?", a: "5, 4, 2", ex: "Sum=40, mean=5. Squared deviations sum=32; 32/8=4; sd=2. Sample variance would divide by n-1." },
    ],
  },
  {
    id: "dsa",
    name: "Data Structures & Algorithms",
    day: 1,
    items: [
      { id: "dsa-1", type: "Written", seen: "Apr 2024", q: "Detect a loop in a singly linked list.", a: "Floyd tortoise-and-hare: slow +1, fast +2; meet = cycle, fast hits NULL = none.", ex: "O(n) time, O(1) space. A visited hash-set also works but costs O(n) space." },
      { id: "dsa-2", type: "Written", seen: "Older paper", q: "Graph with 100 vertices, ~300 edges: adjacency matrix or list?", a: "Adjacency list.", ex: "Matrix costs V²=10,000 cells; list costs V+E ≈ 400. E≈3V is sparse — matrix only wins when E is near V²." },
      { id: "dsa-3", type: "Written", seen: "Older paper", q: "Explain Bellman-Ford with negative weights. Why not Dijkstra?", a: "Relax every edge V-1 times; a V-th pass relaxation means a reachable negative cycle. O(VE).", ex: "Dijkstra finalizes vertices assuming later paths can't be shorter — negative edges break that." },
      { id: "dsa-4", type: "MCQ", q: "Solve T(n) = 2T(n/2) + n.", a: "Θ(n log n)", ex: "Master theorem case 2: n^(log2 2)=n matches f(n)=n." },
      { id: "dsa-5", type: "MCQ", q: "Worst case of Quick Sort and when?", a: "O(n²) with first/last pivot on an already-sorted array.", ex: "Partitions become 0 and n-1. Fix: random or median-of-three pivot. Average O(n log n)." },
    ],
  },
  {
    id: "toc",
    name: "Compiler & Theory of Computation",
    day: 1,
    items: [
      { id: "toc-1", type: "Written", seen: "Apr 2024", q: "Why is the pumping lemma used only to prove a language is NOT regular?", a: "It is necessary, not sufficient: every regular language satisfies it, but some non-regular ones do too.", ex: "Proof template: assume regular, take pumping length p, pick w with |w|≥p, pump any valid split to a contradiction." },
      { id: "toc-2", type: "Written", seen: "Apr 2024", q: "Rules for filling an LL(1) predictive parsing table.", a: "For A→α: put M[A,a] for each a in FIRST(α); if ε in FIRST(α), put M[A,b] for every b in FOLLOW(A).", ex: "Grammar is LL(1) iff no cell gets two productions. Top-down parsers loop on left recursion — remove it first." },
      { id: "toc-3", type: "Written", seen: "Older paper", q: "Draw the relationship between P, NP, NP-hard, NP-complete.", a: "P ⊂ NP. NP-complete = NP ∩ NP-hard. NP-hard extends beyond NP (e.g. Halting).", ex: "P = solvable in poly time; NP = verifiable in poly time. Approximation gives a bound; heuristics give none." },
      { id: "toc-4", type: "MCQ", q: "Order the compiler phases.", a: "Lexical → syntax → semantic → intermediate code → optimization → code generation.", ex: "Symbol table + error handler serve all phases. Front end = analysis; back end = synthesis." },
    ],
  },
  {
    id: "db",
    name: "Database",
    day: 2,
    items: [
      { id: "db-1", type: "MCQ", seen: "2021 online", q: "Which is NOT part of ACID? Atomicity, Isolation, Concurrency, Durability.", a: "Concurrency", ex: "ACID = Atomicity, Consistency, Isolation, Durability. Concurrency is what isolation controls." },
      { id: "db-2", type: "MCQ", seen: "2021 online", q: "student has 5 rows, takes has 15. Rows from SELECT * FROM student, takes?", a: "75", ex: "Comma with no WHERE is a Cartesian product: 5×15. A join condition filters it down." },
      { id: "db-3", type: "Written", seen: "Apr 2024", q: "Count articles per topic in SQL.", a: "SELECT topic_name, COUNT(*) FROM articles GROUP BY topic_name;", ex: "Use HAVING (not WHERE) to filter groups, e.g. HAVING COUNT(*) > 5. WHERE filters rows before grouping." },
      { id: "db-4", type: "Written", q: "R(A,B,C) with A→B, B→C. Which normal form? Decompose.", a: "2NF but not 3NF (transitive dependency B→C). Decompose to R1(A,B), R2(B,C).", ex: "3NF: for X→Y, X is a superkey or Y is prime. BCNF: X must always be a superkey." },
    ],
  },
  {
    id: "net",
    name: "Computer Network & Security",
    day: 2,
    items: [
      { id: "net-1", type: "Written", seen: "Apr 2024", q: "Host 192.168.10.45/27: network, broadcast, usable hosts?", a: "Network .32, broadcast .63, range .33–.62, 30 usable hosts.", ex: "Block = 256−224 = 32; multiple of 32 at/below 45 is 32; broadcast = next block −1; usable = 2^5−2 = 30." },
      { id: "net-2", type: "Written", seen: "Apr 2024", q: "How does a DHCP starvation attack work? Defense?", a: "Attacker floods DHCP Discover with spoofed MACs, exhausting the pool so real clients get no IP. Defense: DHCP snooping + port security.", ex: "Related follow-up: rogue DHCP server (MITM) — snooping blocks it via trusted ports." },
      { id: "net-3", type: "Written", q: "RSA toy: p=3, q=11, e=3. Find n, φ, d; encrypt m=4.", a: "n=33, φ=20, d=7, ciphertext=31.", ex: "d is the modular inverse of e mod φ (3×7=21≡1 mod 20). Security rests on factoring n." },
      { id: "net-4", type: "MCQ", q: "Usable hosts in a /26 network?", a: "62", ex: "2^6 − 2 = 62 (subtract network and broadcast addresses)." },
    ],
  },
  {
    id: "se",
    name: "Software Engg & Info System Design",
    day: 2,
    items: [
      { id: "se-1", type: "Written", seen: "Apr 2024", q: "Strategy design pattern for sorting.", a: "SortStrategy interface; InsertionSort/QuickSort/MergeSort implement it; Context delegates to the held strategy, swappable at runtime.", ex: "Benefit: open/closed principle — replaces if-else chains on algorithm type." },
      { id: "se-2", type: "Written", seen: "Older paper", q: "Types of software maintenance.", a: "Corrective (bugs), adaptive (new environment), perfective (features/performance), preventive (refactor).", ex: "Perfective usually takes the largest share of maintenance effort." },
      { id: "se-3", type: "Written", seen: "Older paper", q: "Levels of software testing.", a: "Unit → integration → system → acceptance. Black-box = behavior; white-box = internal paths.", ex: "Regression re-runs tests after changes. Alpha = in-house; beta = external real users." },
      { id: "se-4", type: "MCQ", q: "Flow graph E=9, N=7, one component. Cyclomatic complexity?", a: "4", ex: "V(G) = E − N + 2P = 9−7+2 = 4. Also = decision points + 1 = independent paths to test." },
    ],
  },
  {
    id: "ai",
    name: "AI & Machine Learning",
    day: 2,
    items: [
      { id: "ai-1", type: "Written", seen: "Apr 2024", q: "What is overfitting and how do you avoid it?", a: "Memorizes training noise: low train error, high test error. Avoid: regularization, cross-validation, dropout, more data, early stopping.", ex: "Learning-curve diagnosis: train error falls while validation error turns upward. Underfitting = high bias." },
      { id: "ai-2", type: "Written", seen: "Apr 2024", q: "Why is A* optimal? Conditions?", a: "Optimal if h is admissible (never overestimates) and, for graph search, consistent: h(n) ≤ c(n,a,n′) + h(n′).", ex: "f(n)=g(n)+h(n). First goal popped has lowest cost. Example admissible heuristic: Manhattan distance in 8-puzzle." },
      { id: "ai-3", type: "MCQ", q: "TP=40, FP=10, FN=20, TN=30. Precision, recall, accuracy, F1?", a: "0.80, 0.667, 0.70, 0.727", ex: "P=40/50, R=40/60, Acc=70/100, F1=2PR/(P+R)." },
      { id: "ai-4", type: "Written", q: "Minimax with alpha-beta pruning: is the answer changed?", a: "No — pruned branches cannot influence the decision. Result identical to minimax; best case O(b^(d/2)).", ex: "Alpha = best MAX can guarantee; beta = best MIN can guarantee. Move ordering decides pruning amount." },
    ],
  },
  {
    id: "dld",
    name: "Digital Logic & Microprocessors",
    day: 3,
    items: [
      { id: "dld-1", type: "MCQ", q: "Simplify F(A,B,C) = Σm(1,3,5,7).", a: "F = C", ex: "Minterms 1,3,5,7 are exactly the rows where C=1 — a K-map quad eliminates A and B." },
      { id: "dld-2", type: "MCQ", q: "-13 in 8-bit two's complement?", a: "11110011 (0xF3)", ex: "13=00001101 → invert 11110010 → +1 = 11110011. Range: −128..+127." },
      { id: "dld-3", type: "MCQ", q: "8086: segment 2000h, offset 0050h. Physical address?", a: "20050h", ex: "Physical = segment×16 + offset = 20000h + 0050h. 20-bit bus → 1 MB." },
      { id: "dld-4", type: "Written", seen: "Apr 2024", q: "Build XOR from a 2-to-4 decoder and one NOR gate.", a: "Decoder gives D0..D3; NOR(D0,D3) = (A′B′+AB)′ = A xor B.", ex: "XOR = D1+D2, and D0+D1+D2+D3=1, so the complement of D0+D3 is D1+D2." },
    ],
  },
  {
    id: "arch",
    name: "Computer Architecture & OS",
    day: 3,
    items: [
      { id: "arch-1", type: "MCQ", q: "5-stage pipeline, 100 instructions, no stalls. Speedup vs non-pipelined?", a: "≈ 4.81", ex: "Speedup = (n×k)/(k+n−1) = 500/104 ≈ 4.81; approaches k as n grows." },
      { id: "arch-2", type: "Written", q: "Four necessary conditions for deadlock + prevention.", a: "Mutual exclusion, hold-and-wait, no preemption, circular wait. Break any one (e.g. global resource ordering).", ex: "Avoidance = Banker's algorithm (safe-state check). Alternative: detection + recovery." },
      { id: "arch-3", type: "Written", seen: "2021 online", q: "Compare RAID 0, 1, 5, 6.", a: "0: striping, no redundancy. 1: mirroring. 5: distributed parity, survives 1 failure. 6: double parity, survives 2.", ex: "RAID 5 usable = N−1 disks; RAID 1 = 50%. RAID 0 fastest but any disk loss = total loss." },
      { id: "arch-4", type: "MCQ", q: "Classic string, 3 frames. Page faults for FIFO, LRU, Optimal?", a: "15, 12, 9", ex: "Textbook example. Belady's anomaly can hit FIFO but never LRU/Optimal (stack algorithms)." },
    ],
  },
];

export interface StudyDayPlan {
  day: string;
  blocks: string[];
}

export const STUDY_PLAN: StudyDayPlan[] = [
  {
    day: "Day 1 — Highest-frequency core",
    blocks: [
      "DSA: cycle detection, O(1) queue, Bellman-Ford, graph representation, master theorem",
      "Programming: C/C++ output tricks, Java strings, inner classes, functional interfaces",
      "Compiler & TOC: pumping lemma, DFA parity construction, LL(1) table, P/NP diagram",
      "Discrete & Stats: pigeonhole, recurrences, Bayes, geometric runs",
      "Evening: flashcard self-test on every Day-1 topic; mark Review items",
    ],
  },
  {
    day: "Day 2 — Applied CS topics",
    blocks: [
      "Database: ACID, B+ tree, joins, CASE update, trigger, normalization",
      "Networks & Security: subnetting drills, DHCP/SYN attacks, RSA toy example",
      "Software Engineering: strategy pattern, testing levels, maintenance types",
      "AI/ML: overfitting, A*, precision/recall, entropy, alpha-beta",
      "Evening: redo all Review-marked cards from Day 1 + Day 2",
    ],
  },
  {
    day: "Day 3 — Hardware, OS & mock exam",
    blocks: [
      "Digital Logic: NAND/NOR realization, decoder tricks, K-map, two's complement",
      "Architecture & OS: pipeline, cache EAT, scheduling, page replacement, deadlock, RAID",
      "Mock MCQ: 50 questions in 50 minutes from the flashcards below",
      "Mock written: pick 10 Written cards, answer on paper in 1 hour, then compare",
      "Final hour: skim Seen-tagged cards only, then rest — sleep early",
    ],
  },
];

export function practiceTopic(id: string): PracticeTopic | undefined {
  return PRACTICE_TOPICS.find((t) => t.id === id);
}
