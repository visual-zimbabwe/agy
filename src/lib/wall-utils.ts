import { EISENHOWER_QUADRANTS } from "@/features/wall/eisenhower";
import type { Note, Zone } from "@/features/wall/types";

type Bounds = { x: number; y: number; w: number; h: number };

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const computeContentBounds = (notes: Note[], zones: Zone[]): Bounds | null => {
  const rects = [
    ...notes.map((note) => ({ x: note.x, y: note.y, w: note.w, h: note.h })),
    ...zones.map((zone) => ({ x: zone.x, y: zone.y, w: zone.w, h: zone.h })),
  ];

  if (rects.length === 0) {
    return null;
  }

  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.w));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.h));

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };
};

export const detectClusters = (notes: Note[], threshold = 260): Bounds[] => {
  if (notes.length === 0) {
    return [];
  }

  const centers = notes.map((note) => ({
    id: note.id,
    x: note.x + note.w / 2,
    y: note.y + note.h / 2,
  }));

  const indexById = new Map(centers.map((center, index) => [center.id, index]));
  const visited = new Set<string>();
  const clusters: Bounds[] = [];

  for (const center of centers) {
    if (visited.has(center.id)) {
      continue;
    }

    const queue = [center.id];
    visited.add(center.id);
    const members: Note[] = [];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) {
        continue;
      }

      const note = notes[indexById.get(currentId) ?? -1];
      if (note) {
        members.push(note);
      }

      const currentCenter = centers[indexById.get(currentId) ?? -1];
      if (!currentCenter) {
        continue;
      }

      for (const candidate of centers) {
        if (visited.has(candidate.id)) {
          continue;
        }

        const distance = Math.hypot(candidate.x - currentCenter.x, candidate.y - currentCenter.y);
        if (distance <= threshold) {
          visited.add(candidate.id);
          queue.push(candidate.id);
        }
      }
    }

    if (members.length === 0) {
      continue;
    }

    const bounds = computeContentBounds(members, []);
    if (!bounds) {
      continue;
    }

    clusters.push({
      x: bounds.x - 22,
      y: bounds.y - 22,
      w: bounds.w + 44,
      h: bounds.h + 44,
    });
  }

  return clusters;
};

export const notesToMarkdown = (notes: Note[], zones: Zone[]) => {
  const zoneById = new Map(zones.map((zone) => [zone.id, zone]));

  const zoneMembership = (note: Note) =>
    zones
      .filter(
        (zone) =>
          note.x < zone.x + zone.w &&
          note.x + note.w > zone.x &&
          note.y < zone.y + zone.h &&
          note.y + note.h > zone.y,
      )
      .map((zone) => zone.id);

  const lines: string[] = ["# Idea Wall Export", ""];

  for (const note of notes) {
    lines.push(`## ${note.text.trim().split("\n")[0] || "Untitled note"}`);
    lines.push("");
    lines.push(note.text || "(empty)");
    lines.push("");
    lines.push(`- id: ${note.id}`);
    lines.push(`- position: (${Math.round(note.x)}, ${Math.round(note.y)})`);
    lines.push(`- size: ${Math.round(note.w)} x ${Math.round(note.h)}`);
    lines.push(`- color: ${note.color}`);
    lines.push(`- kind: ${note.noteKind ?? "standard"}`);
    if (note.quoteAuthor) {
      lines.push(`- quoteAuthor: ${note.quoteAuthor}`);
    }
    if (note.quoteSource) {
      lines.push(`- quoteSource: ${note.quoteSource}`);
    }
    if (note.canon) {
      lines.push(`- canonMode: ${note.canon.mode}`);
      if (note.canon.title) {
        lines.push(`- canonTitle: ${note.canon.title}`);
      }
      if (note.canon.mode === "list") {
        const listCount = note.canon.items.filter((item) => item.title.trim() || item.text.trim()).length;
        lines.push(`- canonItems: ${listCount}`);
      }
    }
    if (note.eisenhower) {
      lines.push(`- displayDate: ${note.eisenhower.displayDate}`);
      for (const quadrant of EISENHOWER_QUADRANTS) {
        const current = note.eisenhower.quadrants[quadrant.key];
        lines.push(`- ${quadrant.key}: ${current.title}`);
        if (current.content.trim()) {
          lines.push(`  ${current.content.replace(/\n/g, " / ")}`);
        }
      }
    }
    if (note.tags.length > 0) {
      lines.push(`- tags: ${note.tags.join(", ")}`);
    }
    lines.push(`- updatedAt: ${new Date(note.updatedAt).toISOString()}`);

    const zoneNames = zoneMembership(note)
      .map((zoneId) => zoneById.get(zoneId)?.label)
      .filter((label): label is string => Boolean(label));

    if (zoneNames.length > 0) {
      lines.push(`- zones: ${zoneNames.join(", ")}`);
    }

    lines.push("");
  }

  return lines.join("\n");
};


