import { getAudioNoteMeta, getAudioNoteTitle } from "@/features/wall/audio-notes";
import { getFileNoteMetaCaps, getFileNoteTitle } from "@/features/wall/file-notes";
import { isPrivateNote, privateNoteTitle } from "@/features/wall/private-notes";
import type { Note } from "@/features/wall/types";
import { getVideoNoteMeta, getVideoNoteTitle } from "@/features/wall/video-notes";

export type WallNoteViewModel = {
  title: string;
  meta: string;
  privacyMaskLabel?: string;
};

export const stripWikiLinkMarkup = (text: string) => text.replace(/\[\[([^\]\n]+?)\]\]/g, "$1");

export const getWallNoteViewModel = (note: Note): WallNoteViewModel => {
  if (isPrivateNote(note)) {
    return {
      title: privateNoteTitle(note),
      meta: "Secured node",
      privacyMaskLabel: "Secured node",
    };
  }

  if (note.noteKind === "web-bookmark") {
    return {
      title: note.bookmark?.metadata?.title?.trim() || note.bookmark?.metadata?.domain || note.bookmark?.url || "Bookmark",
      meta: note.bookmark?.metadata?.siteName?.trim() || note.bookmark?.metadata?.domain || "Link preview",
    };
  }

  if (note.noteKind === "audio") {
    return {
      title: getAudioNoteTitle(note.audio),
      meta: getAudioNoteMeta(note.audio),
    };
  }

  if (note.noteKind === "video") {
    return {
      title: getVideoNoteTitle(note.video),
      meta: getVideoNoteMeta(note.video),
    };
  }

  if (note.noteKind === "file") {
    return {
      title: getFileNoteTitle(note.file),
      meta: getFileNoteMetaCaps(note.file),
    };
  }

  const title = note.vocabulary?.word?.trim()
    || stripWikiLinkMarkup(note.text).split(/\r?\n/).map((line) => line.trim()).find(Boolean)
    || "Untitled note";

  return {
    title,
    meta: note.tags.length > 0 ? `#${note.tags[0]}` : note.noteKind ? note.noteKind.replaceAll("-", " ") : "standard note",
  };
};
