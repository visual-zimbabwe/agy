import { parseTaggedText } from "@/lib/tag-utils";

export type CaptureItem = {
  text: string;
  tags: string[];
};

export const parseCaptureItems = (raw: string): CaptureItem[] => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^([-*]|\d+[.)])\s+/, ""))
    .filter(Boolean);

  return lines
    .map((line) => {
      const parsed = parseTaggedText(line);
      return {
        text: parsed.text || line,
        tags: parsed.tags,
      };
    })
    .filter((item) => item.text.length > 0);
};
