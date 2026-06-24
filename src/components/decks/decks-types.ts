export type DeckCounts = { newCount: number; learningCount: number; reviewCount: number };

export type Deck = {
  id: string;
  name: string;
  parent_id: string | null;
  scheduler_mode?: "legacy" | "fsrs";
  fsrs_params?: unknown;
  fsrs_optimized_at?: string | null;
  counts: DeckCounts;
};

export type NoteType = {
  id: string;
  name: string;
  builtin_key: string | null;
  fields: unknown;
  front_template?: string;
  back_template?: string;
  css?: string;
};

export type DecksPayload = {
  decks?: Deck[];
  noteTypes?: NoteType[];
  fsrsAvailable?: boolean;
  error?: string;
};

export type StudyCard = {
  id: string;
  prompt: string;
  answer: string;
};

export type StudyLimits = {
  effectiveNewLimit: number;
  effectiveReviewLimit: number;
  newServed?: number;
  reviewServed?: number;
  remainingNew: number;
  remainingReview: number;
};

export type BrowseRow = {
  id: string;
  deck_id: string;
  deckName: string;
  noteTypeName: string;
  prompt: string;
  answer: string;
  due_at: string | null;
  state: string;
  note: {
    id: string;
    suspended: boolean;
    flagged: boolean;
    tags: unknown;
  } | null;
};

export type CustomStudyMode = "increase_new" | "increase_review" | "forgotten" | "ahead" | "preview_new" | "state_tag";
export type CustomStateFilter = "new" | "due" | "all_random" | "all_added";

export type CustomStudySessionPayload = {
  mode: CustomStudyMode;
  name: string;
  reschedule: boolean;
  cards: Array<{
    id: string;
    prompt: string;
    answer: string;
    state: string;
    due_at: string | null;
    created_at: string;
    tags: string[];
  }>;
  counts: DeckCounts;
};

export type ImportPreset = {
  id: string;
  name: string;
  mapping: {
    deckId: string;
    noteTypeId: string;
    frontColumn: string;
    backColumn: string;
    tagsColumn: string;
  };
};

export type StatsPayload = {
  summary: { totalCards: number; totalReviews: number; retentionRate: number; dueTomorrow: number };
  workload7?: Array<{ day: string; due: number }>;
  forecast?: Array<{ day: string; due: number }>;
  forecastMode?: "daily" | "weekly";
  reviewCount?: Array<{ day: string; newCount: number; learning: number; relearning: number; young: number; mature: number }>;
  reviewTime?: Array<{ day: string; minutes: number }>;
  intervals?: { under1: number; d1to6: number; d7to20: number; d21to90: number; over90: number };
  hourly?: Array<{ hour: number; reviews: number; correctRate: number }>;
  answerButtons?: {
    new: { again: number; hard: number; good: number; easy: number };
    young: { again: number; hard: number; good: number; easy: number };
    mature: { again: number; hard: number; good: number; easy: number };
  };
  added?: Array<{ day: string; count: number }>;
  cardCounts?: { new: number; suspended: number; buried: number; reviewed: number };
  retention?: { month: number; year: number };
  today?: {
    studied: number;
    minutes: number;
    again: number;
    correctPct: number;
    learn: number;
    review: number;
    relearn: number;
    filtered: number;
  };
};

export type DecksViewName = "decks" | "browse" | "stats" | "study";

export const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => String(entry));
};
