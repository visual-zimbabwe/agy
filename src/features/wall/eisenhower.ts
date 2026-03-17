import type { EisenhowerNote, EisenhowerQuadrantKey, Note } from "@/features/wall/types";

export const EISENHOWER_QUADRANTS: Array<{
  key: EisenhowerQuadrantKey;
  title: string;
  shortTitle: string;
  placeholder: string;
  tint: string;
}> = [
  {
    key: "doFirst",
    title: "Do First",
    shortTitle: "Do",
    placeholder: "High-priority tasks to complete today...",
    tint: "#F4E5E1",
  },
  {
    key: "schedule",
    title: "Schedule",
    shortTitle: "Plan",
    placeholder: "Important tasks to plan...",
    tint: "#E7ECF6",
  },
  {
    key: "delegate",
    title: "Delegate",
    shortTitle: "Delegate",
    placeholder: "Tasks to assign or outsource...",
    tint: "#F4ECD8",
  },
  {
    key: "delete",
    title: "Delete",
    shortTitle: "Drop",
    placeholder: "Low-value tasks to remove...",
    tint: "#ECE8E1",
  },
] as const;

const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export const formatEisenhowerDisplayDate = (timestamp: number) => displayDateFormatter.format(new Date(timestamp));

export const createEisenhowerNotePayload = (timestamp = Date.now()): EisenhowerNote => ({
  displayDate: formatEisenhowerDisplayDate(timestamp),
  quadrants: {
    doFirst: { title: "Do First", content: "" },
    schedule: { title: "Schedule", content: "" },
    delegate: { title: "Delegate", content: "" },
    delete: { title: "Delete", content: "" },
  },
});

export const normalizeEisenhowerNote = (value: unknown, timestamp = Date.now()): EisenhowerNote => {
  const fallback = createEisenhowerNotePayload(timestamp);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const source = value as Partial<EisenhowerNote>;
  const quadrants = source.quadrants && typeof source.quadrants === "object" ? source.quadrants : fallback.quadrants;

  return {
    displayDate: typeof source.displayDate === "string" && source.displayDate.trim() ? source.displayDate : fallback.displayDate,
    quadrants: {
      doFirst: {
        title: typeof quadrants.doFirst?.title === "string" && quadrants.doFirst.title.trim() ? quadrants.doFirst.title : fallback.quadrants.doFirst.title,
        content: typeof quadrants.doFirst?.content === "string" ? quadrants.doFirst.content : "",
      },
      schedule: {
        title: typeof quadrants.schedule?.title === "string" && quadrants.schedule.title.trim() ? quadrants.schedule.title : fallback.quadrants.schedule.title,
        content: typeof quadrants.schedule?.content === "string" ? quadrants.schedule.content : "",
      },
      delegate: {
        title: typeof quadrants.delegate?.title === "string" && quadrants.delegate.title.trim() ? quadrants.delegate.title : fallback.quadrants.delegate.title,
        content: typeof quadrants.delegate?.content === "string" ? quadrants.delegate.content : "",
      },
      delete: {
        title: typeof quadrants.delete?.title === "string" && quadrants.delete.title.trim() ? quadrants.delete.title : fallback.quadrants.delete.title,
        content: typeof quadrants.delete?.content === "string" ? quadrants.delete.content : "",
      },
    },
  };
};

export const countEisenhowerTasks = (content: string) =>
  content
    .split(/\n+/)
    .map((entry) => entry.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean).length;

export const getEisenhowerTotalTaskCount = (note: Pick<Note, "eisenhower">) =>
  EISENHOWER_QUADRANTS.reduce((total, quadrant) => total + countEisenhowerTasks(note.eisenhower?.quadrants[quadrant.key]?.content ?? ""), 0);

export const getEisenhowerPreview = (note: Pick<Note, "eisenhower">) => {
  for (const quadrant of EISENHOWER_QUADRANTS) {
    const content = note.eisenhower?.quadrants[quadrant.key]?.content?.trim();
    if (content) {
      return `${note.eisenhower?.quadrants[quadrant.key]?.title ?? quadrant.title}: ${content.split("\n")[0]}`;
    }
  }
  return "Four-quadrant priority matrix";
};
