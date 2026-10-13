/** BornoLab Study Platform — normalized domain types (client-safe, no fs). */

export type Locale = "bn" | "en";

export interface BilingualText {
  bn: string;
  en: string;
}

export type ContentStatus =
  | "draft"
  | "normalized"
  | "independently_solved"
  | "reference_attached"
  | "reviewer_approved"
  | "published"
  | "retired";

export type Difficulty = "easy" | "medium" | "hard";
export type CognitiveType = "recall" | "apply" | "analyze" | "code-trace" | "math-solve";
export type QuestionType = "mcq" | "written" | "true-false";
export type KeyStatus = "provisional" | "approved";
export type LicenseStatus = "original" | "licensed" | "link-only" | "pending" | "blocked";

export interface SourceCitation {
  url: string;
  title: string;
  pageOrSection?: string;
  retrievalDate: string; // ISO date
  provenance: string;
  licenseOrPermission: string;
  /** Current-affairs items must carry an expiry/review date. */
  expiresAt?: string;
}

export interface LicenseRecord {
  status: LicenseStatus;
  note?: string;
  attributionUrl?: string;
}

export interface Post {
  id: string;
  slug: string;
  title: BilingualText;
  org: BilingualText;
  grade?: string;
  track: string; // e.g. "bank-it" | "bcs-ict" | "telecom" | "power" | "teacher-ict" | "non-cadre"
  eligibilityNote?: BilingualText;
  aliases: string[];
  examIds: string[];
  sourceNotes?: BilingualText;
  enabled: boolean;
}

export interface Exam {
  id: string;
  slug: string;
  postIds: string[];
  family: BilingualText; // assessment family name
  enabled: boolean;
}

export interface ExamSection {
  id: string;
  title: BilingualText;
  subjectIds: string[];
  questionCount: number;
  marks: number;
}

export interface ScorePolicy {
  marksPerQuestion: number;
  negativeMark: number; // e.g. 0.5
  unansweredPenalty: number; // default 0
  partialCredit?: boolean;
}

export interface LeavePolicy {
  allowLeave: boolean;
  /** warn = confirm dialog; cancel = attempt cancelled on leave; allow = free resume */
  leaveAction: "warn" | "cancel" | "allow";
  message: BilingualText;
}

export interface ExamVersion {
  id: string;
  slug: string;
  examId: string;
  postSlugs: string[];
  year?: string;
  label: BilingualText;
  durationSec: number;
  totalMarks: number;
  sections: ExamSection[];
  policy: ScorePolicy;
  leave: LeavePolicy;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  attemptLimit?: number;
  syllabusRef?: string;
  sources: SourceCitation[];
  demo?: boolean;
  enabled: boolean;
}

export interface Subject {
  id: string;
  slug: string;
  title: BilingualText;
  overview: BilingualText;
  aliases: string[];
  order: number;
}

export interface Chapter {
  id: string;
  slug: string;
  subjectId: string;
  title: BilingualText;
  overview: BilingualText;
  objectives: BilingualText[];
  keyTerms: { term: BilingualText; def: BilingualText }[];
  workedExamples: { title: BilingualText; body: BilingualText }[];
  commonTraps: BilingualText[];
  revisionNotes: BilingualText[];
  resourceLinks: { label: BilingualText; url: string; license: string }[];
  aliases: string[];
  order: number;
}

export interface Topic {
  id: string;
  slug: string;
  chapterId: string;
  title: BilingualText;
  aliases: string[];
}

export interface QuestionLocaleText {
  stem: string;
  options: string[];
  explanation: string;
}

/** Aliases for spec-named entities (locale variants, never lossy OCR replacements). */
export type QuestionLocale = QuestionLocaleText;
export type OptionLocale = Record<Locale, string>;
export interface Explanation {
  questionId: string;
  locale: Record<Locale, string>;
  citations: SourceCitation[];
}
export type Review = ReviewAction;

export interface Option {
  id: string;
  order: number;
  locale: Record<Locale, string>;
}

export interface AnswerKey {
  optionId: string;
  status: KeyStatus;
  confidence: "low" | "medium" | "high";
  checkedBy?: string;
  checkedAt?: string;
}

export interface Question {
  id: string;
  stableId: string;
  type: QuestionType;
  difficulty: Difficulty;
  cognitive: CognitiveType;
  chapterId: string;
  topicId?: string;
  postSlugs: string[];
  examVersionIds: string[];
  tags: string[];
  locale: Record<Locale, QuestionLocaleText>;
  options: Option[];
  key: AnswerKey;
  citations: SourceCitation[];
  license: LicenseRecord;
  status: ContentStatus;
  version: number;
  reviewerNotes?: string;
  ambiguityFlag?: boolean;
  ocrFlags?: string[];
  history: QuestionVersion[];
  createdAt: number;
  updatedAt: number;
}

export interface QuestionVersion {
  version: number;
  at: number;
  actor: string;
  note?: string;
  snapshot: Pick<Question, "locale" | "options" | "key" | "status">;
}

export interface ReviewAction {
  questionId: string;
  from: ContentStatus;
  to: ContentStatus;
  actor: string;
  role: string;
  note?: string;
  at: number;
}

export interface AttemptAnswer {
  questionId: string;
  optionId: string | null;
  markedForReview: boolean;
  updatedAt: number;
}

export interface Attempt {
  id: string;
  userId: string | null;
  examVersionId: string;
  seed: number;
  questionOrder: string[];
  optionOrder: Record<string, string[]>;
  answers: Record<string, AttemptAnswer>;
  startedAt: number;
  deadline: number;
  submittedAt: number | null;
  autoSubmitted: boolean;
  leavePolicy: LeavePolicy;
  score?: AttemptScore;
  /** Preserved earlier scores (recalculation never deletes history). */
  previousScores?: { at: number; score: AttemptScore; note?: string }[];
  keySnapshot: KeyStatus;
  needsRecalculation?: boolean;
  correctionNote?: string;
  /** Per-question section id resolved at attempt creation (chapter→subject→section). */
  sectionOf?: Record<string, string>;
}

export interface AttemptScore {
  raw: number;
  penalty: number;
  net: number;
  pct: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  timeUsedSec: number;
  sectionTotals: Record<string, { correct: number; incorrect: number; unanswered: number; net: number }>;
  topicTotals: Record<string, { correct: number; incorrect: number; unanswered: number; net: number }>;
  keyStatus: KeyStatus;
}

export interface UserProgress {
  userId: string;
  chapterMastery: Record<string, { seen: number; correct: number; total: number; updatedAt: number }>;
  wrongQueue: string[];
  unansweredQueue: string[];
  streakDays: number;
  lastActiveDay?: string;
}

export interface Bookmark {
  userId: string;
  kind: "question" | "chapter";
  refId: string;
  createdAt: number;
}

export interface QuestionFlag {
  id: string;
  questionId: string;
  userId: string;
  reason: string;
  createdAt: number;
  status: "open" | "resolved" | "dismissed";
}

export interface AuditEvent {
  id: string;
  at: number;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  detail?: string;
}

export interface FeatureFlag {
  id: string;
  enabled: boolean;
  note?: string;
}

export interface StudyPlatformConfig {
  enabled: boolean;
  demoMode: boolean;
  flags: Record<string, FeatureFlag>;
}

export const DEFAULT_STUDY_PLATFORM_CONFIG: StudyPlatformConfig = {
  enabled: false,
  demoMode: true,
  flags: {
    "study-platform": { id: "study-platform", enabled: false, note: "Master gate for new posts/chapters/practice/exams/progress routes." },
    "exam-engine": { id: "exam-engine", enabled: false, note: "Timed attempt engine + autosave + auto-submit." },
    "review-workflow": { id: "review-workflow", enabled: false, note: "Two-person approval + recalculation." },
  },
};

export function isPlatformEnabled(cfg?: StudyPlatformConfig | null): boolean {
  if (!cfg) return false;
  return cfg.enabled === true || cfg.flags?.["study-platform"]?.enabled === true;
}
