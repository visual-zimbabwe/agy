export type ParsedImportFile = {
  columns: string[];
  rows: string[][];
};

const parseSeparatorDirective = (line: string): "," | "\t" | null => {
  const match = line.match(/^#\s*separator\s*:\s*(.+)\s*$/i);
  if (!match) {
    return null;
  }
  const value = match[1]?.trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (value === "tab" || value === "\\t") {
    return "\t";
  }
  if (value === "comma" || value === "csv") {
    return ",";
  }
  return null;
};

const parseDelimitedLine = (line: string, delimiter: "," | "\t") => {
  const cells: string[] = [];
  let cursor = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cursor += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && char === delimiter) {
      cells.push(cursor.trim());
      cursor = "";
      continue;
    }
    cursor += char;
  }
  cells.push(cursor.trim());
  return cells;
};

export const parseImportText = (raw: string): ParsedImportFile => {
  let delimiterFromDirective: "," | "\t" | null = null;
  const contentLines: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith("#")) {
      delimiterFromDirective = parseSeparatorDirective(trimmed) ?? delimiterFromDirective;
      continue;
    }
    contentLines.push(trimmed);
  }

  if (contentLines.length === 0) {
    return { columns: [], rows: [] };
  }

  const delimiter = delimiterFromDirective ?? (contentLines[0]?.includes("\t") ? "\t" : ",");
  const header = parseDelimitedLine(contentLines[0] ?? "", delimiter);
  const rows = contentLines.slice(1).map((line) => parseDelimitedLine(line, delimiter));
  return { columns: header, rows };
};
