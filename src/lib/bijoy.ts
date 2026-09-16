/**
 * BornoLab Bijoy ⇄ Unicode engine
 * SutonnyMJ-compatible, case-sensitive, reversible core.
 *
 * Strategy:
 *  Unicode → Bijoy:
 *   1. Split composite vowels: ো (U+09CB) → ে+া, ৌ (U+09CC) → ৈ+া
 *   2. Reorder pre-kars (ি, ে, ৈ) + reph (র্) to visual order
 *   3. Map each cluster via dictionary (longest match for ক্ষ, জ্ঞ etc.)
 *  Bijoy → Unicode:
 *   1. Greedy tokenize (Av, etc.)
 *   2. Buffer pre-kars, flush after base consonant
 *   3. Recombine ে+া→ো, ৈ+া→ৌ
 */

// ---------- Unicode constants ----------
const U = {
  hasanta: "্", // U+09CD
  ra: "র",
  ya: "য",
  iKar: "ি", // U+09BF pre
  eKar: "ে", // U+09C7 pre
  oiKar: "ৈ", // U+09C8 pre
  aaKar: "া",
  oVowel: "ো", // U+09CB
  ouVowel: "ৌ", // U+09CC
};

// Bijoy markers
const B = {
  hasanta: "&",
  reph: "©", // রেফ: র্ before consonant
  yaFala: "¨", // য-ফলা marker (consonant + ¨ = consonant + ্ + য)
  eKar: "†",
  oiKar: "‰",
  iKar: "w",
};

// Unicode → Bijoy single-char map (logical → visual code)
const UNI_TO_BIJOY: Record<string, string> = {
  "অ": "A",
  "আ": "Av",
  "ই": "B",
  "ঈ": "C",
  "উ": "D",
  "ঊ": "E",
  "ঋ": "F",
  "এ": "G",
  "ঐ": "H",
  "ও": "I",
  "ঔ": "J",
  "ক": "K",
  "খ": "L",
  "গ": "M",
  "ঘ": "N",
  "ঙ": "O",
  "চ": "P",
  "ছ": "Q",
  "জ": "R",
  "ঝ": "S",
  "ঞ": "T",
  "ট": "U",
  "ঠ": "V",
  "ড": "W",
  "ঢ": "X",
  "ণ": "Y",
  "ত": "Z",
  "থ": "_",
  "দ": "`",
  "ধ": "a",
  "ন": "b",
  "প": "c",
  "ফ": "d",
  "ব": "e",
  "ভ": "f",
  "ম": "g",
  "য": "h",
  "র": "i",
  "ল": "j",
  "শ": "k",
  "ষ": "l",
  "স": "m",
  "হ": "n",
  "ড়": "o",
  "ঢ়": "p",
  "য়": "q",
  "ৎ": "r",
  "ং": "s",
  "ঃ": "t",
  "ঁ": "u",
  "া": "v",
  "ি": "w",
  "ী": "x",
  "ু": "y",
  "ূ": "z",
  "ৃ": "ƒ",
  "ৄ": "ƒv",
  "ে": B.eKar,
  "ৈ": B.oiKar,
  "্": B.hasanta,
  "।": "|",
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

// Special conjunct ligatures (Unicode cluster → Bijoy single token)
const LIGATURES_UNI_TO_BIJOY: Record<string, string> = {
  "ক্ষ": "ÿ", // ক + ্ + ষ
  "জ্ঞ": "জ্ঞ", // keep readable; fallback path handles it
  "শ্র": "kª", // শ + ্ + র style example
};

// Build reverse map
const BIJOY_TO_UNI: Record<string, string> = {};
for (const [k, v] of Object.entries(UNI_TO_BIJOY)) BIJOY_TO_UNI[v] = k;
for (const [k, v] of Object.entries(LIGATURES_UNI_TO_BIJOY)) BIJOY_TO_UNI[v] = k;
// Extra reverse tokens
BIJOY_TO_UNI[B.reph] = "র্"; // placeholder, handled specially
BIJOY_TO_UNI[B.yaFala] = "্য";

function isConsonant(ch: string): boolean {
  return /[ক-হড়ঢ়য়ৎ]/.test(ch);
}

function splitCompositeVowels(s: string): string {
  // ো → ে + া, ৌ → ৈ + া (logical split for visual reordering)
  return s.replaceAll(U.oVowel, U.eKar + U.aaKar).replaceAll(U.ouVowel, U.oiKar + U.aaKar);
}

/**
 * Unicode → Bijoy
 * Handles: ি/ে/ৈ pre-ordering, reph (র্+C), ya-fala (C+্য), generic hasanta.
 */
export function unicodeToBijoy(input: string): string {
  if (!input) return "";
  let text = splitCompositeVowels(input);

  // Fast-path ligature replace (longest first)
  for (const [uni, bij] of Object.entries(LIGATURES_UNI_TO_BIJOY)) {
    if (uni.length > 1 && text.includes(uni)) text = text.split(uni).join(`\u0000${bij}\u0000`);
  }

  let out = "";
  const chars = Array.from(text);
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    // Preserve ligature placeholders
    if (ch === "\u0000") {
      let j = chars.indexOf("\u0000", i + 1);
      if (j === -1) j = chars.length;
      out += chars.slice(i + 1, j).join("");
      i = j + 1;
      continue;
    }

    // Reph: র + ্ + consonant → © + consonantBijoy
    if (ch === U.ra && chars[i + 1] === U.hasanta && chars[i + 2] && isConsonant(chars[i + 2])) {
      const c = chars[i + 2];
      // Check for kar after reph consonant (e.g., র্কি)
      const kar = chars[i + 3];
      if (kar === U.iKar || kar === U.eKar || kar === U.oiKar) {
        // pre-kar goes before ©C? Visual: pre + © + C
        const preMap = kar === U.iKar ? B.iKar : kar === U.eKar ? B.eKar : B.oiKar;
        out += preMap + B.reph + (UNI_TO_BIJOY[c] ?? c);
        i += 4;
        continue;
      }
      out += B.reph + (UNI_TO_BIJOY[c] ?? c);
      i += 3;
      continue;
    }

    // Consonant + hasanta + ya (ya-fala) → C + ¨ (+ following kar handling)
    if (isConsonant(ch) && chars[i + 1] === U.hasanta && chars[i + 2] === U.ya) {
      const base = UNI_TO_BIJOY[ch] ?? ch;
      const after = chars[i + 3];
      if (after === U.iKar || after === U.eKar || after === U.oiKar) {
        const preMap = after === U.iKar ? B.iKar : after === U.eKar ? B.eKar : B.oiKar;
        out += preMap + base + B.yaFala;
        i += 4;
        continue;
      }
      // generic kar after ya-fala
      const karAfter = chars[i + 3];
      out += base + B.yaFala;
      if (karAfter && UNI_TO_BIJOY[karAfter] && !isConsonant(karAfter) && karAfter !== U.hasanta) {
        // post-kars stay after (except pre already handled)
        if (karAfter !== U.iKar && karAfter !== U.eKar && karAfter !== U.oiKar) {
          out += UNI_TO_BIJOY[karAfter];
          i += 4;
          continue;
        }
      }
      i += 3;
      continue;
    }

    // Consonant + pre-kar (ি/ে/ৈ) → pre + C
    if (isConsonant(ch) && (chars[i + 1] === U.iKar || chars[i + 1] === U.eKar || chars[i + 1] === U.oiKar)) {
      const kar = chars[i + 1];
      const preMap = kar === U.iKar ? B.iKar : kar === U.eKar ? B.eKar : B.oiKar;
      out += preMap + (UNI_TO_BIJOY[ch] ?? ch);
      i += 2;
      continue;
    }

    // Generic hasanta stays as &
    if (ch === U.hasanta) {
      out += B.hasanta;
      i += 1;
      continue;
    }

    // Direct map or passthrough (English, digits, spaces preserved byte-for-byte)
    out += UNI_TO_BIJOY[ch] ?? ch;
    i += 1;
  }
  return out;
}

/**
 * Bijoy → Unicode
 * Greedy tokenize, buffer pre-kars until base consonant, recombine ো/ৌ.
 */
export function bijoyToUnicode(input: string): string {
  if (!input) return "";
  // Token list longest-first (Av, kª, etc. before single chars)
  const tokens = Object.keys(BIJOY_TO_UNI).sort((a, b) => b.length - a.length);
  // Tokenize
  const units: string[] = [];
  let i = 0;
  while (i < input.length) {
    let matched: string | null = null;
    for (const t of tokens) {
      if (input.startsWith(t, i)) {
        matched = t;
        break;
      }
    }
    if (matched) {
      units.push(matched);
      i += matched.length;
    } else {
      units.push(input[i]);
      i += 1;
    }
  }

  // Map tokens to unicode symbols (with reph / ya-fala placeholders)
  // Then fix pre-kar ordering: pre + C → C + kar
  let tmp = "";
  const preSet = new Set([B.iKar, B.eKar, B.oiKar]);
  let pendingPre: string[] = [];

  for (const u of units) {
    if (preSet.has(u)) {
      pendingPre.push(u);
      continue;
    }
    if (u === B.reph) {
      // © + C handled when C arrives; emit marker
      tmp += "©";
      continue;
    }
    const mapped = BIJOY_TO_UNI[u];
    if (mapped === undefined) {
      // passthrough ASCII/English
      // flush pending pres? They need a consonant; if none, emit kars directly
      while (pendingPre.length) {
        const p = pendingPre.shift()!;
        tmp += p === B.iKar ? U.iKar : p === B.eKar ? U.eKar : U.oiKar;
      }
      tmp += u;
      continue;
    }
    if (mapped === "র্") {
      tmp += "র্";
      continue;
    }
    if (mapped === "্য") {
      tmp += "্য";
      continue;
    }
    // If tmp ends with © marker, this consonant is under reph
    if (tmp.endsWith("©")) {
      tmp = tmp.slice(0, -1) + "র" + U.hasanta + mapped;
      // apply pending pre-kars after the reph cluster's base? Actually kar attaches to base C
      if (pendingPre.length) {
        // pending was before ©, e.g. w©K → need K + ি with reph: র্কি = র + ্ + ক + ি
        // tmp currently র + ্ + K; append kars
        for (const p of pendingPre) tmp += p === B.iKar ? U.iKar : p === B.eKar ? U.eKar : U.oiKar;
        pendingPre = [];
      }
      continue;
    }
    if (isConsonant(mapped) || /^[অ-ঔ]$/.test(mapped)) {
      tmp += mapped;
      if (pendingPre.length) {
        // move pending pres after base: visual wK → logical K+w
        // tmp ends with mapped; append kars
        for (const p of pendingPre) tmp += p === B.iKar ? U.iKar : p === B.eKar ? U.eKar : U.oiKar;
        pendingPre = [];
      }
      continue;
    }
    // kar / vowel sign / other: if pending pre exists but current is not consonant, flush first
    while (pendingPre.length) {
      const p = pendingPre.shift()!;
      tmp += p === B.iKar ? U.iKar : p === B.eKar ? U.eKar : U.oiKar;
    }
    tmp += mapped;
  }
  while (pendingPre.length) {
    const p = pendingPre.shift()!;
    tmp += p === B.iKar ? U.iKar : p === B.eKar ? U.eKar : U.oiKar;
  }

  // Recombine ে+া → ো, ৈ+া → ৌ
  tmp = tmp.replaceAll(U.eKar + U.aaKar, U.oVowel).replaceAll(U.oiKar + U.aaKar, U.ouVowel);
  return tmp;
}

export function detectScript(text: string): "unicode" | "bijoy" | "mixed" | "empty" {
  if (!text.trim()) return "empty";
  const hasUni = /[\u0980-\u09FF]/.test(text);
  // Bijoy heuristic: distinctive markers or high density of mapped ASCII with † ‰ © ¨ ƒ ÿ
  const hasBijoyMarkers = /[†‰©¨ƒÿ]/.test(text);
  if (hasUni && !hasBijoyMarkers) return "unicode";
  if (!hasUni && /[A-Za-z0-9&_|]/.test(text)) return hasBijoyMarkers ? "bijoy" : "mixed";
  if (hasUni && hasBijoyMarkers) return "mixed";
  return "mixed";
}
