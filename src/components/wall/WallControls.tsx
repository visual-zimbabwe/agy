"use client";

import type { ReactNode } from "react";

export type IconName =
  | "search"
  | "capture"
  | "export"
  | "undo"
  | "redo"
  | "present"
  | "reset"
  | "timeline"
  | "heatmap"
  | "shortcuts"
  | "tools"
  | "details"
  | "note"
  | "zone"
  | "box"
  | "link"
  | "cluster"
  | "panel-left"
  | "panel-right"
  | "layout";

export const Icon = ({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) => {
  const common = "none";
  const stroke = "currentColor";
  const strokeWidth = 1.9;
  const strokeLinecap = "round";
  const strokeLinejoin = "round";

  if (name === "search") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }
  if (name === "capture") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    );
  }
  if (name === "export") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <path d="M12 3v11" />
        <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
        <path d="M4 16.5V20h16v-3.5" />
      </svg>
    );
  }
  if (name === "undo") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <path d="M9 7H4v5" />
        <path d="M4 12a8 8 0 0 1 14.3-4.8" />
      </svg>
    );
  }
  if (name === "redo") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <path d="M15 7h5v5" />
        <path d="M20 12a8 8 0 0 0-14.3-4.8" />
      </svg>
    );
  }
  if (name === "present") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <rect x="3.5" y="4.5" width="17" height="11" rx="2" />
        <path d="M9 20h6M12 15.5V20" />
      </svg>
    );
  }
  if (name === "reset") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <path d="M4 12a8 8 0 1 0 2.3-5.7" />
        <path d="M4 4v4h4" />
      </svg>
    );
  }
  if (name === "timeline") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <path d="M5 12h14" />
        <circle cx="7" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="17" cy="12" r="1.8" />
      </svg>
    );
  }
  if (name === "heatmap") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <rect x="4" y="4" width="4" height="4" />
        <rect x="10" y="4" width="4" height="4" />
        <rect x="16" y="4" width="4" height="4" />
        <rect x="4" y="10" width="4" height="4" />
        <rect x="10" y="10" width="4" height="4" />
        <rect x="16" y="10" width="4" height="4" />
        <rect x="4" y="16" width="4" height="4" />
        <rect x="10" y="16" width="4" height="4" />
      </svg>
    );
  }
  if (name === "shortcuts") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <rect x="3.5" y="7" width="17" height="10" rx="2" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" />
      </svg>
    );
  }
  if (name === "tools") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <path d="M4 20 10.5 13.5" />
        <path d="m8.5 5.5 10 10" />
        <path d="m15 4 5 5-3 3-5-5z" />
      </svg>
    );
  }
  if (name === "details") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <rect x="4" y="4" width="16" height="16" rx="2.5" />
        <path d="M8 9h8M8 12h8M8 15h5" />
      </svg>
    );
  }
  if (name === "note") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <path d="M6 4h12v16H6z" />
        <path d="M9 9h6M9 13h6" />
      </svg>
    );
  }
  if (name === "zone") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 9h8" />
      </svg>
    );
  }
  if (name === "box") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <rect x="5" y="5" width="14" height="14" strokeDasharray="3 2" />
      </svg>
    );
  }
  if (name === "link") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <path d="m10.5 13.5 3-3" />
        <path d="M8 16a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 1 1 5.7 5.7l-1.3 1.3" />
      </svg>
    );
  }
  if (name === "cluster") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <circle cx="7" cy="8" r="2.2" />
        <circle cx="16.5" cy="8.5" r="2.2" />
        <circle cx="12" cy="16" r="2.2" />
        <path d="M8.8 9.5 10.8 14M14 14.3l1.5-3.6M9.4 8.4h4.9" />
      </svg>
    );
  }
  if (name === "panel-left") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M9 4.5v15M13.5 9 10 12l3.5 3" />
      </svg>
    );
  }
  if (name === "layout") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
        <path d="M5 7h14" />
        <path d="M5 12h14" />
        <path d="M5 17h14" />
        <circle cx="9" cy="7" r="1.8" />
        <circle cx="15" cy="12" r="1.8" />
        <circle cx="11" cy="17" r="1.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill={common} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M15 4.5v15M10.5 9 14 12l-3.5 3" />
    </svg>
  );
};

type ControlTooltipProps = {
  label: string;
  shortcut?: string;
  children: ReactNode;
  className?: string;
};

export const ControlTooltip = ({ label, shortcut, children, className = "relative inline-flex" }: ControlTooltipProps) => (
  <span className={`${className} group`}>
    {children}
    <span className="pointer-events-none absolute -bottom-10 left-1/2 z-[90] hidden w-max max-w-[18rem] -translate-x-1/2 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-100 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100 md:flex">
      <span>{label}</span>
      {shortcut && <span className="rounded border border-zinc-500 bg-zinc-800 px-1 py-0.5 font-mono text-[10px] text-zinc-200">{shortcut}</span>}
    </span>
  </span>
);
