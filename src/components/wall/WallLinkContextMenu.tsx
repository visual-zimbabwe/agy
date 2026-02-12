"use client";

import { LINK_TYPES } from "@/features/wall/constants";
import type { LinkType } from "@/features/wall/types";

type WallLinkContextMenuProps = {
  open: boolean;
  linkId?: string;
  linksById: Record<string, { id: string }>;
  x: number;
  y: number;
  maxViewportWidth: number;
  maxViewportHeight: number;
  isTimeLocked: boolean;
  onDeleteLink: (linkId: string) => void;
  onUpdateLinkType: (linkId: string, type: LinkType) => void;
  onClose: () => void;
};

export const WallLinkContextMenu = ({
  open,
  linkId,
  linksById,
  x,
  y,
  maxViewportWidth,
  maxViewportHeight,
  isTimeLocked,
  onDeleteLink,
  onUpdateLinkType,
  onClose,
}: WallLinkContextMenuProps) => {
  if (!open || !linkId || !linksById[linkId]) {
    return null;
  }

  return (
    <div
      className="fixed z-[70] w-56 rounded-xl border border-zinc-300 bg-white p-2 shadow-2xl"
      style={{
        left: `${Math.max(8, Math.min(x, maxViewportWidth - 232))}px`,
        top: `${Math.max(8, Math.min(y, maxViewportHeight - 210))}px`,
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Link Actions</p>
      <button
        type="button"
        className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm text-red-700 hover:bg-red-50"
        disabled={isTimeLocked}
        onClick={() => {
          onDeleteLink(linkId);
          onClose();
        }}
      >
        Delete link
      </button>
      <div className="mt-2 border-t border-zinc-200 pt-2">
        <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Change Type</p>
        <div className="space-y-1">
          {LINK_TYPES.map((option) => (
            <button
              key={`ctx-${option.value}`}
              type="button"
              disabled={isTimeLocked}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-zinc-50"
              onClick={() => {
                onUpdateLinkType(linkId, option.value as LinkType);
                onClose();
              }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
