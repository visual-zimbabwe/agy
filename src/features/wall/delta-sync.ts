import { z } from "zod";

export const deltaParamsSchema = z.object({
  wallId: z.string().uuid(),
});

const vocabularySchema = z.object({
  word: z.string(),
  sourceContext: z.string(),
  guessMeaning: z.string(),
  meaning: z.string(),
  ownSentence: z.string(),
  flipped: z.boolean().optional(),
  nextReviewAt: z.number(),
  lastReviewedAt: z.number().optional(),
  intervalDays: z.number(),
  reviewsCount: z.number(),
  lapses: z.number(),
  isFocus: z.boolean(),
  lastOutcome: z.enum(["again", "hard", "good", "easy"]).optional(),
});

const canonItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  interpretation: z.string().optional().default(""),
});

const canonSchema = z.object({
  mode: z.enum(["single", "list"]),
  title: z.string(),
  statement: z.string(),
  interpretation: z.string(),
  example: z.string(),
  source: z.string(),
  items: z.array(canonItemSchema),
});

const eisenhowerSchema = z.object({
  displayDate: z.string(),
  quadrants: z.object({
    doFirst: z.object({ title: z.string(), content: z.string() }),
    schedule: z.object({ title: z.string(), content: z.string() }),
    delegate: z.object({ title: z.string(), content: z.string() }),
    delete: z.object({ title: z.string(), content: z.string() }),
  }),
});

const bookmarkMetadataSchema = z.object({
  url: z.string(),
  finalUrl: z.string(),
  title: z.string(),
  description: z.string(),
  siteName: z.string(),
  domain: z.string(),
  faviconUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  kind: z.enum(["article", "video", "repo", "docs", "product", "post", "paper", "website"]),
  contentType: z.string().optional(),
});

const bookmarkSchema = z.object({
  url: z.string(),
  normalizedUrl: z.string(),
  metadata: bookmarkMetadataSchema.optional(),
  status: z.enum(["idle", "loading", "ready", "error"]),
  fetchedAt: z.number().optional(),
  lastSuccessAt: z.number().optional(),
  error: z.string().optional(),
});

const apodSchema = z.object({
  status: z.enum(["idle", "loading", "ready", "error"]),
  date: z.string().optional(),
  title: z.string().optional(),
  explanation: z.string().optional(),
  copyright: z.string().optional(),
  mediaType: z.enum(["image", "video", "other"]).optional(),
  imageUrl: z.string().optional(),
  fallbackImageUrl: z.string().optional(),
  pageUrl: z.string().optional(),
  fetchedAt: z.number().optional(),
  lastSuccessAt: z.number().optional(),
  error: z.string().optional(),
});

const privateNoteSchema = z.object({
  version: z.literal(1),
  salt: z.string(),
  iv: z.string(),
  ciphertext: z.string(),
  protectedAt: z.number(),
  updatedAt: z.number(),
});

const poetrySchema = z.object({
  status: z.enum(["idle", "loading", "ready", "error"]),
  dateKey: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  lines: z.array(z.string()),
  lineCount: z.number().optional(),
  sourceUrl: z.string().optional(),
  searchField: z.enum(["random", "author", "title", "lines", "linecount"]).optional(),
  searchQuery: z.string().optional(),
  matchType: z.enum(["partial", "exact"]).optional(),
  fetchedAt: z.number().optional(),
  lastSuccessAt: z.number().optional(),
  error: z.string().optional(),
});

const fileSchema = z.object({
  source: z.enum(["upload", "link"]),
  name: z.string(),
  url: z.string(),
  mimeType: z.string().optional(),
  extension: z.string().optional(),
  sizeBytes: z.number().optional(),
  uploadedAt: z.number().optional(),
});

const audioSchema = fileSchema.extend({
  durationSeconds: z.number().optional(),
});

const videoSchema = fileSchema.extend({
  durationSeconds: z.number().optional(),
  posterDataUrl: z.string().optional(),
});

const baseEntitySchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().nonnegative().optional(),
  deletedAt: z.number().optional(),
});

export const deltaNoteSchema = baseEntitySchema.extend({
  noteKind: z.enum(["standard", "quote", "canon", "journal", "eisenhower", "joker", "throne", "web-bookmark", "apod", "poetry", "image", "file", "audio", "video"]).optional(),
  text: z.string(),
  quoteAuthor: z.string().optional(),
  quoteSource: z.string().optional(),
  privateNote: privateNoteSchema.optional(),
  imageUrl: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  textVAlign: z.enum(["top", "middle", "bottom"]).optional(),
  textFont: z.string().optional(),
  textColor: z.string().optional(),
  pinned: z.boolean().optional(),
  highlighted: z.boolean().optional(),
  tags: z.array(z.string()),
  textSize: z.enum(["sm", "md", "lg"]).optional(),
  textSizePx: z.number().finite().min(8).max(72).transform((value) => Math.round(value)).optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  color: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  vocabulary: vocabularySchema.optional(),
  canon: canonSchema.optional(),
  eisenhower: eisenhowerSchema.optional(),
  bookmark: bookmarkSchema.optional(),
  apod: apodSchema.optional(),
  poetry: poetrySchema.optional(),
  file: fileSchema.optional(),
  audio: audioSchema.optional(),
  video: videoSchema.optional(),
});

export const deltaZoneSchema = baseEntitySchema.extend({
  label: z.string(),
  kind: z.enum(["frame", "column", "swimlane"]).optional(),
  groupId: z.string().optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  color: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const deltaZoneGroupSchema = baseEntitySchema.extend({
  label: z.string(),
  color: z.string(),
  zoneIds: z.array(z.string()),
  collapsed: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const deltaNoteGroupSchema = baseEntitySchema.extend({
  label: z.string(),
  color: z.string(),
  noteIds: z.array(z.string()),
  collapsed: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const deltaLinkSchema = baseEntitySchema.extend({
  fromNoteId: z.string(),
  toNoteId: z.string(),
  type: z.enum(["cause_effect", "dependency", "idea_execution", "wiki"]),
  label: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const deltaSyncRequestSchema = z.object({
  baseVersion: z.number().int().nonnegative(),
  camera: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number().positive().max(5),
    })
    .optional(),
  lastColor: z.string().optional(),
  notes: z.array(deltaNoteSchema).default([]),
  zones: z.array(deltaZoneSchema).default([]),
  zoneGroups: z.array(deltaZoneGroupSchema).default([]),
  noteGroups: z.array(deltaNoteGroupSchema).default([]),
  links: z.array(deltaLinkSchema).default([]),
});

export const sinceVersionSchema = z.object({
  since: z.coerce.number().int().nonnegative().default(0),
});

export type DeltaSyncRequest = z.infer<typeof deltaSyncRequestSchema>;
export type DeltaNote = z.infer<typeof deltaNoteSchema>;
export type DeltaZone = z.infer<typeof deltaZoneSchema>;
export type DeltaZoneGroup = z.infer<typeof deltaZoneGroupSchema>;
export type DeltaNoteGroup = z.infer<typeof deltaNoteGroupSchema>;
export type DeltaLink = z.infer<typeof deltaLinkSchema>;

export const toIso = (value: number) => new Date(value).toISOString();

export const toStoredTextSize = (value: { textSize?: "sm" | "md" | "lg"; textSizePx?: number }) =>
  typeof value.textSizePx === "number" ? `px:${Math.max(8, Math.min(72, Math.round(value.textSizePx)))}` : value.textSize ?? null;
