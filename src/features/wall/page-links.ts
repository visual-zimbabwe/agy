import { appSlug, legacyAppSlug } from "@/lib/brand";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

export type WallPageReference = {
  docId: string;
  blockId: string;
  createdAt: number;
};

export type WallPageConversion = {
  docId: string;
  createdAt: number;
};

export type WallPageLinkState = {
  referencesByNoteId: Record<string, WallPageReference>;
  conversionsByNoteId: Record<string, WallPageConversion>;
};

const pageLinksStorageKey = `${appSlug}-wall-page-links-v1`;
const legacyPageLinksStorageKeys = [`${legacyAppSlug}-wall-page-links-v1`];

const defaultState = (): WallPageLinkState => ({
  referencesByNoteId: {},
  conversionsByNoteId: {},
});

export const readWallPageLinkState = (): WallPageLinkState => {
  if (typeof window === "undefined") {
    return defaultState();
  }
  try {
    const raw = readStorageValue(pageLinksStorageKey, legacyPageLinksStorageKeys);
    if (!raw) {
      return defaultState();
    }
    const parsed = JSON.parse(raw) as Partial<WallPageLinkState>;
    return {
      referencesByNoteId:
        parsed.referencesByNoteId && typeof parsed.referencesByNoteId === "object" && !Array.isArray(parsed.referencesByNoteId)
          ? parsed.referencesByNoteId
          : {},
      conversionsByNoteId:
        parsed.conversionsByNoteId && typeof parsed.conversionsByNoteId === "object" && !Array.isArray(parsed.conversionsByNoteId)
          ? parsed.conversionsByNoteId
          : {},
    };
  } catch {
    return defaultState();
  }
};

export const writeWallPageLinkState = (state: WallPageLinkState) => {
  if (typeof window === "undefined") {
    return;
  }
  writeStorageValue(pageLinksStorageKey, JSON.stringify(state));
};
