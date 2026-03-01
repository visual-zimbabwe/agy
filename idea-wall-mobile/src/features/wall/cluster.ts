import type { Note } from "./types";

type Cluster = {
  id: string;
  noteIds: string[];
  x: number;
  y: number;
  w: number;
  h: number;
};

const PADDING = 28;
const MAX_DIST = 280;

export const detectClusters = (notes: Note[]): Cluster[] => {
  const remaining = new Map(notes.map((note) => [note.id, note]));
  const clusters: Cluster[] = [];

  while (remaining.size > 0) {
    const seed = remaining.values().next().value as Note;
    if (!seed) {
      break;
    }
    remaining.delete(seed.id);
    const cluster: Note[] = [seed];
    let changed = true;

    while (changed) {
      changed = false;
      for (const note of [...remaining.values()]) {
        const touches = cluster.some((candidate) => {
          const cx = candidate.x + candidate.w / 2;
          const cy = candidate.y + candidate.h / 2;
          const nx = note.x + note.w / 2;
          const ny = note.y + note.h / 2;
          return Math.hypot(nx - cx, ny - cy) <= MAX_DIST;
        });
        if (touches) {
          cluster.push(note);
          remaining.delete(note.id);
          changed = true;
        }
      }
    }

    if (cluster.length <= 1) {
      continue;
    }

    const minX = Math.min(...cluster.map((note) => note.x)) - PADDING;
    const minY = Math.min(...cluster.map((note) => note.y)) - PADDING;
    const maxX = Math.max(...cluster.map((note) => note.x + note.w)) + PADDING;
    const maxY = Math.max(...cluster.map((note) => note.y + note.h)) + PADDING;

    clusters.push({
      id: `cluster-${clusters.length + 1}`,
      noteIds: cluster.map((note) => note.id),
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY
    });
  }

  return clusters;
};
