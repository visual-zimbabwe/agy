"use client";

import { useEffect, useMemo, useRef } from "react";

import { EISENHOWER_QUADRANTS, countEisenhowerTasks, getEisenhowerTotalTaskCount, normalizeEisenhowerNote } from "@/features/wall/eisenhower";
import type { EisenhowerQuadrantKey, Note } from "@/features/wall/types";

type EditingState = {
  id: string;
  text: string;
  focusField?: string;
};

type EisenhowerMatrixEditorProps = {
  editing: EditingState;
  editingNote: Note;
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  setEditing: (value: EditingState | null) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
};

const panelClass =
  "rounded-[24px] border border-[color:rgb(15_23_42_/_0.14)] bg-[color:rgb(255_251_246_/_0.97)] p-3 text-[var(--color-text)] shadow-[0_28px_70px_rgba(15,23,42,0.22)] backdrop-blur-xl transition-[box-shadow,border-color] duration-200 dark:border-white/10 dark:bg-[color:rgb(24_24_27_/_0.94)]";
const quadrantShellClass =
  "group relative flex min-h-0 flex-col rounded-[18px] border border-transparent px-3 py-2.5 transition-[transform,border-color,box-shadow,background-color] duration-200 hover:-translate-y-[1px] hover:border-[color:rgb(15_23_42_/_0.08)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] focus-within:border-[var(--color-focus)] focus-within:shadow-[0_0_0_1px_var(--color-focus),0_16px_34px_rgba(2,132,199,0.14)] dark:hover:border-white/10";
const titleInputClass =
  "w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] outline-none transition-colors placeholder:text-[var(--color-text-muted)]/70 focus:border-[var(--color-focus)] focus:bg-white/60 dark:focus:bg-black/20";
const contentAreaClass =
  "mt-2 min-h-0 flex-1 resize-none rounded-[14px] border border-transparent bg-white/52 px-3 py-2 text-[13px] leading-5 text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)]/75 focus:border-[var(--color-focus)] focus:bg-white/82 dark:bg-black/12 dark:focus:bg-black/22";

export const EisenhowerMatrixEditor = ({ editing, editingNote, camera, toScreenPoint, setEditing, updateNote }: EisenhowerMatrixEditorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quadrantRefs = useRef<Partial<Record<EisenhowerQuadrantKey, HTMLTextAreaElement | null>>>({});
  const eisenhower = useMemo(() => normalizeEisenhowerNote(editingNote.eisenhower, editingNote.createdAt), [editingNote.createdAt, editingNote.eisenhower]);
  const totalTasks = getEisenhowerTotalTaskCount({ eisenhower });

  useEffect(() => {
    const focusField = editing.focusField as EisenhowerQuadrantKey | undefined;
    const targetKey = focusField && quadrantRefs.current[focusField] ? focusField : "doFirst";
    quadrantRefs.current[targetKey]?.focus();
  }, [editing.focusField]);

  const screen = toScreenPoint(editingNote.x, editingNote.y, camera);
  const updateQuadrant = (quadrantKey: EisenhowerQuadrantKey, patch: { title?: string; content?: string }) => {
    updateNote(editing.id, {
      eisenhower: {
        ...eisenhower,
        quadrants: {
          ...eisenhower.quadrants,
          [quadrantKey]: {
            ...eisenhower.quadrants[quadrantKey],
            ...patch,
          },
        },
      },
    });
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-[46]"
      style={{
        left: `${screen.x}px`,
        top: `${screen.y}px`,
        width: `${editingNote.w * camera.zoom}px`,
      }}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && containerRef.current?.contains(nextTarget)) {
          return;
        }
        window.setTimeout(() => {
          const active = document.activeElement;
          if (active && containerRef.current?.contains(active)) {
            return;
          }
          setEditing(null);
        }, 0);
      }}
    >
      <div className={panelClass} style={{ height: `${editingNote.h * camera.zoom}px` }}>
        <div className="flex items-start justify-between gap-3 pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{eisenhower.displayDate}</p>
            <p className="mt-1 font-serif text-[19px] text-[var(--color-text)]">Eisenhower Matrix</p>
          </div>
          <div className="rounded-full border border-[var(--color-border-muted)] bg-[var(--color-surface-glass)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
          </div>
        </div>

        <div className="pointer-events-none mb-2 flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]/80">
          <span>Urgent</span>
          <span>Not Urgent</span>
        </div>

        <div className="grid h-[calc(100%-4.9rem)] min-h-0 grid-cols-2 grid-rows-2 gap-2.5">
          {EISENHOWER_QUADRANTS.map((quadrant) => {
            const current = eisenhower.quadrants[quadrant.key];
            const taskCount = countEisenhowerTasks(current.content);
            return (
              <section key={quadrant.key} className={quadrantShellClass} style={{ backgroundColor: quadrant.tint }}>
                <div className="flex items-center justify-between gap-2">
                  <input
                    value={current.title}
                    onChange={(event) => updateQuadrant(quadrant.key, { title: event.target.value })}
                    className={titleInputClass}
                    aria-label={`${quadrant.title} title`}
                  />
                  <span className="rounded-full border border-black/6 bg-white/60 px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] dark:border-white/10 dark:bg-white/10">
                    {taskCount}
                  </span>
                </div>
                <textarea
                  ref={(node) => {
                    quadrantRefs.current[quadrant.key] = node;
                  }}
                  value={current.content}
                  onChange={(event) => updateQuadrant(quadrant.key, { content: event.target.value })}
                  onFocus={() => setEditing({ ...editing, focusField: quadrant.key })}
                  className={contentAreaClass}
                  placeholder={quadrant.placeholder}
                  aria-label={`${quadrant.title} content`}
                  spellCheck
                />
              </section>
            );
          })}
        </div>

        <div className="pointer-events-none mt-2 flex items-center justify-between px-1 text-[10px] font-medium text-[var(--color-text-muted)]/90">
          <span>Important work lives on the top row.</span>
          <span>Delegate or remove the rest.</span>
        </div>
      </div>
    </div>
  );
};
