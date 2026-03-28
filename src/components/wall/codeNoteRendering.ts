"use client";

type CodeLanguage =
  | "plain"
  | "markdown"
  | "javascript"
  | "typescript"
  | "python"
  | "ruby"
  | "go"
  | "rust"
  | "java"
  | "php"
  | "html"
  | "css"
  | "scss"
  | "json"
  | "yaml"
  | "xml"
  | "sql"
  | "bash"
  | "powershell"
  | "batch"
  | "toml";

export type CodeSegment = {
  text: string;
  tone: "plain" | "keyword" | "string" | "comment" | "number" | "function" | "variable" | "property" | "command";
};

export type ParsedCodeNote = {
  body: string;
  fileName?: string;
  language: CodeLanguage;
  languageLabel: string;
};

const stripWikiLinkMarkup = (text: string) => text.replace(/\[\[([^\]\n]+?)\]\]/g, "$1");

const codeFileNameMatch = (text: string) =>
  text.match(/([\w./-]+\.(?:py|ts|tsx|js|jsx|mjs|cjs|java|rb|go|rs|php|html|css|scss|json|ya?ml|xml|sql|sh|bash|zsh|ps1|psm1|psd1|bat|cmd|toml|ini|env|dockerfile|md|txt))/i);

const CODE_LANGUAGE_ALIASES: Record<string, string> = {
  plaintext: "plain",
  text: "plain",
  txt: "plain",
  md: "markdown",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  yml: "yaml",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  ps1: "powershell",
  psm1: "powershell",
  psd1: "powershell",
  cmd: "batch",
};

const CODE_LANGUAGE_LABELS: Record<string, string> = {
  plain: "Plain Text",
  markdown: "Markdown",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  ruby: "Ruby",
  go: "Go",
  rust: "Rust",
  java: "Java",
  php: "PHP",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  yaml: "YAML",
  xml: "XML",
  sql: "SQL",
  bash: "Bash",
  powershell: "PowerShell",
  batch: "Batch",
  toml: "TOML",
};

const CODE_KEYWORDS = {
  shared: new Set([
    "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "export", "extends", "false", "finally",
    "for", "from", "function", "if", "import", "in", "let", "new", "null", "return", "static", "super", "switch", "this", "throw",
    "true", "try", "typeof", "undefined", "var", "while", "yield", "async", "await",
  ]),
  python: new Set(["and", "as", "assert", "class", "def", "del", "elif", "except", "False", "finally", "for", "from", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"]),
  bash: new Set(["if", "then", "else", "elif", "fi", "for", "do", "done", "case", "esac", "function", "in", "while"]),
  powershell: new Set(["function", "param", "if", "else", "elseif", "switch", "foreach", "return", "try", "catch", "finally", "throw", "begin", "process", "end"]),
  sql: new Set(["select", "from", "where", "join", "inner", "left", "right", "full", "outer", "on", "group", "by", "order", "insert", "into", "values", "update", "set", "delete", "create", "table", "view", "as", "and", "or", "limit"]),
};

const normalizeCodeLanguage = (value?: string): CodeLanguage => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return "plain";
  }
  return (CODE_LANGUAGE_ALIASES[normalized] ?? normalized) as CodeLanguage;
};

const inferCodeLanguageFromFileName = (fileName?: string): CodeLanguage | undefined => {
  const lower = fileName?.trim().toLowerCase();
  if (!lower) {
    return undefined;
  }
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "javascript";
  if (lower.endsWith(".sh") || lower.endsWith(".bash") || lower.endsWith(".zsh")) return "bash";
  if (lower.endsWith(".ps1") || lower.endsWith(".psm1") || lower.endsWith(".psd1")) return "powershell";
  if (lower.endsWith(".sql")) return "sql";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".scss")) return "scss";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".rs")) return "rust";
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".php")) return "php";
  if (lower.endsWith(".toml")) return "toml";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".bat") || lower.endsWith(".cmd")) return "batch";
  return undefined;
};

const inferCodeLanguage = (body: string, fileName?: string, hintedLanguage?: string): CodeLanguage => {
  const explicit = normalizeCodeLanguage(hintedLanguage);
  if (explicit !== "plain") {
    return explicit;
  }
  const fromFile = inferCodeLanguageFromFileName(fileName);
  if (fromFile) {
    return fromFile;
  }
  const trimmed = body.trim();
  if (trimmed.startsWith("#!/bin/bash") || trimmed.startsWith("#!/usr/bin/env bash") || trimmed.startsWith("$ ") || /\b(Get-ChildItem|Where-Object|Select-String|Invoke-WebRequest|Set-Content)\b/.test(trimmed)) {
    return /\b(Get-ChildItem|Where-Object|Select-String|Invoke-WebRequest|\$env:)\b/.test(trimmed) ? "powershell" : "bash";
  }
  if (/^\s*def\s+\w+\s*\(/m.test(trimmed) || /\b(import|from)\s+\w+/m.test(trimmed)) return "python";
  if (/^\s*(const|let|export|import)\s+/m.test(trimmed) || /=>/.test(trimmed)) return "typescript";
  if (/^\s*SELECT\b/i.test(trimmed) || /\bFROM\b/i.test(trimmed)) return "sql";
  if (/^\s*[\[{]/.test(trimmed)) return "json";
  return "plain";
};

export const parseCodeNote = (text: string): ParsedCodeNote => {
  const cleaned = stripWikiLinkMarkup(text).trim();
  const fenced = cleaned.match(/^\`\`\`([^\n`]*)\n([\s\S]*?)\n\`\`\`$/);
  const hintedLanguage = fenced?.[1]?.trim();
  const rawBody = fenced?.[2] ?? cleaned;
  const lines = rawBody.split(/\r?\n/);
  const firstLine = lines[0]?.trim();
  const fileName = codeFileNameMatch(cleaned)?.[1] ?? (firstLine && inferCodeLanguageFromFileName(firstLine) ? firstLine : undefined);
  const body = fileName && firstLine === fileName ? lines.slice(1).join("\n").trim() : rawBody.trim();
  const language = inferCodeLanguage(body, fileName, hintedLanguage);

  return {
    body: body || cleaned || "const idea = \"\";",
    fileName: fileName ?? undefined,
    language,
    languageLabel: CODE_LANGUAGE_LABELS[language] ?? "Code",
  };
};

export const tokenizeCodeLine = (line: string, language: CodeLanguage): CodeSegment[] => {
  const patterns = /(#.*$|\/\/.*$|--.*$|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\$env:[\w]+|\$[\w:.-]+|@[\"']|-[A-Za-z][\w-]*\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w-]*\s*(?=\()|\b[A-Za-z_][\w-]*\b|[^\sA-Za-z0-9]+)/g;
  const sharedKeywords = CODE_KEYWORDS.shared;
  const languageKeywords =
    language === "python" ? CODE_KEYWORDS.python :
      language === "bash" ? CODE_KEYWORDS.bash :
        language === "powershell" ? CODE_KEYWORDS.powershell :
          language === "sql" ? CODE_KEYWORDS.sql :
            undefined;
  const segments: CodeSegment[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(patterns)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ text: line.slice(lastIndex, start), tone: "plain" });
    }

    let tone: CodeSegment["tone"] = "plain";
    const normalized = token.trim();
    const lower = normalized.toLowerCase();

    if (/^(#|\/\/|--)/.test(normalized)) {
      tone = "comment";
    } else if (/^["'`]/.test(normalized) || /^@["']$/.test(normalized)) {
      tone = "string";
    } else if (/^\$env:|^\$[\w:.-]+/.test(normalized)) {
      tone = "variable";
    } else if (/^-[A-Za-z]/.test(normalized) && (language === "powershell" || language === "bash" || language === "batch")) {
      tone = "property";
    } else if (/^\d/.test(normalized)) {
      tone = "number";
    } else if ((languageKeywords && languageKeywords.has(lower)) || sharedKeywords.has(normalized) || sharedKeywords.has(lower)) {
      tone = "keyword";
    } else if (/^[A-Za-z_][\w-]*$/.test(normalized) && line.slice((match.index ?? 0) + token.length).trimStart().startsWith("(")) {
      tone = "function";
    } else if ((language === "bash" || language === "powershell" || language === "batch") && /^[A-Za-z_][\w-]*$/.test(normalized) && (match.index ?? 0) === line.search(/\S/)) {
      tone = "command";
    }

    segments.push({ text: token, tone });
    lastIndex = start + token.length;
  }

  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex), tone: "plain" });
  }

  return segments.length > 0 ? segments : [{ text: line, tone: "plain" }];
};
