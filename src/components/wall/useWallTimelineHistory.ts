"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import type { TimelineEntry } from "@/features/wall/storage";
import { loadTimelineEntries } from "@/features/wall/storage";

const timelineHistoryLoadLimit = 120;

type UseWallTimelineHistoryOptions = {
  timelineMode: boolean;
  setTimelineEntries: Dispatch<SetStateAction<TimelineEntry[]>>;
  setTimelineIndex: Dispatch<SetStateAction<number>>;
};

export const useWallTimelineHistory = ({
  timelineMode,
  setTimelineEntries,
  setTimelineIndex,
}: UseWallTimelineHistoryOptions) => {
  const [timelineHistoryLoaded, setTimelineHistoryLoaded] = useState(false);

  useEffect(() => {
    if (!timelineMode || timelineHistoryLoaded) {
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      const entries = await loadTimelineEntries(timelineHistoryLoadLimit);
      if (cancelled) {
        return;
      }
      setTimelineEntries((previous) => {
        if (previous.length === 0) {
          return entries;
        }

        const merged = new Map<number, TimelineEntry>();
        for (const entry of entries) {
          merged.set(entry.ts, entry);
        }
        for (const entry of previous) {
          merged.set(entry.ts, entry);
        }
        return [...merged.values()].sort((left, right) => left.ts - right.ts).slice(-timelineHistoryLoadLimit);
      });
      setTimelineHistoryLoaded(true);
      if (entries.length > 0) {
        setTimelineIndex((previous) => Math.max(previous, entries.length - 1));
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [setTimelineEntries, setTimelineIndex, timelineHistoryLoaded, timelineMode]);

  return { timelineHistoryLoaded };
};
