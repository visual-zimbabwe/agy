export type BuiltinDeckNoteTypeKey =
  | "basic"
  | "basic_reversed"
  | "basic_optional_reversed"
  | "cloze";

export type DeckNoteTypeDefinition = {
  name: string;
  builtinKey: BuiltinDeckNoteTypeKey;
  fields: string[];
  frontTemplate: string;
  backTemplate: string;
  css: string;
};

export type GeneratedDeckCard = {
  ordinal: number;
  prompt: string;
  answer: string;
};

export const builtinDeckNoteTypes: DeckNoteTypeDefinition[] = [
  {
    name: "Basic",
    builtinKey: "basic",
    fields: ["Front", "Back"],
    frontTemplate: "{{Front}}",
    backTemplate: "{{Front}}\n\n{{Back}}",
    css: "",
  },
  {
    name: "Basic (and reversed card)",
    builtinKey: "basic_reversed",
    fields: ["Front", "Back"],
    frontTemplate: "{{Front}}",
    backTemplate: "{{Front}}\n\n{{Back}}",
    css: "",
  },
  {
    name: "Basic (optional reversed card)",
    builtinKey: "basic_optional_reversed",
    fields: ["Front", "Back", "Reverse"],
    frontTemplate: "{{Front}}",
    backTemplate: "{{Front}}\n\n{{Back}}",
    css: "",
  },
  {
    name: "Cloze",
    builtinKey: "cloze",
    fields: ["Text", "Extra"],
    frontTemplate: "{{cloze:Text}}",
    backTemplate: "{{Text}}\n\n{{Extra}}",
    css: "",
  },
];

const normalizeFieldValue = (value: unknown) => (typeof value === "string" ? value : "");

const renderTemplate = (template: string, fields: Record<string, string>) =>
  template.replace(/\{\{([^}]+)\}\}/g, (_whole, rawKey) => {
    const key = String(rawKey).trim();
    if (key.startsWith("cloze:")) {
      const target = key.slice("cloze:".length);
      return fields[target] ?? "";
    }
    return fields[key] ?? "";
  });

const toPlainText = (value: string) => value.replace(/<[^>]+>/g, "").trim();

const uniqueOrdered = (values: number[]) => {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }
  return result.sort((a, b) => a - b);
};

const extractClozeOrdinals = (text: string) => {
  const matches = [...text.matchAll(/\{\{c(\d+)::/gi)];
  return uniqueOrdered(
    matches
      .map((match) => Number(match[1]))
      .filter((value) => Number.isFinite(value) && value > 0),
  );
};

const revealClozeAnswer = (text: string, ordinal: number) =>
  text.replace(/\{\{c(\d+)::(.*?)(?:::(.*?))?\}\}/gi, (_whole, rawIndex, inner, hint) => {
    const index = Number(rawIndex);
    if (index === ordinal) {
      return inner;
    }
    return hint ? `${inner} (${hint})` : inner;
  });

const hideClozePrompt = (text: string, ordinal: number) =>
  text.replace(/\{\{c(\d+)::(.*?)(?:::(.*?))?\}\}/gi, (_whole, rawIndex, inner, hint) => {
    const index = Number(rawIndex);
    if (index === ordinal) {
      return hint ? `[${hint}]` : "[...]";
    }
    return inner;
  });

export const createDeckCardsFromNote = (options: {
  builtinKey: string | null;
  frontTemplate: string;
  backTemplate: string;
  fields: Record<string, unknown>;
}): GeneratedDeckCard[] => {
  const normalizedFields = Object.fromEntries(
    Object.entries(options.fields).map(([key, value]) => [key, normalizeFieldValue(value)]),
  ) as Record<string, string>;
  const key = options.builtinKey as BuiltinDeckNoteTypeKey | null;

  if (key === "cloze") {
    const clozeSource = normalizedFields.Text ?? "";
    const ordinals = extractClozeOrdinals(clozeSource);
    if (ordinals.length === 0) {
      return [
        {
          ordinal: 0,
          prompt: toPlainText(clozeSource),
          answer: toPlainText(clozeSource),
        },
      ];
    }
    return ordinals.map((ordinal, index) => ({
      ordinal: index,
      prompt: toPlainText(hideClozePrompt(clozeSource, ordinal)),
      answer: toPlainText(revealClozeAnswer(clozeSource, ordinal)),
    }));
  }

  const front = toPlainText(renderTemplate(options.frontTemplate, normalizedFields));
  const back = toPlainText(renderTemplate(options.backTemplate, normalizedFields));

  if (key === "basic_reversed") {
    return [
      { ordinal: 0, prompt: front, answer: back },
      { ordinal: 1, prompt: back, answer: front },
    ];
  }

  if (key === "basic_optional_reversed") {
    const reverseField = (normalizedFields.Reverse ?? "").trim();
    if (!reverseField) {
      return [{ ordinal: 0, prompt: front, answer: back }];
    }
    return [
      { ordinal: 0, prompt: front, answer: back },
      { ordinal: 1, prompt: back, answer: front },
    ];
  }

  return [{ ordinal: 0, prompt: front, answer: back }];
};

export type ReviewRating = "again" | "hard" | "good" | "easy";
export type CardState = "new" | "learning" | "review";

export type CardSchedulingInput = {
  state: CardState;
  step: number;
  intervalDays: number;
  easeFactor: number;
  reps: number;
  lapses: number;
  rating: ReviewRating;
  now: Date;
};

export type CardSchedulingResult = {
  nextState: CardState;
  nextStep: number;
  nextIntervalDays: number;
  nextEaseFactor: number;
  nextReps: number;
  nextLapses: number;
  dueAt: Date;
};

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

export const scheduleDeckCard = (input: CardSchedulingInput): CardSchedulingResult => {
  const ease = Math.max(1.3, input.easeFactor);
  if (input.state === "new") {
    if (input.rating === "again") {
      return {
        nextState: "learning",
        nextStep: 1,
        nextIntervalDays: 0,
        nextEaseFactor: Math.max(1.3, ease - 0.2),
        nextReps: input.reps + 1,
        nextLapses: input.lapses + 1,
        dueAt: addMinutes(input.now, 1),
      };
    }
    if (input.rating === "hard") {
      return {
        nextState: "learning",
        nextStep: 2,
        nextIntervalDays: 0,
        nextEaseFactor: Math.max(1.3, ease - 0.12),
        nextReps: input.reps + 1,
        nextLapses: input.lapses,
        dueAt: addMinutes(input.now, 10),
      };
    }
    if (input.rating === "easy") {
      return {
        nextState: "review",
        nextStep: 0,
        nextIntervalDays: 4,
        nextEaseFactor: ease + 0.1,
        nextReps: input.reps + 1,
        nextLapses: input.lapses,
        dueAt: addDays(input.now, 4),
      };
    }
    return {
      nextState: "review",
      nextStep: 0,
      nextIntervalDays: 1,
      nextEaseFactor: ease,
      nextReps: input.reps + 1,
      nextLapses: input.lapses,
      dueAt: addDays(input.now, 1),
    };
  }

  if (input.state === "learning") {
    if (input.rating === "again") {
      return {
        nextState: "learning",
        nextStep: Math.max(1, input.step - 1),
        nextIntervalDays: 0,
        nextEaseFactor: Math.max(1.3, ease - 0.2),
        nextReps: input.reps + 1,
        nextLapses: input.lapses + 1,
        dueAt: addMinutes(input.now, 1),
      };
    }
    if (input.rating === "hard") {
      return {
        nextState: "learning",
        nextStep: Math.max(1, input.step),
        nextIntervalDays: 0,
        nextEaseFactor: Math.max(1.3, ease - 0.1),
        nextReps: input.reps + 1,
        nextLapses: input.lapses,
        dueAt: addMinutes(input.now, 10),
      };
    }
    if (input.rating === "easy") {
      const interval = Math.max(3, Math.round(Math.max(1, input.intervalDays || 1) * 2.2));
      return {
        nextState: "review",
        nextStep: 0,
        nextIntervalDays: interval,
        nextEaseFactor: ease + 0.1,
        nextReps: input.reps + 1,
        nextLapses: input.lapses,
        dueAt: addDays(input.now, interval),
      };
    }
    if (input.step >= 2) {
      const interval = Math.max(1, input.intervalDays || 1);
      return {
        nextState: "review",
        nextStep: 0,
        nextIntervalDays: interval,
        nextEaseFactor: ease,
        nextReps: input.reps + 1,
        nextLapses: input.lapses,
        dueAt: addDays(input.now, interval),
      };
    }
    return {
      nextState: "learning",
      nextStep: input.step + 1,
      nextIntervalDays: 0,
      nextEaseFactor: ease,
      nextReps: input.reps + 1,
      nextLapses: input.lapses,
      dueAt: addMinutes(input.now, 10),
    };
  }

  if (input.rating === "again") {
    return {
      nextState: "learning",
      nextStep: 1,
      nextIntervalDays: Math.max(1, Math.round(Math.max(1, input.intervalDays) * 0.5)),
      nextEaseFactor: Math.max(1.3, ease - 0.2),
      nextReps: input.reps + 1,
      nextLapses: input.lapses + 1,
      dueAt: addMinutes(input.now, 10),
    };
  }
  if (input.rating === "hard") {
    const interval = Math.max(1, Math.round(Math.max(1, input.intervalDays) * 1.2));
    return {
      nextState: "review",
      nextStep: 0,
      nextIntervalDays: interval,
      nextEaseFactor: Math.max(1.3, ease - 0.08),
      nextReps: input.reps + 1,
      nextLapses: input.lapses,
      dueAt: addDays(input.now, interval),
    };
  }
  if (input.rating === "easy") {
    const interval = Math.max(1, Math.round(Math.max(1, input.intervalDays) * Math.max(2.2, ease + 0.4)));
    return {
      nextState: "review",
      nextStep: 0,
      nextIntervalDays: interval,
      nextEaseFactor: ease + 0.1,
      nextReps: input.reps + 1,
      nextLapses: input.lapses,
      dueAt: addDays(input.now, interval),
    };
  }
  const interval = Math.max(1, Math.round(Math.max(1, input.intervalDays) * Math.max(1.6, ease)));
  return {
    nextState: "review",
    nextStep: 0,
    nextIntervalDays: interval,
    nextEaseFactor: ease,
    nextReps: input.reps + 1,
    nextLapses: input.lapses,
    dueAt: addDays(input.now, interval),
  };
};
