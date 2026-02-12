export type TaggedTextParse = {
  text: string;
  tags: string[];
};

const tagPattern = /#([a-zA-Z0-9_-]+)/g;

export const extractInlineTags = (raw: string): string[] =>
  [...raw.matchAll(tagPattern)]
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

export const stripInlineTags = (raw: string): string =>
  raw
    .split(/\r?\n/)
    .map((line) => line.replace(tagPattern, "").replace(/\s{2,}/g, " ").trim())
    .join("\n")
    .trim();

export const parseTaggedText = (raw: string): TaggedTextParse => {
  const tags = [...new Set(extractInlineTags(raw))];
  const text = stripInlineTags(raw);
  return {
    text: text || raw.trim(),
    tags,
  };
};
