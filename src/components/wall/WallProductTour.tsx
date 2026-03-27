"use client";

import { useEffect, useState } from "react";

export type TourCoachmark =
  | "welcome"
  | "canvas"
  | "omnibar"
  | "create-note"
  | "fit"
  | "details-tip"
  | "omnibar-tip"
  | "complete";

type WallProductTourProps = {
  coachmark: TourCoachmark | null;
  onNext: () => void;
  onSkip: () => void;
  onDismissTip: () => void;
  onDismissComplete: () => void;
};

type AnchorKey = "canvas" | "omnibar" | "tools-panel" | "tools-create-note" | "zoom-fit" | "details-panel";
type Placement = "center" | "top" | "bottom" | "left" | "right";

type CoachmarkConfig = {
  tone: "hero" | "coachmark" | "tip" | "success";
  title: string;
  body: string[];
  eyebrow?: string;
  anchor?: AnchorKey;
  placement?: Placement;
  primaryLabel?: string;
  secondaryLabel?: string;
  waitingLabel?: string;
};

type Rect = { top: number; left: number; width: number; height: number };

type SizeEstimate = { width: number; height: number };

const coachmarkById: Record<TourCoachmark, CoachmarkConfig> = {
  welcome: {
    tone: "hero",
    eyebrow: "Step 1 of 5",
    title: "Your Infinite Canvas",
    body: [
      "Agy is a spatial workspace where thoughts exist as interconnected objects rather than files.",
      "It is a living landscape for your ideas to breathe, grow, and interact naturally.",
    ],
    placement: "center",
    primaryLabel: "Next Step",
    secondaryLabel: "Skip Tour",
  },
  canvas: {
    tone: "hero",
    eyebrow: "Step 2 of 5",
    title: "Think spatially",
    body: [
      "Pan, zoom, and place ideas anywhere on the wall. This workspace is meant to be navigated, not paged through.",
      "The tour stays lightweight so you can keep interacting while you learn the core loop.",
    ],
    anchor: "canvas",
    placement: "center",
    primaryLabel: "Next Step",
    secondaryLabel: "Skip Tour",
  },
  omnibar: {
    tone: "coachmark",
    eyebrow: "Step 3 of 5",
    title: "Start from the dock",
    body: [
      "Use the bottom omnibar to search notes, filter with tag:, type:, is:, and tool:, or run wall actions from one place.",
      "You can always jump back here with Ctrl/Cmd + K.",
    ],
    anchor: "omnibar",
    placement: "top",
    primaryLabel: "Next Step",
    secondaryLabel: "Skip Tour",
  },
  "create-note": {
    tone: "coachmark",
    eyebrow: "Step 4 of 5",
    title: "Create your first note",
    body: [
      "The Tools atelier is open on the left. Start with New Note to drop a standard note at the viewport center.",
      "As soon as your first note appears, the tour moves forward.",
    ],
    anchor: "tools-create-note",
    placement: "right",
    waitingLabel: "Waiting for your first note",
    secondaryLabel: "Skip Tour",
  },
  fit: {
    tone: "coachmark",
    eyebrow: "Step 5 of 5",
    title: "Use Fit when you get lost",
    body: [
      "Your new note is now selected, and Details follows the current selection for editing context.",
      "Click Fit on the zoom rail to recenter the wall and finish the guided spine.",
    ],
    anchor: "zoom-fit",
    placement: "left",
    waitingLabel: "Waiting for Fit",
    secondaryLabel: "Skip Tour",
  },
  "details-tip": {
    tone: "tip",
    title: "Details follows selection",
    body: [
      "This sidebar changes with the note, link, or zone you have selected, so refinement always stays context-aware.",
    ],
    anchor: "details-panel",
    placement: "left",
    secondaryLabel: "Got it",
  },
  "omnibar-tip": {
    tone: "tip",
    title: "Token filters live here",
    body: [
      "After you start searching, try tag:, type:, is:, or tool: to narrow the wall without opening extra panels.",
    ],
    anchor: "omnibar",
    placement: "top",
    secondaryLabel: "Got it",
  },
  complete: {
    tone: "success",
    eyebrow: "Tour complete",
    title: "You are ready",
    body: [
      "You have completed the first wall loop: orient, create, and recover.",
      "You can replay the tour anytime from Settings or the command palette.",
    ],
    placement: "center",
    primaryLabel: "Close",
  },
};

const toneClassName: Record<CoachmarkConfig["tone"], string> = {
  hero: "max-w-[48rem] bg-[rgba(255,255,255,0.96)]",
  coachmark: "max-w-[26rem] bg-[rgba(255,252,248,0.96)]",
  tip: "max-w-[22rem] bg-[rgba(255,252,248,0.97)]",
  success: "max-w-[30rem] bg-[rgba(255,252,248,0.97)]",
};

export const WallProductTour = ({
  coachmark,
  onNext,
  onSkip,
  onDismissTip,
  onDismissComplete,
}: WallProductTourProps) => {
  const [, setViewportTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const refresh = () => setViewportTick((previous) => previous + 1);
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, []);

  if (!coachmark || typeof window === "undefined") {
    return null;
  }

  const config = coachmarkById[coachmark];
  const cardSize = getSizeEstimate(config.tone);
  const anchorRect = getAnchorRect(config.anchor);
  const position = getPosition(config, cardSize, anchorRect);

  if (!position) {
    return null;
  }

  const showBackdrop = config.tone === "hero";
  const showAnchorHighlight = Boolean(config.anchor && anchorRect && config.tone !== "success");
  const isTip = config.tone === "tip";
  const isSuccess = config.tone === "success";
  const progressBars = getProgressBars(config.eyebrow);

  return (
    <div className="pointer-events-none absolute inset-0 z-[70]">
      {showBackdrop ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),rgba(252,249,244,0.14)_46%,rgba(28,28,25,0.08))]" /> : null}

      {showAnchorHighlight && anchorRect ? (
        <div
          className="absolute rounded-[24px] border border-[#a33818]/30 bg-[#f7ede3]/30 shadow-[0_0_0_1px_rgba(163,56,24,0.08),0_20px_50px_rgba(163,56,24,0.12)] backdrop-blur-[2px] transition-all duration-300"
          style={{
            top: anchorRect.top - 8,
            left: anchorRect.left - 8,
            width: anchorRect.width + 16,
            height: anchorRect.height + 16,
          }}
        />
      ) : null}

      <div
        className={`pointer-events-auto absolute rounded-[30px] border border-[#eadfd2] px-6 py-6 text-[#1c1c19] shadow-[0_28px_80px_rgba(28,28,25,0.14)] backdrop-blur-2xl sm:px-8 sm:py-7 ${toneClassName[config.tone]}`}
        style={{
          top: position.top,
          left: position.left,
          width: cardSize.width,
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        <div className="space-y-3">
          {config.eyebrow ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${isSuccess ? "bg-[#dce8df] text-[#4d6356]" : "bg-[#f6dfb2] text-[#755717]"}`}>
                {config.eyebrow}
              </span>
              {progressBars ? (
                <div className="flex items-center gap-1.5">
                  {progressBars.map((active, index) => (
                    <span
                      key={`${coachmark}-progress-${index}`}
                      className={`block h-1.5 rounded-full transition-all ${active ? "w-8 bg-[#a33818]" : "w-4 bg-[#ded8d1]"}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-3">
            <h2 className={`${config.tone === "hero" ? "font-[Newsreader] text-[clamp(2.3rem,4vw,4rem)] leading-[0.95]" : "font-[Newsreader] text-[2rem] leading-[0.98]"} ${isTip ? "italic" : ""}`}>
              {config.title}
            </h2>
            <div className="space-y-3 text-[15px] leading-7 text-[#61574f] sm:text-[16px]">
              {config.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {config.primaryLabel ? (
            <button
              type="button"
              onClick={isSuccess ? onDismissComplete : onNext}
              className="inline-flex items-center justify-center rounded-[18px] bg-[#a33818] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_14px_32px_rgba(163,56,24,0.24)] transition hover:bg-[#8d2f13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30"
            >
              {config.primaryLabel}
            </button>
          ) : null}

          {config.waitingLabel ? (
            <div className="inline-flex items-center justify-center rounded-[18px] bg-[#efe6da] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c7065]">
              {config.waitingLabel}
            </div>
          ) : null}

          {config.secondaryLabel ? (
            <button
              type="button"
              onClick={isTip ? onDismissTip : onSkip}
              className="inline-flex items-center justify-center rounded-full px-1 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6e655d] transition hover:text-[#1c1c19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/20"
            >
              {config.secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const getAnchorRect = (anchor?: AnchorKey): Rect | null => {
  if (!anchor || typeof document === "undefined") {
    return null;
  }

  const element = document.querySelector<HTMLElement>(`[data-tour-anchor="${anchor}"]`);
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
};

const getPosition = (config: CoachmarkConfig, cardSize: SizeEstimate, anchorRect: Rect | null) => {
  const margin = 16;
  if ((config.placement ?? "center") === "center" || !config.anchor) {
    return {
      top: Math.max(24, Math.round(window.innerHeight * 0.16)),
      left: Math.max(24, Math.round((window.innerWidth - cardSize.width) / 2)),
    };
  }

  if (!anchorRect) {
    return null;
  }

  const gap = 18;
  const candidates = getPlacementOrder(config.placement ?? "top").map((side) => {
    if (side === "top") {
      return {
        top: anchorRect.top - cardSize.height - gap,
        left: anchorRect.left + anchorRect.width / 2 - cardSize.width / 2,
      };
    }
    if (side === "bottom") {
      return {
        top: anchorRect.top + anchorRect.height + gap,
        left: anchorRect.left + anchorRect.width / 2 - cardSize.width / 2,
      };
    }
    if (side === "left") {
      return {
        top: anchorRect.top + anchorRect.height / 2 - cardSize.height / 2,
        left: anchorRect.left - cardSize.width - gap,
      };
    }
    return {
      top: anchorRect.top + anchorRect.height / 2 - cardSize.height / 2,
      left: anchorRect.left + anchorRect.width + gap,
    };
  });

  const chosen = candidates.find((candidate) => {
    const fitsVertically = candidate.top >= margin && candidate.top + cardSize.height <= window.innerHeight - margin;
    const fitsHorizontally = candidate.left >= margin && candidate.left + cardSize.width <= window.innerWidth - margin;
    return fitsVertically && fitsHorizontally;
  }) ?? candidates[0];

  if (!chosen) {
    return null;
  }

  return {
    top: clamp(chosen.top, margin, Math.max(margin, window.innerHeight - cardSize.height - margin)),
    left: clamp(chosen.left, margin, Math.max(margin, window.innerWidth - cardSize.width - margin)),
  };
};

const getPlacementOrder = (preferred: Placement) => {
  if (preferred === "left") {
    return ["left", "top", "bottom", "right"] as const;
  }
  if (preferred === "right") {
    return ["right", "top", "bottom", "left"] as const;
  }
  if (preferred === "bottom") {
    return ["bottom", "top", "right", "left"] as const;
  }
  return ["top", "bottom", "right", "left"] as const;
};

const getSizeEstimate = (tone: CoachmarkConfig["tone"]): SizeEstimate => {
  if (tone === "hero") {
    return { width: 760, height: 420 };
  }
  if (tone === "tip") {
    return { width: 352, height: 210 };
  }
  if (tone === "success") {
    return { width: 420, height: 250 };
  }
  return { width: 420, height: 300 };
};

const getProgressBars = (eyebrow?: string) => {
  if (!eyebrow?.startsWith("Step")) {
    return null;
  }
  const match = eyebrow.match(/Step (\d+) of (\d+)/);
  if (!match) {
    return null;
  }
  const active = Number(match[1]);
  const total = Number(match[2]);
  return Array.from({ length: total }, (_, index) => index < active);
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
