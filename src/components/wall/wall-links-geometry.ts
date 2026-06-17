"use client";

import type { Link, LinkType, Note } from "@/features/wall/types";

export const linkColorByType: Record<LinkType, string> = {
  cause_effect: "#ef4444",
  dependency: "#2563eb",
  idea_execution: "#16a34a",
  wiki: "#64748b",
};

export const linkStrokeByType: Record<LinkType, number[]> = {
  cause_effect: [0, 0],
  dependency: [8, 6],
  idea_execution: [2, 4],
  wiki: [4, 6],
};

const noteCenter = (note: Note) => ({
  x: note.x + note.w / 2,
  y: note.y + note.h / 2,
});

export const linkPoints = (from: Note, to: Note) => {
  const fromCenter = noteCenter(from);
  const toCenter = noteCenter(to);
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / distance;
  const uy = dy / distance;
  const fromInset = Math.min(from.w, from.h) * 0.36;
  const toInset = Math.min(to.w, to.h) * 0.38;

  return {
    points: [
      fromCenter.x + ux * fromInset,
      fromCenter.y + uy * fromInset,
      toCenter.x - ux * toInset,
      toCenter.y - uy * toInset,
    ],
    mid: {
      x: (fromCenter.x + toCenter.x) / 2,
      y: (fromCenter.y + toCenter.y) / 2,
    },
  };
};

export const graphPathLinks = (selectedNoteId: string | undefined, links: Link[]) => {
  if (!selectedNoteId) {
    return new Set<string>();
  }

  const outgoing = new Map<string, Link[]>();
  const incoming = new Map<string, Link[]>();
  for (const link of links) {
    const out = outgoing.get(link.fromNoteId) ?? [];
    out.push(link);
    outgoing.set(link.fromNoteId, out);

    const inLinks = incoming.get(link.toNoteId) ?? [];
    inLinks.push(link);
    incoming.set(link.toNoteId, inLinks);
  }

  const traversed = new Set<string>();
  const seenOut = new Set<string>([selectedNoteId]);
  const seenIn = new Set<string>([selectedNoteId]);
  const outQueue = [selectedNoteId];
  const inQueue = [selectedNoteId];

  while (outQueue.length > 0) {
    const node = outQueue.shift();
    if (!node) {
      continue;
    }
    for (const link of outgoing.get(node) ?? []) {
      traversed.add(link.id);
      if (!seenOut.has(link.toNoteId)) {
        seenOut.add(link.toNoteId);
        outQueue.push(link.toNoteId);
      }
    }
  }

  while (inQueue.length > 0) {
    const node = inQueue.shift();
    if (!node) {
      continue;
    }
    for (const link of incoming.get(node) ?? []) {
      traversed.add(link.id);
      if (!seenIn.has(link.fromNoteId)) {
        seenIn.add(link.fromNoteId);
        inQueue.push(link.fromNoteId);
      }
    }
  }

  return traversed;
};
