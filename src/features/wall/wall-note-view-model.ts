import { bookmarkDomainLabel } from "@/features/wall/bookmarks";
import { getAudioNoteMeta, getAudioNoteTitle } from "@/features/wall/audio-notes";
import { getFileNoteMeta, getFileNoteMetaCaps, getFileNoteTitle } from "@/features/wall/file-notes";
import { getImageNoteMeta, getImageNoteTitle, isImageNote } from "@/features/wall/image-notes";
import { isPrivateNote, privateNoteTitle } from "@/features/wall/private-notes";
import type { Note } from "@/features/wall/types";
import { getNoteWikiTitle, isUntitledWikiTitle } from "@/features/wall/wiki-links";
import { getVideoNoteMeta, getVideoNoteTitle } from "@/features/wall/video-notes";

export type WallNotePresentationSurface = "canvas-compact" | "canvas-full" | "preview" | "timeline";

export type WallNoteViewModelContext = {
  surface?: WallNotePresentationSurface;
  uppercaseMeta?: boolean;
};

export type WallNoteViewModel = {
  kind: string;
  title: string;
  meta: string;
  metaDisplay: string;
  privacyMaskLabel?: string;
  privacyMetaLabel?: string;
  standardTitle: string;
  standardBody: string;
  journalTitle: string;
  journalBody: string;
  imageCaption: string;
  imageMeta: string;
  badge: string;
};

const BARE_ATTACHMENT_PATTERN = /([\w-]+\.(pdf|docx?|txt|png|jpe?g|gif|webp|zip|csv|md|xlsx?|pptx?))/i;
const FILE_NAME_PATTERN = /([\w-]+\.(pdf|docx?|txt|png|jpe?g|zip|csv|md))/i;

export const stripWikiLinkMarkup = (text: string) => text.replace(/\[\[([^\]\n]+?)\]\]/g, "$1");

const getNoteTextLines = (note: Pick<Note, "text">) =>
  stripWikiLinkMarkup(note.text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const formatMetaDisplay = (meta: string, uppercaseMeta?: boolean) => (uppercaseMeta ? meta.toUpperCase() : meta);

const resolvePresentationBadge = (note: Note) =>
  note.noteKind ? note.noteKind.replaceAll("-", " ").toUpperCase() : "NOTE";

const getAttachmentFilename = (note: Note) => {
  if (note.noteKind === "file" || note.file?.name) {
    return getFileNoteTitle(note.file);
  }
  if (isImageNote(note)) {
    return getImageNoteTitle(note.file);
  }
  const match = stripWikiLinkMarkup(note.text).match(BARE_ATTACHMENT_PATTERN);
  return match?.[1];
};

const isFilenameOnlyFirstLine = (note: Note, firstLine: string) => {
  const filename = getAttachmentFilename(note);
  if (!filename) {
    return false;
  }
  return firstLine.toLowerCase() === filename.toLowerCase();
};

const getStructuredUserTitle = (note: Note) => {
  if (note.canon?.title?.trim()) {
    return note.canon.title.trim();
  }
  if (note.bookmark?.metadata?.title?.trim()) {
    return note.bookmark.metadata.title.trim();
  }
  if (note.noteKind === "audio" && note.audio) {
    return getAudioNoteTitle(note.audio);
  }
  if (note.noteKind === "video" && note.video) {
    return getVideoNoteTitle(note.video);
  }
  if (note.vocabulary?.word?.trim()) {
    return note.vocabulary.word.trim();
  }
  if (isPrivateNote(note)) {
    return privateNoteTitle(note);
  }
  if (note.noteKind === "file" || note.file?.name) {
    return getFileNoteTitle(note.file);
  }
  if (isImageNote(note)) {
    return getImageNoteTitle(note.file);
  }
  return undefined;
};

const resolveStandardSplit = (note: Pick<Note, "text">) => {
  const noteLines = getNoteTextLines(note);
  const standardTitle =
    noteLines.length > 1
      ? noteLines[0] ?? "Quick Thought"
      : noteLines.length === 1
        ? noteLines[0] ?? ""
        : "Quick Thought";
  const standardBody =
    noteLines.length > 1
      ? noteLines.slice(1).join("\n")
      : noteLines.length === 1
        ? ""
        : "Double-click or press Enter to edit";
  return { standardTitle, standardBody };
};

const resolveJournalSplit = (note: Pick<Note, "text">) => {
  const noteLines = getNoteTextLines(note);
  const stripped = stripWikiLinkMarkup(note.text);
  return {
    journalTitle: noteLines[0] ?? "Dear Wall,",
    journalBody: noteLines.slice(1).join("\n") || stripped || "Start writing",
  };
};

const resolvePresentationKind = (note: Note) => {
  if (isPrivateNote(note)) {
    return "private";
  }
  if (note.noteKind === "web-bookmark") {
    return "web-bookmark";
  }
  if (isImageNote(note)) {
    return "image";
  }
  if (note.noteKind === "audio") {
    return "audio";
  }
  if (note.noteKind === "video") {
    return "video";
  }
  if (note.noteKind === "file") {
    return "file";
  }
  if (note.noteKind) {
    return note.noteKind;
  }
  return "standard";
};

const resolveTitle = (note: Note) => {
  const structuredTitle = getStructuredUserTitle(note);
  if (structuredTitle && note.noteKind !== "file" && !note.file?.name) {
    return structuredTitle;
  }

  const [firstLine] = getNoteTextLines(note);
  if (firstLine && !isFilenameOnlyFirstLine(note, firstLine)) {
    return firstLine;
  }

  if (structuredTitle) {
    return structuredTitle;
  }

  const wikiTitle = getNoteWikiTitle(note);
  if (!isUntitledWikiTitle(wikiTitle)) {
    return wikiTitle;
  }

  const bareFilename = getAttachmentFilename(note);
  if (bareFilename) {
    return bareFilename;
  }

  if (note.vocabulary?.word?.trim()) {
    return note.vocabulary.word.trim();
  }

  return firstLine || wikiTitle || "Untitled note";
};

const resolveMeta = (note: Note, title: string) => {
  if (isPrivateNote(note)) {
    return "Secured node";
  }

  if (note.noteKind === "web-bookmark") {
    const metadata = note.bookmark?.metadata;
    const siteName = metadata?.siteName?.trim();
    const domain = bookmarkDomainLabel(metadata?.domain || note.bookmark?.normalizedUrl || note.bookmark?.url);
    return siteName || domain || "Link preview";
  }

  if (note.noteKind === "audio") {
    return getAudioNoteMeta(note.audio);
  }

  if (note.noteKind === "video") {
    return getVideoNoteMeta(note.video);
  }

  if (note.noteKind === "file" || note.file?.name) {
    return getFileNoteMeta(note.file);
  }

  if (isImageNote(note)) {
    return getImageNoteMeta(note.file);
  }

  const lines = getNoteTextLines(note);
  const secondaryLine = lines.find((line) => line !== title);
  if (secondaryLine) {
    return secondaryLine;
  }

  if (note.tags.length > 0) {
    const firstTag = note.tags[0] ?? "";
    return firstTag.startsWith("#") ? firstTag : `#${firstTag}`;
  }

  if (note.noteKind) {
    return note.noteKind.replaceAll("-", " ");
  }

  return "standard note";
};

const resolveFileMetaFromText = (note: Note, fileLabel: string) => {
  const stripped = stripWikiLinkMarkup(note.text);
  return stripped.replace(fileLabel, "").trim() || "File note";
};

export const getWallNoteViewModel = (note: Note, context: WallNoteViewModelContext = {}): WallNoteViewModel => {
  const uppercaseMeta = context.uppercaseMeta ?? context.surface === "canvas-full";
  const kind = resolvePresentationKind(note);
  const { standardTitle, standardBody } = resolveStandardSplit(note);
  const { journalTitle, journalBody } = resolveJournalSplit(note);
  const imageCaption = note.text.trim();
  const imageMeta = getImageNoteMeta(note.file);

  if (isPrivateNote(note)) {
    const privacyMaskLabel = "Secured node";
    return {
      kind,
      title: privateNoteTitle(note),
      meta: privacyMaskLabel,
      metaDisplay: formatMetaDisplay(privacyMaskLabel, uppercaseMeta),
      privacyMaskLabel,
      privacyMetaLabel: privacyMaskLabel,
      standardTitle,
      standardBody,
      journalTitle,
      journalBody,
      imageCaption,
      imageMeta,
      badge: resolvePresentationBadge(note),
    };
  }

  if (note.noteKind === "web-bookmark") {
    const title =
      note.bookmark?.metadata?.title?.trim()
      || note.bookmark?.metadata?.domain
      || note.bookmark?.url
      || "Bookmark";
    const meta = resolveMeta(note, title);
    return {
      kind,
      title,
      meta,
      metaDisplay: formatMetaDisplay(meta, uppercaseMeta),
      standardTitle,
      standardBody,
      journalTitle,
      journalBody,
      imageCaption,
      imageMeta,
      badge: resolvePresentationBadge(note),
    };
  }

  if (isImageNote(note)) {
    const title = getImageNoteTitle(note.file);
    const meta = imageMeta;
    return {
      kind,
      title,
      meta,
      metaDisplay: formatMetaDisplay(meta, uppercaseMeta),
      standardTitle,
      standardBody,
      journalTitle,
      journalBody,
      imageCaption,
      imageMeta,
      badge: resolvePresentationBadge(note),
    };
  }

  if (note.noteKind === "audio") {
    const title = getAudioNoteTitle(note.audio);
    const meta = getAudioNoteMeta(note.audio);
    return {
      kind,
      title,
      meta,
      metaDisplay: formatMetaDisplay(meta, uppercaseMeta),
      standardTitle,
      standardBody,
      journalTitle,
      journalBody,
      imageCaption,
      imageMeta,
      badge: resolvePresentationBadge(note),
    };
  }

  if (note.noteKind === "video") {
    const title = getVideoNoteTitle(note.video);
    const meta = getVideoNoteMeta(note.video);
    return {
      kind,
      title,
      meta,
      metaDisplay: formatMetaDisplay(meta, uppercaseMeta),
      standardTitle,
      standardBody,
      journalTitle,
      journalBody,
      imageCaption,
      imageMeta,
      badge: resolvePresentationBadge(note),
    };
  }

  if (note.noteKind === "file") {
    const title = resolveTitle(note);
    const meta = getFileNoteMeta(note.file);
    return {
      kind,
      title,
      meta,
      metaDisplay: formatMetaDisplay(uppercaseMeta ? getFileNoteMetaCaps(note.file) : meta, uppercaseMeta),
      standardTitle,
      standardBody,
      journalTitle,
      journalBody,
      imageCaption,
      imageMeta,
      badge: resolvePresentationBadge(note),
    };
  }

  const fileNameMatch = stripWikiLinkMarkup(note.text).match(FILE_NAME_PATTERN);
  if (fileNameMatch && !note.noteKind) {
    const fileLabel = fileNameMatch[1] ?? "Document";
    const meta = resolveFileMetaFromText(note, fileLabel);
    return {
      kind: "file",
      title: fileLabel,
      meta,
      metaDisplay: formatMetaDisplay(meta, uppercaseMeta),
      standardTitle,
      standardBody,
      journalTitle,
      journalBody,
      imageCaption,
      imageMeta,
      badge: "FILE",
    };
  }

  const title = resolveTitle(note);
  const meta = resolveMeta(note, title);

  return {
    kind,
    title,
    meta,
    metaDisplay: formatMetaDisplay(meta, uppercaseMeta),
    standardTitle,
    standardBody,
    journalTitle,
    journalBody,
    imageCaption,
    imageMeta,
    badge: resolvePresentationBadge(note),
  };
};
