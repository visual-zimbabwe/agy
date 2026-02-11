"use client";

import { useCallback, useEffect } from "react";

import type { TimelineEntry } from "@/features/wall/storage";

type UseWallTimelineOptions = {
  timelineMode: boolean;
  isTimelinePlaying: boolean;
  timelineEntries: TimelineEntry[];
  setTimelineMode: (enabled: boolean) => void;
  setIsTimelinePlaying: (playing: boolean) => void;
  setTimelineIndex: (value: number | ((previous: number) => number)) => void;
};

export const useWallTimeline = ({
  timelineMode,
  isTimelinePlaying,
  timelineEntries,
  setTimelineMode,
  setIsTimelinePlaying,
  setTimelineIndex,
}: UseWallTimelineOptions) => {
  useEffect(() => {
    if (!isTimelinePlaying || timelineEntries.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setTimelineIndex((previous) => {
        if (previous >= timelineEntries.length - 1) {
          setIsTimelinePlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, 700);

    return () => clearInterval(timer);
  }, [isTimelinePlaying, setIsTimelinePlaying, setTimelineIndex, timelineEntries.length, timelineMode]);

  const jumpToTimelineDay = useCallback(
    (day: string) => {
      if (timelineEntries.length === 0) {
        return;
      }

      const index = (() => {
        for (let i = timelineEntries.length - 1; i >= 0; i -= 1) {
          const candidate = new Date(timelineEntries[i].ts);
          const key = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, "0")}-${String(candidate.getDate()).padStart(
            2,
            "0",
          )}`;
          if (key === day) {
            return i;
          }
        }
        return -1;
      })();

      if (index >= 0) {
        setTimelineMode(true);
        setIsTimelinePlaying(false);
        setTimelineIndex(index);
      }
    },
    [setIsTimelinePlaying, setTimelineIndex, setTimelineMode, timelineEntries],
  );

  return { jumpToTimelineDay };
};
