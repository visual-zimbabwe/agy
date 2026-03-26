import { NOTE_DEFAULTS } from "@/features/wall/constants";
import { buildBookmarkFallbackMetadata, normalizeBookmarkUrl } from "@/features/wall/bookmarks";
import { normalizeAudioNote } from "@/features/wall/audio-notes";
import { normalizeFileNote } from "@/features/wall/file-notes";
import { defaultCurrencyNoteState, inferCurrencyTrend } from "@/features/wall/currency";
import { normalizeEisenhowerNote } from "@/features/wall/eisenhower";
import type { ApodNote, CanonNote, CurrencyNote, Link, Note, NoteGroup, PersistedWallState, PrivateNoteData, VocabularyReviewOutcome, WebBookmarkMetadata, WebBookmarkNote, Zone, ZoneGroup } from "@/features/wall/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asNumber = (value: unknown, fallback = 0) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
const asString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

const normalizeStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const normalizeVocabulary = (value: unknown) => {
  if (!isRecord(value)) {
    return undefined;
  }

  const nextReviewAt = asNumber(value.nextReviewAt, Date.now());
  const intervalDays = Math.max(0, asNumber(value.intervalDays, 0));
  const lapses = Math.max(0, asNumber(value.lapses, 0));
  const lastOutcome: VocabularyReviewOutcome | undefined =
    value.lastOutcome === "again" || value.lastOutcome === "hard" || value.lastOutcome === "good" || value.lastOutcome === "easy"
      ? value.lastOutcome
      : undefined;

  return {
    word: asString(value.word),
    sourceContext: asString(value.sourceContext),
    guessMeaning: asString(value.guessMeaning),
    meaning: asString(value.meaning),
    ownSentence: asString(value.ownSentence),
    flipped: Boolean(value.flipped),
    nextReviewAt,
    lastReviewedAt: typeof value.lastReviewedAt === "number" ? asNumber(value.lastReviewedAt) : undefined,
    intervalDays,
    reviewsCount: Math.max(0, asNumber(value.reviewsCount, 0)),
    lapses,
    isFocus: typeof value.isFocus === "boolean" ? value.isFocus : lapses >= 3,
    lastOutcome,
  };
};

const normalizeCanon = (value: unknown): CanonNote | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const mode: CanonNote["mode"] = value.mode === "list" ? "list" : "single";
  const items = Array.isArray(value.items)
    ? value.items
        .filter((entry): entry is Record<string, unknown> => isRecord(entry))
        .map((entry) => ({
          id: asString(entry.id) || Math.random().toString(36).slice(2, 11),
          title: asString(entry.title),
          text: asString(entry.text),
          interpretation: asString(entry.interpretation),
        }))
    : [];

  return {
    mode,
    title: asString(value.title),
    statement: asString(value.statement),
    interpretation: asString(value.interpretation),
    example: asString(value.example),
    source: asString(value.source),
    items: items.length > 0 ? items : [{ id: Math.random().toString(36).slice(2, 11), title: "", text: "", interpretation: "" }],
  };
};

const normalizeCurrency = (value: unknown): CurrencyNote | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const defaults = defaultCurrencyNoteState();
  const usdRate = Math.max(0, asNumber(value.usdRate, defaults.usdRate));
  const previousUsdRate = typeof value.previousUsdRate === "number" ? Math.max(0, asNumber(value.previousUsdRate)) : undefined;
  const inferredTrend = inferCurrencyTrend(usdRate, previousUsdRate);

  return {
    status:
      value.status === "idle" || value.status === "locating" || value.status === "loading" || value.status === "ready" || value.status === "error"
        ? value.status
        : defaults.status,
    detectedCountryCode: asString(value.detectedCountryCode).toUpperCase() || undefined,
    detectedCountryName: asString(value.detectedCountryName) || undefined,
    detectedCurrency: asString(value.detectedCurrency).toUpperCase() || undefined,
    baseCurrency: asString(value.baseCurrency, defaults.baseCurrency).toUpperCase() || defaults.baseCurrency,
    baseCurrencyMode: value.baseCurrencyMode === "manual" ? "manual" : "auto",
    manualBaseCurrency: asString(value.manualBaseCurrency).toUpperCase() || undefined,
    amountInput: asString(value.amountInput, defaults.amountInput),
    usdRate,
    previousUsdRate,
    thousandValueUsd: Math.max(0, asNumber(value.thousandValueUsd, usdRate * 1000)),
    rateUpdatedAt: typeof value.rateUpdatedAt === "number" ? asNumber(value.rateUpdatedAt) : undefined,
    rateSource: value.rateSource === "live" || value.rateSource === "cache" || value.rateSource === "default" ? value.rateSource : defaults.rateSource,
    detectionSource:
      value.detectionSource === "geolocation" || value.detectionSource === "ip" || value.detectionSource === "manual" || value.detectionSource === "default"
        ? value.detectionSource
        : defaults.detectionSource,
    trend: value.trend === "up" || value.trend === "down" || value.trend === "flat" ? value.trend : inferredTrend,
    error: asString(value.error) || undefined,
  };
};

const normalizeBookmarkMetadata = (value: unknown): WebBookmarkMetadata | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const finalUrl = normalizeBookmarkUrl(asString(value.finalUrl) || asString(value.url));
  if (!finalUrl) {
    return undefined;
  }
  const fallback = buildBookmarkFallbackMetadata(finalUrl);
  return {
    url: normalizeBookmarkUrl(asString(value.url)) || finalUrl,
    finalUrl,
    title: asString(value.title, fallback.title),
    description: asString(value.description),
    siteName: asString(value.siteName, fallback.siteName),
    domain: asString(value.domain, fallback.domain),
    faviconUrl: asString(value.faviconUrl) || fallback.faviconUrl,
    imageUrl: asString(value.imageUrl) || undefined,
    kind:
      value.kind === "article" ||
      value.kind === "video" ||
      value.kind === "repo" ||
      value.kind === "docs" ||
      value.kind === "product" ||
      value.kind === "post" ||
      value.kind === "paper"
        ? value.kind
        : "website",
    contentType: asString(value.contentType) || undefined,
  };
};

const normalizeBookmark = (value: unknown): WebBookmarkNote | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const normalizedUrl = normalizeBookmarkUrl(asString(value.normalizedUrl) || asString(value.url));
  if (!normalizedUrl) {
    return undefined;
  }

  return {
    url: asString(value.url, normalizedUrl),
    normalizedUrl,
    metadata: normalizeBookmarkMetadata(value.metadata) ?? buildBookmarkFallbackMetadata(normalizedUrl),
    status: value.status === "loading" || value.status === "ready" || value.status === "error" ? value.status : "idle",
    fetchedAt: typeof value.fetchedAt === "number" ? asNumber(value.fetchedAt) : undefined,
    lastSuccessAt: typeof value.lastSuccessAt === "number" ? asNumber(value.lastSuccessAt) : undefined,
    error: asString(value.error) || undefined,
  };
};

const normalizePrivateNote = (value: unknown): PrivateNoteData | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    version: 1,
    salt: asString(value.salt),
    iv: asString(value.iv),
    ciphertext: asString(value.ciphertext),
    protectedAt: asNumber(value.protectedAt),
    updatedAt: asNumber(value.updatedAt),
  };
};

const normalizeApod = (value: unknown): ApodNote | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    status: value.status === "loading" || value.status === "ready" || value.status === "error" ? value.status : "idle",
    date: asString(value.date) || undefined,
    title: asString(value.title) || undefined,
    explanation: asString(value.explanation) || undefined,
    copyright: asString(value.copyright) || undefined,
    mediaType: value.mediaType === "image" || value.mediaType === "video" ? value.mediaType : "other",
    imageUrl: asString(value.imageUrl) || undefined,
    fallbackImageUrl: asString(value.fallbackImageUrl) || undefined,
    pageUrl: asString(value.pageUrl) || undefined,
    fetchedAt: typeof value.fetchedAt === "number" ? asNumber(value.fetchedAt) : undefined,
    lastSuccessAt: typeof value.lastSuccessAt === "number" ? asNumber(value.lastSuccessAt) : undefined,
    error: asString(value.error) || undefined,
  };
};

const normalizeNoteFont = (value: unknown) => {
  if (
    value === "newsreader" ||
    value === "roboto" ||
    value === "open_sans" ||
    value === "lato" ||
    value === "montserrat" ||
    value === "poppins" ||
    value === "nunito" ||
    value === "source_sans_3" ||
    value === "inter" ||
    value === "raleway" ||
    value === "ubuntu" ||
    value === "playfair_display" ||
    value === "merriweather" ||
    value === "pt_sans" ||
    value === "noto_sans" ||
    value === "work_sans" ||
    value === "oswald" ||
    value === "rubik" ||
    value === "fira_sans" ||
    value === "josefin_sans" ||
    value === "quicksand" ||
    value === "patrick_hand"
  ) {
    return value;
  }
  return "nunito";
};

const normalizeCamera = (value: unknown) => {
  if (!isRecord(value)) {
    return { x: 0, y: 0, zoom: 1 };
  }
  const zoom = asNumber(value.zoom, 1);
  return {
    x: asNumber(value.x),
    y: asNumber(value.y),
    zoom: zoom > 0 ? zoom : 1,
  };
};

const normalizeEntityRecord = <T>(
  value: unknown,
  normalize: (entry: Record<string, unknown>, id: string) => T | null,
): Record<string, T> | null => {
  if (isRecord(value)) {
    const entries = Object.entries(value);
    const normalized: Record<string, T> = {};
    for (const [id, raw] of entries) {
      if (!isRecord(raw)) {
        continue;
      }
      const item = normalize(raw, id);
      if (item) {
        normalized[id] = item;
      }
    }
    return normalized;
  }

  if (Array.isArray(value)) {
    const normalized: Record<string, T> = {};
    for (const raw of value) {
      if (!isRecord(raw)) {
        continue;
      }
      const candidateId = raw.id;
      if (typeof candidateId !== "string" || !candidateId) {
        continue;
      }
      const item = normalize(raw, candidateId);
      if (item) {
        normalized[candidateId] = item;
      }
    }
    return normalized;
  }

  return null;
};

const normalizeNote = (entry: Record<string, unknown>, fallbackId: string): Note | null => {
  const id = asString(entry.id, fallbackId);
  if (!id) {
    return null;
  }
  const noteKind =
    entry.noteKind === "quote" ||
    entry.noteKind === "canon" ||
    entry.noteKind === "journal" ||
    entry.noteKind === "eisenhower" ||
    entry.noteKind === "joker" ||
    entry.noteKind === "throne" ||
    entry.noteKind === "currency" ||
    entry.noteKind === "web-bookmark" ||
    entry.noteKind === "apod" ||
    entry.noteKind === "poetry" ||
    entry.noteKind === "economist" ||
    entry.noteKind === "file" ||
    entry.noteKind === "audio"
      ? entry.noteKind
      : "standard";
  return {
    id,
    noteKind,
    text: asString(entry.text),
    quoteAuthor: asString(entry.quoteAuthor).trim() || undefined,
    quoteSource: asString(entry.quoteSource).trim() || undefined,
    privateNote: normalizePrivateNote(entry.privateNote),
    canon: normalizeCanon(entry.canon),
    eisenhower: noteKind === "eisenhower" ? normalizeEisenhowerNote(entry.eisenhower, asNumber(entry.createdAt, Date.now())) : undefined,
    currency: noteKind === "currency" ? normalizeCurrency(entry.currency) : undefined,
    bookmark: noteKind === "web-bookmark" ? normalizeBookmark(entry.bookmark) : undefined,
    apod: noteKind === "apod" ? normalizeApod(entry.apod) : undefined,
    file: noteKind === "file" ? normalizeFileNote(entry.file) : undefined,
    audio: noteKind === "audio" ? normalizeAudioNote(entry.audio ?? entry.file) : undefined,
    poetry:
      noteKind === "poetry" && isRecord(entry.poetry)
        ? {
            status: entry.poetry.status === "loading" || entry.poetry.status === "ready" || entry.poetry.status === "error" ? entry.poetry.status : "idle",
            dateKey: asString(entry.poetry.dateKey) || undefined,
            title: asString(entry.poetry.title) || undefined,
            author: asString(entry.poetry.author) || undefined,
            lines: normalizeStringList(entry.poetry.lines),
            lineCount: typeof entry.poetry.lineCount === "number" ? asNumber(entry.poetry.lineCount) : undefined,
            sourceUrl: asString(entry.poetry.sourceUrl) || undefined,
            searchField:
              entry.poetry.searchField === "author" || entry.poetry.searchField === "title" || entry.poetry.searchField === "lines" || entry.poetry.searchField === "linecount"
                ? entry.poetry.searchField
                : "random",
            searchQuery: asString(entry.poetry.searchQuery) || "",
            matchType: entry.poetry.matchType === "exact" ? "exact" : "partial",
            fetchedAt: typeof entry.poetry.fetchedAt === "number" ? asNumber(entry.poetry.fetchedAt) : undefined,
            lastSuccessAt: typeof entry.poetry.lastSuccessAt === "number" ? asNumber(entry.poetry.lastSuccessAt) : undefined,
            error: asString(entry.poetry.error) || undefined,
          }
        : undefined,
    imageUrl: asString(entry.imageUrl).trim() || undefined,
    textAlign: entry.textAlign === "center" || entry.textAlign === "right" ? entry.textAlign : "left",
    textVAlign: entry.textVAlign === "middle" || entry.textVAlign === "bottom" ? entry.textVAlign : NOTE_DEFAULTS.textVAlign,
    textFont: normalizeNoteFont(entry.textFont),
    textColor: asString(entry.textColor, NOTE_DEFAULTS.textColor),
    textSizePx:
      typeof entry.textSizePx === "number" && Number.isFinite(entry.textSizePx) ? Math.round(Math.max(8, Math.min(72, entry.textSizePx))) : NOTE_DEFAULTS.textSizePx,
    tags: normalizeStringList(entry.tags),
    textSize: entry.textSize === "sm" || entry.textSize === "md" || entry.textSize === "lg" ? entry.textSize : NOTE_DEFAULTS.textSize,
    pinned: Boolean(entry.pinned),
    highlighted: Boolean(entry.highlighted),
    x: asNumber(entry.x),
    y: asNumber(entry.y),
    w: asNumber(entry.w),
    h: asNumber(entry.h),
    color: asString(entry.color),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
    vocabulary: normalizeVocabulary(entry.vocabulary),
  };
};

const normalizeZone = (entry: Record<string, unknown>, fallbackId: string): Zone | null => {
  const id = asString(entry.id, fallbackId);
  if (!id) {
    return null;
  }
  const groupId = typeof entry.groupId === "string" && entry.groupId ? entry.groupId : undefined;
  const kind = entry.kind === "column" || entry.kind === "swimlane" ? entry.kind : "frame";
  return {
    id,
    label: asString(entry.label),
    kind,
    groupId,
    x: asNumber(entry.x),
    y: asNumber(entry.y),
    w: asNumber(entry.w),
    h: asNumber(entry.h),
    color: asString(entry.color),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
  };
};

const normalizeZoneGroup = (entry: Record<string, unknown>, fallbackId: string): ZoneGroup | null => {
  const id = asString(entry.id, fallbackId);
  if (!id) {
    return null;
  }
  return {
    id,
    label: asString(entry.label),
    color: asString(entry.color),
    zoneIds: normalizeStringList(entry.zoneIds),
    collapsed: Boolean(entry.collapsed),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
  };
};

const normalizeLink = (entry: Record<string, unknown>, fallbackId: string): Link | null => {
  const id = asString(entry.id, fallbackId);
  if (!id) {
    return null;
  }

  const type = entry.type === "dependency" || entry.type === "idea_execution" || entry.type === "wiki" ? entry.type : "cause_effect";
  return {
    id,
    fromNoteId: asString(entry.fromNoteId),
    toNoteId: asString(entry.toNoteId),
    type,
    label: asString(entry.label),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
  };
};

const normalizeNoteGroup = (entry: Record<string, unknown>, fallbackId: string): NoteGroup | null => {
  const id = asString(entry.id, fallbackId);
  if (!id) {
    return null;
  }
  return {
    id,
    label: asString(entry.label),
    color: asString(entry.color),
    noteIds: normalizeStringList(entry.noteIds),
    collapsed: Boolean(entry.collapsed),
    createdAt: asNumber(entry.createdAt),
    updatedAt: asNumber(entry.updatedAt),
  };
};

export const normalizePersistedWallState = (value: unknown): PersistedWallState | null => {
  if (!isRecord(value)) {
    return null;
  }

  const notes = normalizeEntityRecord(value.notes, normalizeNote);
  const zones = normalizeEntityRecord(value.zones, normalizeZone);
  if (!notes || !zones) {
    return null;
  }

  const zoneGroups = normalizeEntityRecord(value.zoneGroups ?? {}, normalizeZoneGroup) ?? {};
  const noteGroups = normalizeEntityRecord(value.noteGroups ?? {}, normalizeNoteGroup) ?? {};
  const links = normalizeEntityRecord(value.links ?? {}, normalizeLink) ?? {};

  return {
    notes,
    zones,
    zoneGroups,
    noteGroups,
    links,
    camera: normalizeCamera(value.camera),
    lastColor: typeof value.lastColor === "string" ? value.lastColor : undefined,
  };
};

export const parseTimelinePayload = (payload: string): PersistedWallState | null => {
  try {
    const parsed = JSON.parse(payload) as unknown;
    return normalizePersistedWallState(parsed);
  } catch {
    return null;
  }
};


