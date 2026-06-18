import type { WallKeyboardKeyHandler } from "@/components/wall/keyboard/wall-keyboard-types";
import { isTypingInField } from "@/components/wall/keyboard/wall-keyboard-types";

export const handleWallKeyboardNavigationKey: WallKeyboardKeyHandler = (event, context) => {
  const {
    readingMode,
    presentationMode,
    presentationLength,
    timelineEntriesLength,
    timelineViewActive,
    timelineModeRef,
    setIsSpaceDown,
    setTimelineMode,
    setTimelineIndex,
    setIsTimelinePlaying,
    toggleTimelineView,
    setShowHeatmap,
    setPresentationMode,
    setPresentationIndex,
    setReadingMode,
    setQuickCaptureOpen,
    setSearchOpen,
    setExportOpen,
  } = context;

  if (event.key === " ") {
    setIsSpaceDown(true);
    return true;
  }

  if (isTypingInField(event)) {
    return false;
  }

  const key = event.key.toLowerCase();
  const ctrlOrMeta = event.ctrlKey || event.metaKey;

  if (!ctrlOrMeta && key === "t") {
    event.preventDefault();
    const next = !timelineModeRef.current;
    setTimelineMode(next);
    if (next && timelineEntriesLength > 0) {
      setTimelineIndex(timelineEntriesLength - 1);
    }
    if (!next) {
      setIsTimelinePlaying(false);
    }
    return true;
  }

  if (!ctrlOrMeta && key === "v") {
    event.preventDefault();
    toggleTimelineView();
    return true;
  }

  if (!ctrlOrMeta && key === "h") {
    event.preventDefault();
    setShowHeatmap((previous) => !previous);
    return true;
  }

  if (!ctrlOrMeta && key === "p") {
    event.preventDefault();
    const next = !presentationMode;
    setPresentationMode(next);
    if (next) {
      setReadingMode(false);
      setPresentationIndex(0);
      setQuickCaptureOpen(false);
      setSearchOpen(false);
      setExportOpen(false);
    }
    return true;
  }

  if (!ctrlOrMeta && key === "r") {
    event.preventDefault();
    const next = !readingMode;
    setReadingMode(next);
    if (next) {
      setPresentationMode(false);
      setQuickCaptureOpen(false);
      setSearchOpen(false);
      setExportOpen(false);
    }
    return true;
  }

  if (timelineViewActive) {
    return false;
  }

  if (readingMode) {
    return false;
  }

  if (presentationMode && (event.key === "ArrowRight" || event.key === "ArrowDown")) {
    event.preventDefault();
    setPresentationIndex((previous) => Math.min(previous + 1, Math.max(0, presentationLength - 1)));
    return true;
  }

  if (presentationMode && (event.key === "ArrowLeft" || event.key === "ArrowUp")) {
    event.preventDefault();
    setPresentationIndex((previous) => Math.max(previous - 1, 0));
    return true;
  }

  return false;
};

export const handleWallKeyboardNavigationKeyUp = (event: KeyboardEvent, setIsSpaceDown: (value: boolean) => void) => {
  if (event.key === " ") {
    setIsSpaceDown(false);
    return true;
  }
  return false;
};
