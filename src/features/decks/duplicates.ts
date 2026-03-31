const normalizeDeckNoteFieldValue = (value: unknown) => (typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim() : "");

export const normalizeDeckNoteFields = (fields: Record<string, unknown>) => {
  const normalizedEntries = Object.entries(fields)
    .map(([key, value]) => [key, normalizeDeckNoteFieldValue(value)] as const)
    .sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(normalizedEntries) as Record<string, string>;
};

export const createDeckNoteFingerprint = (fields: Record<string, unknown>) => JSON.stringify(normalizeDeckNoteFields(fields));

export const findDuplicateDeckNote = <TNote extends { id: string; fields: Record<string, unknown> }>(
  notes: TNote[],
  targetFields: Record<string, unknown>,
) => {
  const fingerprint = createDeckNoteFingerprint(targetFields);
  return notes.find((note) => createDeckNoteFingerprint(note.fields) === fingerprint) ?? null;
};
