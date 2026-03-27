"use client";

export type HelpCategoryId = "getting-started" | "workflows" | "troubleshooting" | "account";

export type HelpArticleSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type HelpArticleAction = {
  label: string;
  href: string;
};

export type HelpArticle = {
  id: string;
  title: string;
  summary: string;
  category: HelpCategoryId;
  keywords: string[];
  contexts: string[];
  readTime: string;
  sections: HelpArticleSection[];
  relatedArticleIds: string[];
  actions?: HelpArticleAction[];
};

export type HelpCategory = {
  id: HelpCategoryId;
  label: string;
  description: string;
};

export const wallShortcutRows = [
  ["N or Ctrl/Cmd + N", "New note"],
  ["Shift + G", "New canon note"],
  ["Shift + Q", "New quote note"],
  ["Shift + W", "New word note"],
  ["Q or Ctrl/Cmd + J", "Toggle quick capture bar"],
  ["P", "Toggle presentation mode"],
  ["R", "Toggle reading mode"],
  ["Ctrl/Cmd + Enter", "Capture quick-capture lines as notes"],
  ["Enter", "Edit selected note text"],
  ["Ctrl/Cmd + K", "Focus the omnibar"],
  ["Ctrl/Cmd + L", "Start link from selected note"],
  ["F", "Flip selected word flashcard"],
  ["C then 1-9", "Apply a palette color by index"],
  ["Shift + C", "Cycle selected note color"],
  ["Ctrl/Cmd + A", "Select all visible notes"],
  ["T", "Toggle timeline mode"],
  ["H", "Toggle recency heatmap"],
  ["Ctrl/Cmd + Z", "Undo last change"],
  ["Ctrl/Cmd + Shift + Z", "Redo change"],
  ["Delete / Backspace", "Delete selected content"],
  ["Ctrl/Cmd + D or Shift + D", "Duplicate selected note"],
  ["Alt + Drag", "Duplicate a note while dragging"],
  ["Shift + Drag", "Lock drag movement to one axis"],
  ["Space + Drag", "Pan wall"],
  ["Ctrl/Cmd + Wheel", "Zoom toward cursor"],
  ["Esc", "Clear selection and close overlays"],
  ["?", "Open keyboard shortcuts"],
] as const;

export const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    description: "Orientation and first-step guidance for the wall workspace.",
  },
  {
    id: "workflows",
    label: "Core Workflows",
    description: "Task-oriented help for note creation, search, and export.",
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    description: "Recovery steps for local data, sync, and blocked flows.",
  },
  {
    id: "account",
    label: "Settings & Account",
    description: "Sign-in, preferences, and workspace-level controls.",
  },
];

export const helpArticles: HelpArticle[] = [
  {
    id: "wall-orientation",
    title: "Find your way around the wall",
    summary: "Understand the wall chrome, the canvas model, and the fastest recovery path when the workspace feels lost.",
    category: "getting-started",
    keywords: ["wall", "start", "tour", "canvas", "zoom", "fit", "layout"],
    contexts: ["wall"],
    readTime: "2 min",
    sections: [
      {
        title: "What is always on screen",
        bullets: [
          "The header keeps route navigation, sync status, settings, tour replay, and profile actions close without covering the canvas.",
          "The bottom omnibar is the primary search and action surface.",
          "The right rail handles zoom and camera recovery.",
        ],
      },
      {
        title: "Fastest recovery steps",
        bullets: [
          "Use Fit from the zoom rail when the canvas feels lost.",
          "Use the tour replay action if you want a guided reset of the core wall flows.",
          "Use the help center when you are blocked and need task guidance instead of memorizing shortcuts.",
        ],
      },
    ],
    relatedArticleIds: ["search-and-actions", "keyboard-shortcuts"],
    actions: [{ label: "Open wall", href: "/wall" }],
  },
  {
    id: "create-and-edit-notes",
    title: "Create, edit, and organize notes",
    summary: "Use the tools panel, direct canvas actions, and details sidebar to build and refine a wall quickly.",
    category: "workflows",
    keywords: ["create", "edit", "notes", "tools", "details", "tags", "organize"],
    contexts: ["wall"],
    readTime: "3 min",
    sections: [
      {
        title: "Create from the wall",
        bullets: [
          "Use the tools panel for explicit note types such as note, quote, canon, image, file, poetry, or bookmark.",
          "Use keyboard shortcuts when you already know the note type you want.",
          "Use quick capture when you want to turn several short lines into notes in one pass.",
        ],
      },
      {
        title: "Refine after creation",
        bullets: [
          "Use the details sidebar to edit note metadata, tags, colors, privacy, and note-type-specific controls.",
          "Drag notes directly on the wall to build spatial relationships.",
          "Use links, zones, and groups when the wall needs more structure than loose notes.",
        ],
      },
    ],
    relatedArticleIds: ["search-and-actions", "export-and-share"],
    actions: [{ label: "Open wall", href: "/wall" }],
  },
  {
    id: "search-and-actions",
    title: "Find notes and run actions from the omnibar",
    summary: "The omnibar is both search and command surface, with token filters for note state, type, tags, and tool intent.",
    category: "workflows",
    keywords: ["search", "omnibar", "actions", "tag", "type", "tool", "find", "command"],
    contexts: ["wall"],
    readTime: "2 min",
    sections: [
      {
        title: "Search modes",
        bullets: [
          "Plain text searches note content and action labels together.",
          "Prefix the query with / when you want action results only.",
          "Use tag:, type:, is:, and tool: tokens to narrow the wall quickly.",
        ],
      },
      {
        title: "What it is good for",
        bullets: [
          "Jump to notes without scanning the whole wall.",
          "Open panels, start exports, replay the product tour, or open help from the same field.",
          "Filter visible notes while keeping the dock itself as the canonical search surface.",
        ],
      },
    ],
    relatedArticleIds: ["wall-orientation", "keyboard-shortcuts"],
    actions: [{ label: "Open wall", href: "/wall" }],
  },
  {
    id: "export-and-share",
    title: "Export, back up, and share a wall",
    summary: "Use the export surface for screenshots, documents, structured backups, and read-only sharing.",
    category: "workflows",
    keywords: ["export", "backup", "share", "png", "pdf", "markdown", "json", "publish"],
    contexts: ["wall"],
    readTime: "2 min",
    sections: [
      {
        title: "Export options",
        bullets: [
          "PNG and PDF support view, whole-wall, and focused export flows.",
          "Markdown and JSON are better for durable backups and structured recovery.",
          "Published snapshots are meant for read-only sharing.",
        ],
      },
      {
        title: "Practical advice",
        bullets: [
          "Use JSON when you need a complete portable wall backup.",
          "Use PNG or PDF when the goal is presentation rather than restoration.",
          "Keep reminder cadence enabled if you want the app to nudge you toward backups.",
        ],
      },
    ],
    relatedArticleIds: ["recover-local-data", "sync-and-account"],
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard shortcuts",
    summary: "Use the shortcut reference when you want speed without hunting through panels.",
    category: "getting-started",
    keywords: ["shortcuts", "keyboard", "keys", "commands", "hotkeys"],
    contexts: ["wall"],
    readTime: "2 min",
    sections: [
      {
        title: "Most-used shortcuts",
        bullets: wallShortcutRows.slice(0, 8).map(([combo, label]) => `${combo}: ${label}`),
      },
      {
        title: "When to use the shortcuts modal",
        bullets: [
          "Open the dedicated shortcuts modal when you want the full key list in one scan-friendly view.",
          "Use help center articles when your question is about workflow or recovery rather than a key binding.",
        ],
      },
    ],
    relatedArticleIds: ["search-and-actions", "wall-orientation"],
  },
  {
    id: "recover-local-data",
    title: "Recover from local data issues",
    summary: "When a wall looks wrong after a refresh or you suspect local persistence problems, start with the least-destructive recovery path.",
    category: "troubleshooting",
    keywords: ["recovery", "local", "storage", "missing", "reset", "restore", "data"],
    contexts: ["wall"],
    readTime: "3 min",
    sections: [
      {
        title: "Check before you reset",
        bullets: [
          "Confirm you are on the expected route and wall state.",
          "Try Fit and search before assuming notes are gone.",
          "Use exported backups if you have one before taking destructive reset steps.",
        ],
      },
      {
        title: "Escalate carefully",
        bullets: [
          "Use local reset and recovery guidance only when normal reload and navigation checks fail.",
          "Prefer structured exports and published snapshots for future recovery rather than relying on memory.",
        ],
      },
    ],
    relatedArticleIds: ["export-and-share", "sync-and-account"],
  },
  {
    id: "sync-and-account",
    title: "Sync and account basics",
    summary: "Signed-in walls can sync, but local state still matters. Understand what sync can and cannot recover for you.",
    category: "troubleshooting",
    keywords: ["sync", "account", "login", "cloud", "supabase", "pending", "error"],
    contexts: ["wall", "settings"],
    readTime: "3 min",
    sections: [
      {
        title: "What sync status means",
        bullets: [
          "Sync status shows whether the wall is connected, idle, pending, or blocked by an error.",
          "Sync supplements local-first persistence; it does not replace sensible export habits.",
          "A signed-out session will not expose the same cloud-backed flows as a signed-in one.",
        ],
      },
      {
        title: "When to inspect settings",
        bullets: [
          "Open settings to confirm account identity, appearance preferences, and startup behavior.",
          "If sync looks stale, verify that you are signed in to the expected account before deeper recovery work.",
        ],
      },
    ],
    relatedArticleIds: ["recover-local-data", "settings-and-preferences"],
    actions: [{ label: "Open settings", href: "/settings" }],
  },
  {
    id: "settings-and-preferences",
    title: "Manage settings and startup preferences",
    summary: "Control appearance, startup routing, and workspace behavior from the settings workspace or embedded wall settings modal.",
    category: "account",
    keywords: ["settings", "preferences", "theme", "startup", "appearance", "account"],
    contexts: ["settings", "wall"],
    readTime: "2 min",
    sections: [
      {
        title: "What settings controls",
        bullets: [
          "Profile and account details.",
          "Theme and appearance preferences.",
          "Startup route behavior and wall chrome preferences.",
        ],
      },
      {
        title: "Where to open it",
        bullets: [
          "Use the profile menu or the help quick actions while working on the wall.",
          "Use the dedicated settings route when you want the full workspace context.",
        ],
      },
    ],
    relatedArticleIds: ["sync-and-account", "wall-orientation"],
    actions: [{ label: "Open settings", href: "/settings" }],
  },
];

export const helpArticlesById = new Map(helpArticles.map((article) => [article.id, article] as const));

const helpSearchValue = (article: HelpArticle) =>
  [
    article.title,
    article.summary,
    article.category,
    article.keywords.join(" "),
    article.contexts.join(" "),
    article.sections.map((section) => `${section.title} ${(section.paragraphs ?? []).join(" ")} ${(section.bullets ?? []).join(" ")}`).join(" "),
  ]
    .join(" ")
    .toLowerCase();

export const getHelpArticleById = (articleId?: string | null) => {
  if (!articleId) {
    return undefined;
  }
  return helpArticlesById.get(articleId);
};

export const getHelpArticlesForCategory = (categoryId: HelpCategoryId) =>
  helpArticles.filter((article) => article.category === categoryId);

export const getRelatedHelpArticles = (article: HelpArticle) =>
  article.relatedArticleIds.map((relatedId) => helpArticlesById.get(relatedId)).filter((related): related is HelpArticle => Boolean(related));

export const searchHelpArticles = (query: string, context?: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  const visibleArticles = context ? helpArticles.filter((article) => article.contexts.includes(context)) : helpArticles;
  if (!normalizedQuery) {
    return visibleArticles;
  }

  return visibleArticles
    .map((article) => {
      const haystack = helpSearchValue(article);
      const exactTitle = article.title.toLowerCase().includes(normalizedQuery) ? 6 : 0;
      const keywordScore = article.keywords.filter((keyword) => keyword.includes(normalizedQuery)).length * 4;
      const summaryScore = article.summary.toLowerCase().includes(normalizedQuery) ? 3 : 0;
      const textScore = haystack.includes(normalizedQuery) ? 1 : 0;
      return { article, score: exactTitle + keywordScore + summaryScore + textScore };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.article.title.localeCompare(right.article.title))
    .map((entry) => entry.article);
};

export const getHelpArticleHref = (articleId: string) => `/help?article=${encodeURIComponent(articleId)}`;
