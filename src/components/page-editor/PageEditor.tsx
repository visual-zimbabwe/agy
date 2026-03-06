"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";

import { createPageSnapshotSaver, defaultPageDocId, listPageDocIds, loadPageSnapshot, savePageSnapshot } from "@/features/page/storage";
import { listCloudPageDocIds, loadCloudPageSnapshot, saveCloudPageSnapshot } from "@/features/page/cloud";
import type { BlockType, PageBlock, PageBookmarkData, PageCodeData, PageEmbedData, PageNumberedFormat, PageTableData } from "@/features/page/types";
import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SlashCommandId = BlockType;
type SlashCommandGroup = "basic" | "media";
type SlashCommand = { id: SlashCommandId; label: string; description: string; aliases: string[]; group: SlashCommandGroup; symbol?: string; trigger?: string };
type MenuState = { blockId: string; query: string; slashRange: { start: number; end: number }; anchorX: number; anchorY: number };
type QuickInsertMenuState = { open: boolean; blockId?: string; x: number; y: number };
type CanvasMenuState = { open: boolean; x: number; y: number; worldX: number; worldY: number };
type FileMenuState = { open: boolean; x: number; y: number; blockId?: string };
type BlockMenuState = { open: boolean; x: number; y: number; blockId?: string; moveToQuery: string; searchQuery: string };
type CodeMenuState = { open: boolean; x: number; y: number; blockId?: string };
type FileInsertIntent = "file" | "image" | "video" | "audio" | "bookmark";
type FileInsertMode = "upload" | "link";
type FileInsertState = { open: boolean; intent: FileInsertIntent; mode: FileInsertMode; worldX: number; worldY: number; x: number; y: number; url: string; afterBlockId?: string };
type DragPreviewState =
  | { mode: "insert"; x: number; y: number; width: number }
  | { mode: "nest"; x: number; y: number; height: number }
  | { mode: "column"; x: number; y: number; width: number; height: number };
type DropIntent =
  | { mode: "insert"; target: PageBlock; y: number }
  | { mode: "column"; target: PageBlock; x: number; y: number; width: number; height: number }
  | { mode: "nest"; target: PageBlock; y: number };
type CommentPanelState = {
  open: boolean;
  blockId?: string;
  x: number;
  y: number;
  draft: string;
  attachments: string[];
  mentions: string[];
  menuCommentId?: string;
  deleteConfirmCommentId?: string;
  editingCommentId?: string;
};

const DOC_WIDTH = 680;
const LINE_HEIGHT = 32;
const LIST_ITEM_GAP = 6;
const DEFAULT_BLOCK_GAP = 14;
const INDENT_STEP = 24;
const MAX_LIST_INDENT = 8;
const ATTRIBUTION_PREFIX = "-- ";
const HANDLE_DRAG_MOVE_THRESHOLD = 4;
const DRAG_INSERT_X_THRESHOLD = 36;
const DRAG_TARGET_Y_THRESHOLD = 92;
const DRAG_COLUMN_X_THRESHOLD = 116;
const DRAG_COLUMN_Y_THRESHOLD = 52;
const DRAG_NEST_MIN_OFFSET = 8;
const DRAG_NEST_MAX_OFFSET = 98;
const DEFAULT_NUMBERED_FORMAT: PageNumberedFormat = "numbers";
const DEFAULT_TABLE_ROWS = 3;
const DEFAULT_TABLE_COLUMNS = 2;
const TABLE_ROW_HEIGHT = 40;
const TABLE_CONTROLS_HEIGHT = 40;

const BLOCK_TEXT_COLORS = [
  { id: "default", label: "Default text", value: "", preview: "#2e2e2e" },
  { id: "gray", label: "Gray text", value: "#6b7280", preview: "#6b7280" },
  { id: "brown", label: "Brown text", value: "#7c4a2d", preview: "#7c4a2d" },
  { id: "orange", label: "Orange text", value: "#c25900", preview: "#c25900" },
  { id: "yellow", label: "Yellow text", value: "#ad7f00", preview: "#ad7f00" },
  { id: "green", label: "Green text", value: "#2f855a", preview: "#2f855a" },
  { id: "blue", label: "Blue text", value: "#2f6fd6", preview: "#2f6fd6" },
  { id: "purple", label: "Purple text", value: "#805ad5", preview: "#805ad5" },
  { id: "pink", label: "Pink text", value: "#b83280", preview: "#b83280" },
  { id: "red", label: "Red text", value: "#dc2626", preview: "#dc2626" },
] as const;

const BLOCK_BG_COLORS = [
  { id: "default", label: "Default background", value: "", preview: "#ffffff" },
  { id: "gray", label: "Gray background", value: "#f3f4f6", preview: "#f3f4f6" },
  { id: "brown", label: "Brown background", value: "#f4eee8", preview: "#f4eee8" },
  { id: "orange", label: "Orange background", value: "#fff1e6", preview: "#fff1e6" },
  { id: "yellow", label: "Yellow background", value: "#fef9db", preview: "#fef9db" },
  { id: "green", label: "Green background", value: "#ecfdf3", preview: "#ecfdf3" },
  { id: "blue", label: "Blue background", value: "#eaf2ff", preview: "#eaf2ff" },
  { id: "purple", label: "Purple background", value: "#f4efff", preview: "#f4efff" },
  { id: "pink", label: "Pink background", value: "#fdf0f7", preview: "#fdf0f7" },
  { id: "red", label: "Red background", value: "#fef0f0", preview: "#fef0f0" },
] as const;

const CODE_LANGUAGES = [
  "Plain Text",
  "JavaScript",
  "TypeScript",
  "TSX",
  "JSX",
  "JSON",
  "HTML",
  "CSS",
  "SQL",
  "Python",
  "Bash",
  "Markdown",
] as const;

const TURN_INTO_TYPES: Array<{ type: BlockType; label: string }> = [
  { type: "text", label: "Text" },
  { type: "h1", label: "Heading 1" },
  { type: "h2", label: "Heading 2" },
  { type: "h3", label: "Heading 3" },
  { type: "todo", label: "To-do list" },
  { type: "bulleted", label: "Bulleted list" },
  { type: "numbered", label: "Numbered list" },
  { type: "toggle", label: "Toggle" },
  { type: "table", label: "Table" },
  { type: "quote", label: "Quote" },
  { type: "callout", label: "Callout" },
  { type: "divider", label: "Divider" },
  { type: "code", label: "Code" },
  { type: "bookmark", label: "Web bookmark" },
  { type: "embed", label: "Embed" },
];

const slashCommands: SlashCommand[] = [
  { id: "text", label: "Text", description: "Plain paragraph.", aliases: ["text", "paragraph", "p"], group: "basic", symbol: "T", trigger: "" },
  { id: "h1", label: "Heading 1", description: "Large heading.", aliases: ["h1", "header", "title"], group: "basic", symbol: "H1", trigger: "#" },
  { id: "h2", label: "Heading 2", description: "Medium heading.", aliases: ["h2", "header2"], group: "basic", symbol: "H2", trigger: "##" },
  { id: "h3", label: "Heading 3", description: "Small heading.", aliases: ["h3", "header3"], group: "basic", symbol: "H3", trigger: "###" },
  { id: "bulleted", label: "Bulleted list", description: "Bullet item.", aliases: ["bullet", "list"], group: "basic", symbol: "-", trigger: "-" },
  { id: "numbered", label: "Numbered list", description: "Numbered item.", aliases: ["numbered", "ordered", "ol"], group: "basic", symbol: "1.", trigger: "1." },
  { id: "toggle", label: "Toggle list", description: "Collapsible list item.", aliases: ["toggle", "collapsible"], group: "basic", symbol: ">", trigger: ">" },
  { id: "table", label: "Table", description: "Simple table.", aliases: ["table", "grid", "simple table"], group: "basic", symbol: "▦", trigger: "/table" },
  { id: "todo", label: "To-do list", description: "Checkbox task.", aliases: ["todo", "task", "checkbox"], group: "basic", symbol: "[]", trigger: "[]" },
  { id: "file", label: "File", description: "Upload or embed a file.", aliases: ["file", "files", "upload"], group: "media", symbol: "F", trigger: "/file" },
  { id: "image", label: "Image", description: "Upload or link an image.", aliases: ["image", "photo", "img"], group: "media", symbol: "I", trigger: "/image" },
  { id: "video", label: "Video", description: "Upload or link a video.", aliases: ["video", "movie"], group: "media", symbol: "V", trigger: "/video" },
  { id: "audio", label: "Audio", description: "Upload or link audio.", aliases: ["audio", "sound"], group: "media", symbol: "A", trigger: "/audio" },
  { id: "bookmark", label: "Web bookmark", description: "Create a link preview.", aliases: ["bookmark", "web bookmark", "web", "link"], group: "media", symbol: "↗", trigger: "/bookmark" },
  { id: "embed", label: "Embed", description: "Embed from a URL.", aliases: ["embed", "iframe", "media embed"], group: "media", symbol: "◫", trigger: "/embed" },
  { id: "quote", label: "Quote", description: "Quoted text.", aliases: ["quote", "citation"], group: "basic", symbol: "\"", trigger: "" },
  { id: "divider", label: "Divider", description: "Horizontal separator.", aliases: ["divider", "div", "hr", "line"], group: "basic", symbol: "---", trigger: "---" },
  { id: "callout", label: "Callout", description: "Highlighted block.", aliases: ["callout", "note"], group: "basic", symbol: "!", trigger: "" },
  { id: "code", label: "Code", description: "Code snippet.", aliases: ["code", "snippet"], group: "basic", symbol: "</>", trigger: "/code" },
];

const idFor = () => `blk_${Math.random().toString(36).slice(2, 10)}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const isImageMime = (mimeType?: string) => Boolean(mimeType && mimeType.toLowerCase().startsWith("image/"));
const isListBlockType = (type: BlockType) => type === "todo" || type === "bulleted" || type === "numbered" || type === "toggle";
const inlineFormattingPattern = /\[[^\]]+\]\((https?:\/\/[^\s)]+)\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|@[\w.-]+/;
const hasInlineFormatting = (value: string) => inlineFormattingPattern.test(value);
const createDefaultTableData = (rows = DEFAULT_TABLE_ROWS, columns = DEFAULT_TABLE_COLUMNS): PageTableData => ({
  rows,
  columns,
  cells: Array.from({ length: rows }, () => Array.from({ length: columns }, () => "")),
});
const createDefaultCodeData = (): PageCodeData => ({
  language: "Plain Text",
  wrap: false,
  caption: "",
});
const tableHeightFor = (rows: number) => Math.max(136, TABLE_CONTROLS_HEIGHT + rows * TABLE_ROW_HEIGHT);
const ensureTableData = (table: PageTableData | undefined): PageTableData => {
  if (!table) {
    return createDefaultTableData();
  }
  const rows = Math.max(1, Math.floor(table.rows || DEFAULT_TABLE_ROWS));
  const columns = Math.max(1, Math.floor(table.columns || DEFAULT_TABLE_COLUMNS));
  const cells = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, columnIndex) => table.cells?.[rowIndex]?.[columnIndex] ?? ""),
  );
  return {
    rows,
    columns,
    cells,
    headerRow: table.headerRow ?? false,
    headerColumn: table.headerColumn ?? false,
  };
};

const newBlock = (type: BlockType, x: number, y: number): PageBlock => {
  if (type === "todo") return { id: idFor(), type, content: "", checked: false, x, y, w: DOC_WIDTH, h: LINE_HEIGHT };
  if (type === "numbered") return { id: idFor(), type, content: "", numberedFormat: DEFAULT_NUMBERED_FORMAT, x, y, w: DOC_WIDTH, h: LINE_HEIGHT };
  if (type === "toggle") return { id: idFor(), type, content: "", expanded: true, x, y, w: DOC_WIDTH, h: LINE_HEIGHT };
  if (type === "table") return { id: idFor(), type, content: "", table: createDefaultTableData(), x, y, w: DOC_WIDTH, h: tableHeightFor(DEFAULT_TABLE_ROWS) };
  if (type === "bookmark") return { id: idFor(), type, content: "", bookmark: inferBookmarkDataFromUrl(""), x, y, w: DOC_WIDTH, h: 178 };
  if (type === "embed") return { id: idFor(), type, content: "", embed: { url: "", embedUrl: "", provider: "", title: "" }, x, y, w: DOC_WIDTH, h: 178 };
  if (type === "divider") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 18 };
  if (type === "h1") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 60 };
  if (type === "h2") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 52 };
  if (type === "h3") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 44 };
  if (type === "code") return { id: idFor(), type, content: "", code: createDefaultCodeData(), x, y, w: DOC_WIDTH, h: 110 };
  if (type === "quote") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 64 };
  if (type === "callout") return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: 64 };
  return { id: idFor(), type, content: "", x, y, w: DOC_WIDTH, h: LINE_HEIGHT };
};

type TemplateLine = { type: BlockType; content?: string; table?: PageTableData };
type TemplateCluster = { offsetX: number; offsetY: number; lines: TemplateLine[] };

const estimateTemplateBlockHeight = (type: BlockType, content: string): number => {
  const text = (content || "").trim();
  if (!text.length) return LINE_HEIGHT;
  const explicitLineBreaks = text.split("\n").length - 1;
  if (type === "h1") {
    const lines = Math.max(1, Math.ceil(text.length / 24) + explicitLineBreaks);
    return Math.max(64, lines * 58 + 8);
  }
  if (type === "h2") {
    const lines = Math.max(1, Math.ceil(text.length / 30) + explicitLineBreaks);
    return Math.max(56, lines * 46 + 8);
  }
  if (type === "h3") {
    const lines = Math.max(1, Math.ceil(text.length / 38) + explicitLineBreaks);
    return Math.max(48, lines * 38 + 8);
  }
  if (type === "bulleted" || type === "numbered" || type === "toggle") {
    const lines = Math.max(1, Math.ceil(text.length / 72) + explicitLineBreaks);
    return Math.max(LINE_HEIGHT + 6, lines * 28 + 18);
  }
  const lines = Math.max(1, Math.ceil(text.length / 82) + explicitLineBreaks);
  return Math.max(LINE_HEIGHT + 8, lines * 30 + 20);
};

const textbookSection = [
  "Pottery for Beginners (Kara Leigh Ford): https://www.barnesandnoble.com/w/pottery-for-beginners-kara-leigh-ford/1137455936",
  "The Ceramics Bible, Revised Edition (Louisa Taylor): https://www.barnesandnoble.com/w/the-ceramics-bible-revised-edition-louisa-taylor/1139993550",
  "A Potter's Workbook (Clary Illian): https://www.barnesandnoble.com/w/a-potters-workbook-clary-illian/1122986673",
  "Amazon search (Pottery for Beginners): https://www.amazon.com/s?k=Pottery+for+Beginners+Kara+Leigh+Ford",
  "Amazon search (The Ceramics Bible): https://www.amazon.com/s?k=The+Ceramics+Bible+Louisa+Taylor",
  "Amazon search (A Potter's Workbook): https://www.amazon.com/s?k=A+Potter%27s+Workbook+Clary+Illian",
];

const gradingTableForForm = (formLabel: string): PageTableData => ({
  rows: 8,
  columns: 3,
  cells: [
    ["Component", "Weight", `${formLabel} Notes`],
    ["Technical Throw Downs", "15%", "Weekly timed skill checks with process and safety scoring."],
    ["Main Makes (term projects)", "25%", "Three major builds with design brief, heritage link, and critique."],
    ["Portfolio + Reflection", "15%", "Sketches, research, tests, photos, learning journal, self-assessment."],
    ["Professional Conduct", "5%", "Attendance, cleanup, teamwork, critique etiquette, safe studio habits."],
    ["Practical Exam", "25%", "Timed production task with craftsmanship and function criteria."],
    ["Written Theory Task", "10%", "Materials science, design rationale, heritage analysis, entrepreneurship."],
    ["Viva / Presentation", "5%", "Oral defense of design and process decisions."],
  ],
  headerRow: true,
});

const makeWeekDetail = (week: number, theme: string, formFocus: string) =>
  `Week ${week}: ${theme}. This week is designed as a creative mission where learners plan, build, test, and revise one focused pottery outcome. The opening session connects heritage examples to the week's target skill, then the Technical Throw Down trains speed and control under friendly pressure. Studio time emphasizes ${formFocus}, with learners documenting choices, errors, and fixes in their portfolio logs. The week ends with a short critique circle where peers give practical feedback, celebrate improvements, and set one measurable target for the next studio cycle.`;

const form1Description =
  "Form 1 Pottery is a high-energy foundation course that introduces learners to clay as both a practical material and a storytelling medium. Students begin with studio orientation, safety routines, and basic clay preparation, then rapidly move into hand-building through pinch, coil, and slab methods. The course is intentionally interactive: each week includes a Technical Throw Down, a themed Main Make, and a critique session where learners learn how to speak about art confidently and respectfully. Heritage is central. Learners examine Zimbabwean household vessel traditions, local motifs, and everyday utility forms, then reinterpret them in their own projects. By the end of the course, learners can produce functional ceramic objects with growing consistency and can explain how design choices connect to purpose, identity, and culture. The tone stays playful, reflective, and ambitious so that students enjoy making while building serious technical habits. This syllabus is designed to support both teacher-led and self-directed learning through clear milestones, visible weekly targets, and portfolio-based evidence of growth.";

const form1Objectives =
  "By the end of Form 1, learners should demonstrate practical confidence in core hand-building methods and be able to transform basic ideas into complete ceramic outcomes. Learners should identify and explain essential studio vocabulary, clay behavior, drying stages, and safe handling procedures for tools and shared workspaces. Learners should prepare clay correctly, join pieces with minimal failure, and maintain consistent wall thickness in beginner-level forms. Learners should use observation and sketching to study Zimbabwean vessel types and symbolic patterns, then adapt those references in age-appropriate, original designs. Learners should complete weekly challenge tasks within time limits, reflect on mistakes without fear, and use feedback to improve the next iteration. They should also build portfolio discipline by recording test results, process photos, and brief written reflections after each project cycle. Learners should communicate clearly during critiques, identify strengths and weaknesses in their own work, and propose actionable improvements. Finally, learners should show positive studio citizenship through attendance, cleanup responsibility, respectful collaboration, and safe conduct around materials and equipment.";

const form2Description =
  "Form 2 Pottery advances learners from foundational making into controlled repetition, functional design, and early wheel confidence. Students continue hand-building where needed but begin structured wheel practice through centering, cylinder control, and ergonomic mug development. Lessons remain challenge-driven and fun, with clear weekly goals and practical mini-competitions that reward precision and creativity. Cultural relevance remains essential: learners develop motif families inspired by Zimbabwean decorative language and apply them to modern utility ware such as cups, serving pieces, and water vessels. Technical depth increases through glaze and slip testing, where students compare outcomes, diagnose simple defects, and make evidence-based adjustments. The course also introduces product thinking: learners evaluate comfort, balance, durability, and user experience in their forms. By the end of Form 2, students should be able to make small coherent sets, document repeatable processes, and explain how function, heritage, and aesthetics can coexist in one object. The curriculum is built to be engaging for teens while maintaining a strong skills trajectory toward advanced study.";

const form2Objectives =
  "By the end of Form 2, learners should produce functional ceramic forms with improved consistency and measurable control over dimensions, finish quality, and usability. Learners should center clay and throw basic cylinders, then transform those forms into mugs or cups that meet simple ergonomic criteria. Learners should execute repeated forms in short production runs and track variation using tolerance checks. They should design and run glaze or slip test matrices, record variables, and interpret results in clear portfolio notes. Learners should apply motif systems drawn from Zimbabwean visual traditions with intention rather than decoration by habit, explaining symbolic choices in short written statements. Learners should participate in weekly critique using technical language, compare peer solutions constructively, and convert feedback into specific adjustments. Students should strengthen planning behavior by sequencing tasks across drying, trimming, and finishing windows. They should also begin entrepreneurship basics: simple costing, material-use estimates, and quality control expectations for school display or sale contexts. Learners should show increasing independence while still following safety rules, collaborative norms, and responsible use of shared resources.";

const form3Description =
  "Form 3 Pottery is the innovation year: learners move from skill execution to integrated problem-solving, expressive narrative work, and enterprise-focused production. Students build complex forms, including assembled vessels and sculptural pieces, while balancing technical reliability with creative risk-taking. Weekly classes retain the studio-game format, but challenges now demand stronger planning, faster diagnostics, and more independent decision-making. Heritage research deepens beyond motifs into meaning, as learners use proverbs, social themes, and community narratives to shape concept-driven work. In parallel, students develop market awareness by prototyping small product lines, testing price points, and gathering user feedback. This makes the course practical, contemporary, and motivating for high school learners who want both artistic and livelihood relevance. Reflection remains central: learners maintain technical logs, defect analyses, and revision plans that show how outcomes improve over time. By course end, learners should produce work that is technically stronger, conceptually clearer, and ready for exhibition or supervised market presentation within a school context.";

const form3Objectives =
  "By the end of Form 3, learners should demonstrate the ability to plan, produce, and refine advanced pottery outcomes that satisfy both technical and conceptual criteria. Learners should construct complex forms with stable structure, clean joins, and controlled finishing, including pouring vessels and assembled profiles. Learners should identify likely defect causes before firing and apply preventive strategies during build, drying, and glaze stages. They should create sculptural work that communicates a clear narrative, drawing on Zimbabwean social themes, symbols, and community values in a respectful and meaningful way. Learners should manage a small-batch production workflow with cost awareness, quality checkpoints, and post-production review. They should gather and interpret customer or peer feedback, then revise products to improve function, aesthetics, and durability. Students should present process evidence coherently through annotated sketches, tests, photos, and reflective writing that explains decisions and tradeoffs. They should contribute maturely to critique sessions by giving concrete, usable feedback and receiving critique without defensiveness. Learners should also model leadership in studio safety, teamwork, and resource stewardship.";

const form4Description =
  "Form 4 Pottery is a capstone year designed for specialization, exam readiness, and professional presentation. Learners are expected to work with greater independence while still benefiting from structured coaching and peer critique. The course begins with proposal writing and benchmark analysis, then progresses through prototype testing, defect correction, and full capstone production cycles. Weekly learning remains active and student-centered: each week has challenge goals, evidence requirements, and reflection checkpoints so learners can monitor growth like developing studio practitioners. Heritage integration is expected at a deeper level, with students justifying symbolism, material choices, and design language in writing and oral defense. Enterprise and curation components ensure that learners understand audience, display quality, pricing logic, and communication strategy for exhibitions or school market events. The final outcome is a portfolio-ready body of work with clear process evidence. Form 4 is intentionally demanding but motivating, helping learners transition confidently into O-Level pathways, further art study, or practical creative enterprise opportunities.";

const form4Objectives =
  "By the end of Form 4, learners should complete and defend a coherent capstone pottery project that demonstrates technical control, design maturity, and reflective decision-making. Learners should prepare formal proposals with aims, references, timeline, risk points, and resource plans. They should execute prototypes, test alternatives, and refine final forms based on documented evidence rather than guesswork. Learners should perform timed exam-style technical tasks and sustain quality under pressure through workflow planning and discipline. They should write concise but analytical rationale statements linking function, heritage interpretation, user context, and production constraints. Learners should curate final outputs for public display, making informed choices about grouping, labeling, and presentation clarity. They should communicate confidently in viva settings, answering questions about method, defects, revisions, and conceptual intent. Learners should demonstrate advanced portfolio practice through consistent logs, test boards, photography, and evaluation notes that show iterative growth across the term. Finally, learners should model professional behavior in studio ethics, collaboration, safety compliance, and responsible use of shared tools and facilities.";

const assignmentDetail = (formLabel: string, assignments: string) =>
  `${formLabel} major assignments are designed as performance journeys, not one-off submissions. ${assignments} For each assignment, learners must submit five evidence components: (1) design brief interpretation, (2) exploratory sketches and motif references, (3) process log with dated progress notes and photos, (4) technical test evidence such as joins, glaze or form trials, and (5) final reflection explaining what changed between draft and final version. Marks reward improvement and intelligent revision, not perfection on first attempt. Students are encouraged to experiment boldly, then justify their choices with evidence.`;

const classPolicy =
  "Class and lab policy: Attendance is expected because ceramics is cumulative and studio momentum matters. Late arrivals must join quietly and review posted task goals before asking for support. Every learner is responsible for station setup, cleanup, and safe return of tools before dismissal; unfinished cleanup affects participation marks. No unsupervised kiln operation is allowed. Dust control is mandatory: wet-cleaning only, no dry sweeping. During critique, students must use respectful language, give specific feedback, and avoid personal comments. Phones are permitted only for portfolio photos or teacher-approved research. Learners with accommodations may use adaptive tools, alternate timing, and multimodal evidence pathways without penalty. If materials are damaged, report immediately; honesty is valued more than concealment. In all sessions, safety, respect, and effort are non-negotiable.";

const buildFormCluster = (
  formHeading: string,
  description: string,
  objectives: string,
  weeklyThemes: string[],
  formFocus: string,
  assignments: string,
): TemplateLine[] => {
  const weeklyLines = weeklyThemes.map((theme, index) => ({
    type: "bulleted" as const,
    content: makeWeekDetail(index + 1, theme, formFocus),
  }));
  return [
    { type: "h1", content: formHeading },
    { type: "h2", content: "Course Description (200-250 words)" },
    { type: "text", content: description },
    { type: "h2", content: "Course Objectives (300-350 words)" },
    { type: "text", content: objectives },
    { type: "h2", content: "Textbook (Recommended)" },
    ...textbookSection.map((entry) => ({ type: "bulleted" as const, content: entry })),
    { type: "h2", content: "Weekly Content Outline (10 Weeks)" },
    ...weeklyLines,
    { type: "h2", content: "Grading Table" },
    { type: "table", table: gradingTableForForm(formHeading.split(" ")[0] ?? "Form") },
    { type: "h2", content: "Major Assignment Detail (Expanded)" },
    { type: "text", content: assignmentDetail(formHeading, assignments) },
    { type: "h2", content: "Class and Lab Policy for Students (150-200 words)" },
    { type: "text", content: classPolicy },
  ];
};

const potteryTemplateClusters: TemplateCluster[] = [
  {
    offsetX: 0,
    offsetY: 0,
    lines: buildFormCluster(
      "Form 1 Pottery Syllabus (Detailed Cluster)",
      form1Description,
      form1Objectives,
      [
        "Studio induction, safety game, and clay bootcamp",
        "Pinch-form mission and proportion challenge",
        "Coil-building marathon with wall-thickness checkpoints",
        "Slab-construction mini architecture challenge",
        "Texture lab and motif extraction workshop",
        "Traditional vessel interpretation sprint",
        "Handle and lid engineering week",
        "Drying and defect prevention clinic",
        "Main Make final build and finishing",
        "Exhibition day, critique, and portfolio defense",
      ],
      "hand-building confidence, safe routines, and clear evidence habits",
      "Assignment A: Family Utility Set. Assignment B: Nyanga Story Tile Panel. Assignment C: Lidded Storage Pot. Alternative challenge: seed-saving jar series linked to the school garden.",
    ),
  },
  {
    offsetX: 1800,
    offsetY: 0,
    lines: buildFormCluster(
      "Form 2 Pottery Syllabus (Detailed Cluster)",
      form2Description,
      form2Objectives,
      [
        "Wheel safety and centering launch challenge",
        "Cylinder mastery and height control drill",
        "Mug ergonomics and handle comfort testing",
        "Set consistency and tolerance checkpoint",
        "Surface pattern system and heritage motif remix",
        "Slip and underglaze studio experiments",
        "Glaze matrix testing and defect diagnosis",
        "Functional jug design and pour-flow evaluation",
        "Main Make polishing and display preparation",
        "Assessment showcase and design statement defense",
      ],
      "wheel entry, repeatable quality, and function-driven design",
      "Assignment A: Functional Heritage Mug Line. Assignment B: Tea-for-two service set. Assignment C: Decorative Water Jug with narrative band. Alternative challenge: community proverb mug series.",
    ),
  },
  {
    offsetX: 3600,
    offsetY: 0,
    lines: buildFormCluster(
      "Form 3 Pottery Syllabus (Detailed Cluster)",
      form3Description,
      form3Objectives,
      [
        "Advanced form briefing and structural planning",
        "Pouring vessel engineering and lid systems",
        "Leak test protocols and usability redesign",
        "Narrative sculpture ideation and symbolism mapping",
        "Surface storytelling and texture sequencing",
        "Firing strategy and failure-risk control",
        "Product line concept and prototype sprint",
        "Costing, pricing, and customer persona testing",
        "Production run and quality moderation",
        "Market presentation, critique, and reflection summit",
      ],
      "advanced form reliability, concept clarity, and enterprise decisions",
      "Assignment A: Teapot/Jug performance challenge. Assignment B: Ubuntu in Clay sculpture with artist talk. Assignment C: Three-item market-ready product line with costing and feedback documentation. Alternative challenge: relief tile mural.",
    ),
  },
  {
    offsetX: 5400,
    offsetY: 0,
    lines: buildFormCluster(
      "Form 4 Pottery Syllabus (Detailed Cluster)",
      form4Description,
      form4Objectives,
      [
        "Capstone proposal lab and benchmark mapping",
        "Prototype build and precision replication tests",
        "Material trials and risk mitigation planning",
        "Capstone production sprint 1",
        "Defect clinic and targeted refinement",
        "Capstone production sprint 2",
        "Portfolio curation and evidence audit",
        "Mock practical exam under timed conditions",
        "Viva rehearsal and feedback integration",
        "Final exhibition and professional reflection",
      ],
      "capstone execution, exam performance, and professional presentation",
      "Assignment A: Contemporary Heritage Tableware brief. Assignment B: Capstone production sequence. Assignment C: Final curated showcase and enterprise pitch. Alternative challenge: social-impact ceramics innovation project.",
    ),
  },
];

const potteryTemplateForm1Title = "Form 1 Pottery Syllabus (Detailed Cluster)";
const legacyPotteryTemplateTitle = "Nyanga Pottery Programme: Separate Syllabi for Forms 1-4 (Horizontal Pages)";

const buildPotteryTemplateBlocks = (startX: number, startY: number): PageBlock[] => {
  const blocks: PageBlock[] = [];
  for (let clusterIndex = 0; clusterIndex < potteryTemplateClusters.length; clusterIndex += 1) {
    const cluster = potteryTemplateClusters[clusterIndex]!;
    let y = startY + cluster.offsetY;
    const x = startX + cluster.offsetX;
    for (let lineIndex = 0; lineIndex < cluster.lines.length; lineIndex += 1) {
      const line = cluster.lines[lineIndex]!;
      const block = newBlock(line.type, x, y);
      block.id = `tpl_${clusterIndex}_${lineIndex}`;
      if (line.type === "table" && line.table) {
        block.table = line.table;
        block.h = tableHeightFor(line.table.rows);
        block.content = "";
      } else {
        block.content = line.content ?? "";
        block.h = estimateTemplateBlockHeight(line.type, block.content);
      }
      blocks.push(block);
      y += Math.max(block.h + 12, LINE_HEIGHT + 10);
    }
  }
  return blocks;
};

const createEmptyPage = (): PageBlock[] => buildPotteryTemplateBlocks(120, 120);

const hasPotteryTemplate = (blocks: PageBlock[]) =>
  blocks.some((block) => block.type === "h1" && block.content.trim() === potteryTemplateForm1Title);

const appendPotteryTemplateOnCanvas = (blocks: PageBlock[]): PageBlock[] => {
  if (hasPotteryTemplate(blocks)) {
    return blocks;
  }
  const maxRight = blocks.reduce((max, block) => Math.max(max, block.x + Math.max(block.w || DOC_WIDTH, 0)), 120);
  const minY = blocks.reduce((min, block) => Math.min(min, block.y), 120);
  const startX = Math.max(120, maxRight + 320);
  const startY = Math.max(120, minY);
  return [...blocks, ...buildPotteryTemplateBlocks(startX, startY)];
};

const migrateLegacyPotteryTemplate = (blocks: PageBlock[]): PageBlock[] => {
  const hasLegacyHeader = blocks.some((block) => block.type === "h1" && block.content.trim() === legacyPotteryTemplateTitle);
  if (!hasLegacyHeader) {
    return blocks;
  }
  const legacyTemplateBlocks = blocks.filter((block) => block.id.startsWith("tpl_"));
  const retained = blocks.filter((block) => !block.id.startsWith("tpl_"));
  const startX = legacyTemplateBlocks.length ? Math.min(...legacyTemplateBlocks.map((block) => block.x)) : 120;
  const startY = legacyTemplateBlocks.length ? Math.min(...legacyTemplateBlocks.map((block) => block.y)) : 120;
  return [...retained, ...buildPotteryTemplateBlocks(startX, startY)];
};

const migrateCompactPotteryTemplate = (blocks: PageBlock[]): PageBlock[] => {
  const templateBlocks = blocks.filter((block) => block.id.startsWith("tpl_"));
  if (!templateBlocks.length) return blocks;
  const compactLongTextCount = templateBlocks.filter(
    (block) =>
      (block.type === "text" || block.type === "bulleted" || block.type === "numbered" || block.type === "toggle") &&
      block.content.trim().length > 200 &&
      block.h <= 48,
  ).length;
  if (compactLongTextCount < 4) return blocks;
  const retained = blocks.filter((block) => !block.id.startsWith("tpl_"));
  const startX = Math.min(...templateBlocks.map((block) => block.x));
  const startY = Math.min(...templateBlocks.map((block) => block.y));
  return [...retained, ...buildPotteryTemplateBlocks(startX, startY)];
};

const migrateOverlappingPotteryTemplate = (blocks: PageBlock[]): PageBlock[] => {
  const templateBlocks = blocks.filter((block) => block.id.startsWith("tpl_"));
  if (!templateBlocks.length) return blocks;
  const groups = new Map<number, PageBlock[]>();
  for (const block of templateBlocks) {
    const bucket = Math.round(block.x / 100);
    const current = groups.get(bucket) ?? [];
    current.push(block);
    groups.set(bucket, current);
  }

  let hasOverlap = false;
  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => a.y - b.y);
    for (let index = 0; index < ordered.length - 1; index += 1) {
      const current = ordered[index]!;
      const next = ordered[index + 1]!;
      const minNextY = current.y + current.h + 8;
      if (next.y < minNextY) {
        hasOverlap = true;
        break;
      }
    }
    if (hasOverlap) break;
  }

  if (!hasOverlap) return blocks;
  const retained = blocks.filter((block) => !block.id.startsWith("tpl_"));
  const startX = Math.min(...templateBlocks.map((block) => block.x));
  const startY = Math.min(...templateBlocks.map((block) => block.y));
  return [...retained, ...buildPotteryTemplateBlocks(startX, startY)];
};

const isPlaceholderPage = (blocks: PageBlock[] | undefined): boolean =>
  Boolean(
    blocks &&
      blocks.length === 1 &&
      blocks[0]?.type === "text" &&
      (!blocks[0].content || blocks[0].content.trim().length === 0),
  );

const parseSlashQuery = (value: string, cursor: number) => {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/(^|\s)\/([^\s/]*)$/);
  if (!match || match.index === undefined) return null;
  const fullMatch = match[0];
  const slashStart = match.index + fullMatch.lastIndexOf("/");
  return { query: match[2] ?? "", start: slashStart, end: cursor };
};

const blockGapFor = (type: BlockType) => (isListBlockType(type) ? LIST_ITEM_GAP : DEFAULT_BLOCK_GAP);

const inferDropIntent = (leadX: number, leadY: number, leadH: number, candidates: PageBlock[]): DropIntent | null => {
  const target = candidates
    .map((entry) => ({ entry, score: Math.abs(entry.y - leadY) + Math.abs(entry.x - leadX) * 0.12 }))
    .filter((item) => Math.abs(item.entry.y - leadY) < DRAG_TARGET_Y_THRESHOLD)
    .sort((a, b) => a.score - b.score)[0]?.entry;
  if (!target) return null;

  if (Math.abs(leadX - target.x) <= DRAG_INSERT_X_THRESHOLD) {
    const y = target.y + Math.max(target.h + blockGapFor(target.type), LINE_HEIGHT + blockGapFor(target.type));
    return { mode: "insert", target, y };
  }

  if (Math.abs(leadY - target.y) <= DRAG_COLUMN_Y_THRESHOLD && Math.abs(leadX - target.x) > DRAG_COLUMN_X_THRESHOLD) {
    const horizontalOffset = leadX > target.x ? target.w * 0.55 : -target.w * 0.55;
    return {
      mode: "column",
      target,
      x: target.x + horizontalOffset,
      y: target.y,
      width: Math.max(140, target.w * 0.45),
      height: Math.max(LINE_HEIGHT + 8, leadH),
    };
  }

  if (leadY > target.y && leadX > target.x + DRAG_NEST_MIN_OFFSET && leadX < target.x + DRAG_NEST_MAX_OFFSET) {
    const y = target.y + Math.max(target.h + blockGapFor(target.type), LINE_HEIGHT + blockGapFor(target.type));
    return { mode: "nest", target, y };
  }

  return null;
};

const isBulkTodoShortcut = (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (event.metaKey || event.ctrlKey) && (event.altKey || event.shiftKey) && (event.code === "Digit4" || event.key === "4" || event.key === "$");
const isBulletedShortcut = (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (event.metaKey || event.ctrlKey) && event.shiftKey && (event.code === "Digit5" || event.key === "5" || event.key === "%");
const isNumberedShortcut = (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (event.metaKey || event.ctrlKey) &&
  (event.altKey || event.shiftKey) &&
  (event.code === "Digit6" || event.key === "6" || event.key === "^");
const isToggleShortcut = (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (event.metaKey || event.ctrlKey) &&
  (event.altKey || event.shiftKey) &&
  (event.code === "Digit7" || event.key === "7" || event.key === "&");
const isQuoteShortcut = (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (event.metaKey || event.ctrlKey) &&
  (event.altKey || event.shiftKey) &&
  (event.code === "Digit8" || event.key === "8" || event.key === "*");

const wrapSelection = (value: string, start: number, end: number, prefix: string, suffix = prefix) => {
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const middle = value.slice(from, to);
  const replacement = `${prefix}${middle || "text"}${suffix}`;
  return {
    nextValue: `${value.slice(0, from)}${replacement}${value.slice(to)}`,
    nextCursorStart: from + prefix.length,
    nextCursorEnd: from + replacement.length - suffix.length,
  };
};

const renderQuoteInlineMarkdown = (raw: string) => {
  const lines = raw.split("\n");

  return lines.map((line, lineIndex) => {
    const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|(@[\w.-]+))/g;
    const nodes: ReactNode[] = [];
    let pointer = 0;
    let match: RegExpExecArray | null;
    let tokenIndex = 0;
    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > pointer) {
        nodes.push(line.slice(pointer, match.index));
      }
      if (match[2] && match[3]) {
        nodes.push(
          <a key={`md-link-${lineIndex}-${tokenIndex}`} href={match[3]} target="_blank" rel="noopener noreferrer" className="underline decoration-current/40 underline-offset-4">
            {match[2]}
          </a>,
        );
      } else if (match[4]) {
        nodes.push(
          <strong key={`md-bold-${lineIndex}-${tokenIndex}`} className="font-semibold">
            {match[4]}
          </strong>,
        );
      } else if (match[5]) {
        nodes.push(
          <em key={`md-italic-${lineIndex}-${tokenIndex}`} className="italic">
            {match[5]}
          </em>,
        );
      } else if (match[6]) {
        nodes.push(
          <code key={`md-code-${lineIndex}-${tokenIndex}`} className="rounded bg-black/6 px-1 py-[1px] font-mono text-[0.88em]">
            {match[6]}
          </code>,
        );
      } else if (match[7]) {
        nodes.push(
          <span key={`md-mention-${lineIndex}-${tokenIndex}`} className="rounded bg-[var(--color-accent-soft)] px-1 text-[var(--color-text)]">
            {match[7]}
          </span>,
        );
      }
      pointer = match.index + match[0].length;
      tokenIndex += 1;
    }
    if (pointer < line.length) {
      nodes.push(line.slice(pointer));
    }
    if (nodes.length === 0) {
      nodes.push(" ");
    }
    return (
      <Fragment key={`line-${lineIndex}`}>
        {nodes}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </Fragment>
    );
  });
};

const toLetters = (value: number) => {
  let remaining = Math.max(1, Math.floor(value));
  let result = "";
  while (remaining > 0) {
    const current = (remaining - 1) % 26;
    result = String.fromCharCode(97 + current) + result;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return result;
};

const toRoman = (value: number) => {
  const input = Math.max(1, Math.min(3999, Math.floor(value)));
  const table: Array<{ n: number; s: string }> = [
    { n: 1000, s: "m" },
    { n: 900, s: "cm" },
    { n: 500, s: "d" },
    { n: 400, s: "cd" },
    { n: 100, s: "c" },
    { n: 90, s: "xc" },
    { n: 50, s: "l" },
    { n: 40, s: "xl" },
    { n: 10, s: "x" },
    { n: 9, s: "ix" },
    { n: 5, s: "v" },
    { n: 4, s: "iv" },
    { n: 1, s: "i" },
  ];
  let remaining = input;
  let result = "";
  for (const row of table) {
    while (remaining >= row.n) {
      result += row.s;
      remaining -= row.n;
    }
  }
  return result;
};

const formatNumberedIndex = (index: number, format: PageNumberedFormat) => {
  if (format === "letters") return `${toLetters(index)}.`;
  if (format === "roman") return `${toRoman(index)}.`;
  return `${index}.`;
};

const parseNumberedMarker = (token: string): { format: PageNumberedFormat; start?: number } | null => {
  const trimmed = token.trim().toLowerCase();
  if (!trimmed.endsWith(".")) return null;
  const raw = trimmed.slice(0, -1);
  if (!raw.length) return null;
  if (/^\d+$/.test(raw)) {
    return {
      format: "numbers",
      start: Math.max(1, Number.parseInt(raw, 10) || 1),
    };
  }
  if (raw === "a") return { format: "letters", start: 1 };
  if (raw === "i") return { format: "roman", start: 1 };
  return null;
};

const parseRichText = (raw: string) => {
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|(@[\w.-]+))/g;
  const spans: NonNullable<PageBlock["richText"]> = [];
  let pointer = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(raw)) !== null) {
    if (match.index > pointer) {
      spans.push({ text: raw.slice(pointer, match.index) });
    }
    if (match[2] && match[3]) {
      spans.push({ text: match[2], marks: ["link"], href: match[3] });
    } else if (match[4]) {
      spans.push({ text: match[4], marks: ["bold"] });
    } else if (match[5]) {
      spans.push({ text: match[5], marks: ["italic"] });
    } else if (match[6]) {
      spans.push({ text: match[6], marks: ["code"] });
    } else if (match[7]) {
      spans.push({ text: match[7], marks: ["mention"], mention: match[7].slice(1) });
    }
    pointer = match.index + match[0].length;
  }
  if (pointer < raw.length) {
    spans.push({ text: raw.slice(pointer) });
  }
  return spans.length ? spans : [{ text: raw || " " }];
};

const renderRichText = (spans?: PageBlock["richText"]) =>
  (spans ?? []).map((span, index) => {
    const marks = new Set(span.marks ?? []);
    const className = cn(
      marks.has("bold") ? "font-semibold" : "",
      marks.has("italic") ? "italic" : "",
      marks.has("code") ? "rounded bg-black/6 px-1 py-[1px] font-mono text-[0.88em]" : "",
      marks.has("mention") ? "rounded bg-[var(--color-accent-soft)] px-1 text-[var(--color-text)]" : "",
      marks.has("link") ? "underline decoration-current/40 underline-offset-4" : "",
    );
    if (marks.has("link") && span.href) {
      return (
        <a key={`rich-${index}`} href={span.href} target="_blank" rel="noopener noreferrer" className={className}>
          {span.text}
        </a>
      );
    }
    return (
      <span key={`rich-${index}`} className={className}>
        {span.text}
      </span>
    );
  });

const descendantIds = (list: PageBlock[], parentId: string) => {
  const start = list.findIndex((block) => block.id === parentId);
  if (start < 0) return [] as string[];
  const parent = list[start]!;
  const parentIndent = parent.indent ?? 0;
  const collected: string[] = [];
  for (let i = start + 1; i < list.length; i += 1) {
    const candidate = list[i]!;
    const indent = candidate.indent ?? 0;
    if (indent <= parentIndent) break;
    collected.push(candidate.id);
  }
  return collected;
};

const withListHierarchy = (list: PageBlock[]) => {
  const stack: Array<{ id: string; indent: number }> = [];
  let changed = false;
  const next = list.map((block) => {
    const indent = block.indent ?? 0;
    while (stack.length > 0 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }
    const parentId = stack.length ? stack[stack.length - 1]!.id : undefined;
    stack.push({ id: block.id, indent });
    const normalizedParentId = indent > 0 ? parentId : undefined;
    if (block.parentId !== normalizedParentId) {
      changed = true;
      return { ...block, parentId: normalizedParentId };
    }
    return block;
  });
  return changed ? next : list;
};

const numberedLabelFor = (list: PageBlock[], blockId: string) => {
  const index = list.findIndex((block) => block.id === blockId);
  if (index < 0) return "1.";
  const current = list[index]!;
  if (current.type !== "numbered") return "1.";
  const currentIndent = current.indent ?? 0;
  let position = 1;
  let sequenceStart = current;
  for (let i = index - 1; i >= 0; i -= 1) {
    const candidate = list[i]!;
    const indent = candidate.indent ?? 0;
    if (indent < currentIndent) break;
    if (indent > currentIndent) continue;
    if (candidate.type !== "numbered") break;
    sequenceStart = candidate;
    position += 1;
  }
  const startAt = sequenceStart.numberedStart ?? 1;
  const format = current.numberedFormat ?? sequenceStart.numberedFormat ?? DEFAULT_NUMBERED_FORMAT;
  return formatNumberedIndex(startAt + position - 1, format);
};

const isTextInputTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  if (element.closest('[data-page-drag-handle="true"]')) return false;
  const tag = element.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "button" || tag === "a") return true;
  return Boolean(element.closest("input,textarea,button,a"));
};

const formatFileSize = (bytes: number) => {
  if (bytes <= 0) return "External";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const inferMimeFromUrl = (url: string) => {
  const normalized = url.toLowerCase().split(/[?#]/)[0] ?? "";
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(normalized)) return "image/*";
  if (/\.(mp4|webm|mov|m4v|mkv|avi)$/.test(normalized)) return "video/*";
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(normalized)) return "audio/*";
  if (/\.pdf$/.test(normalized)) return "application/pdf";
  return "application/octet-stream";
};

const inferDisplayNameFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.split("/").filter(Boolean);
    const tail = pathname[pathname.length - 1];
    if (tail) return decodeURIComponent(tail);
    return parsed.hostname;
  } catch {
    return "Embedded file";
  }
};

const inferBookmarkDataFromUrl = (url: string): PageBookmarkData => {
  if (!url.trim()) {
    return {
      url: "",
      title: "",
      hostname: "",
      description: "",
      imageUrl: undefined,
    };
  }
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.split("/").filter(Boolean);
    const tail = pathname[pathname.length - 1];
    const decodedTail = tail ? decodeURIComponent(tail).replace(/[-_]+/g, " ") : "";
    const title = decodedTail.length > 0 ? decodedTail : parsed.hostname.replace(/^www\./, "");
    return {
      url: parsed.toString(),
      title,
      hostname: parsed.hostname.replace(/^www\./, ""),
      imageUrl: undefined,
    };
  } catch {
    return {
      url,
      title: url,
      imageUrl: undefined,
    };
  }
};

const inferEmbedDataFromUrl = (rawUrl: string): PageEmbedData => {
  const value = rawUrl.trim();
  if (!value) {
    return { url: "", embedUrl: "", provider: "", title: "" };
  }
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const title = parsed.hostname.replace(/^www\./, "");

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const videoId = host.includes("youtu.be")
        ? parsed.pathname.split("/").filter(Boolean)[0]
        : parsed.searchParams.get("v") ?? parsed.pathname.split("/").filter(Boolean).at(-1);
      if (videoId) {
        return {
          url: parsed.toString(),
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          provider: "YouTube",
          title,
        };
      }
    }

    if (host.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean).at(-1);
      if (videoId && /^\d+$/.test(videoId)) {
        return {
          url: parsed.toString(),
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          provider: "Vimeo",
          title,
        };
      }
    }

    if (host.includes("figma.com")) {
      return {
        url: parsed.toString(),
        embedUrl: `https://www.figma.com/embed?embed_host=idea-wall&url=${encodeURIComponent(parsed.toString())}`,
        provider: "Figma",
        title,
      };
    }

    if (host.includes("docs.google.com")) {
      return {
        url: parsed.toString(),
        embedUrl: parsed.toString(),
        provider: "Google Docs",
        title,
      };
    }

    return {
      url: parsed.toString(),
      embedUrl: parsed.toString(),
      provider: parsed.hostname.replace(/^www\./, ""),
      title,
    };
  } catch {
    return { url: value, embedUrl: "", provider: "", title: value };
  }
};

const acceptForIntent = (intent: FileInsertIntent) => {
  if (intent === "image") return "image/*";
  if (intent === "video") return "video/*";
  if (intent === "audio") return "audio/*";
  if (intent === "bookmark") return "";
  return "";
};

const blockTypeForIntent = (intent: FileInsertIntent): BlockType => {
  if (intent === "bookmark") return "bookmark";
  return intent;
};
const insertedHeightForIntent = (intent: FileInsertIntent) => (intent === "image" ? 280 : intent === "video" ? 220 : intent === "audio" ? 88 : intent === "bookmark" ? 178 : 52);

const relativeTimeLabel = (createdAt: number) => {
  const diff = Math.max(0, Date.now() - createdAt);
  if (diff < 45_000) return "Just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const initialForName = (name: string) => (name.trim().charAt(0) || "U").toUpperCase();

const FileDocIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#5f5f5f]">
    <path
      d="M6.2 2.6h4.8L15.4 7v8.1a2 2 0 0 1-2 2H6.2a2 2 0 0 1-2-2V4.6a2 2 0 0 1 2-2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M11 2.8V7h4.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UploadEmbedGhostIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 text-[#8d8d8d]">
    <rect x="3.5" y="2.8" width="13" height="14.4" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 6.2v6.2M7.8 8.6 10 6.2l2.2 2.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SlashCommandIcon = ({ id }: { id: SlashCommandId }) => {
  if (id === "text") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path d="M5 5h10M10 5v10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "h1" || id === "h2" || id === "h3") {
    const label = id.toUpperCase();
    return <span className="text-[13px] font-medium leading-none text-[#4f4f4f]">{label[0]}{label[1]}</span>;
  }
  if (id === "bulleted") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <circle cx="4.2" cy="5.8" r="1.2" fill="currentColor" />
        <circle cx="4.2" cy="10" r="1.2" fill="currentColor" />
        <circle cx="4.2" cy="14.2" r="1.2" fill="currentColor" />
        <path d="M7 5.8h8M7 10h8M7 14.2h8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "numbered") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path d="M3.4 6h2M3.4 10h2M3.4 14h2M7.2 6h8M7.2 10h8M7.2 14h8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "todo") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <rect x="2.8" y="3.2" width="4.4" height="4.4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2.8" y="8" width="4.4" height="4.4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="m3.8 10.2 1.1 1.1 1.8-2.1M8.8 5.4h8M8.8 10.2h8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "toggle") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path d="m3.4 5.8 2.2 2.1-2.2 2.1M7.6 5.8h8M7.6 10h8M3.4 14.2h12.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "table") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <rect x="2.9" y="4.1" width="14.2" height="11.8" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.9 8h14.2M2.9 11.9h14.2M7.6 4.1v11.8M12.4 4.1v11.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (id === "quote") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path
          d="M5.2 6.2c-1 0-1.8.8-1.8 1.8v1.8c0 1 .8 1.8 1.8 1.8H7l-1.2 2.2M12.2 6.2c-1 0-1.8.8-1.8 1.8v1.8c0 1 .8 1.8 1.8 1.8H14l-1.2 2.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === "divider") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path d="M3.2 10h13.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "callout") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path d="M10 3.8a4.4 4.4 0 0 1 2.9 7.7v2.7h-5.8v-2.7A4.4 4.4 0 0 1 10 3.8Zm-2 11.6h4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "page") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path d="M5.2 3.5h7.6l2 2v11H5.2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "image") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <rect x="2.8" y="4" width="14.4" height="11.6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7.2" cy="8" r="1.3" fill="currentColor" />
        <path d="m4.8 13.5 3.2-3 2.2 2 2.7-2.5 2.2 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "video") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <rect x="2.8" y="4" width="14.4" height="11.6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="m8 7.4 4.6 2.4L8 12.2Z" fill="currentColor" />
      </svg>
    );
  }
  if (id === "audio") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path d="M3.8 11.7h2.6l3.3 3V5.3l-3.3 3H3.8Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M13 7.3a4 4 0 0 1 0 5.4M15.2 5.4a6.7 6.7 0 0 1 0 9.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "code") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path d="m7.3 6.5-3 3.5 3 3.5M12.7 6.5l3 3.5-3 3.5M10.8 5.5 9.2 14.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "file") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path d="M7.6 6.2v7.2a2.7 2.7 0 0 0 5.4 0V5.8a2 2 0 1 0-4 0v7.5a1.2 1.2 0 0 0 2.4 0V7.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "bookmark") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <path d="M6 3.5h8a1 1 0 0 1 1 1v11l-5-2.8-5 2.8v-11a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "embed") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[15px] w-[15px] text-[#4f4f4f]">
        <rect x="3" y="4" width="14" height="12" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="m8 8 4 2-4 2Z" fill="currentColor" />
      </svg>
    );
  }
  return <span className="text-[14px] text-[#4f4f4f]">{/* fallback */}•</span>;
};

export function PageEditor() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const docId = searchParams.get("doc") || defaultPageDocId;
  const [blocks, setBlocks] = useState<PageBlock[]>(() => createEmptyPage());
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [quickInsertMenu, setQuickInsertMenu] = useState<QuickInsertMenuState>({ open: false, x: 0, y: 0 });
  const [menuIndex, setMenuIndex] = useState(0);
  const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState>({ open: false, x: 0, y: 0, worldX: 0, worldY: 0 });
  const [fileMenu, setFileMenu] = useState<FileMenuState>({ open: false, x: 0, y: 0 });
  const [blockMenu, setBlockMenu] = useState<BlockMenuState>({ open: false, x: 0, y: 0, moveToQuery: "", searchQuery: "" });
  const [codeMenu, setCodeMenu] = useState<CodeMenuState>({ open: false, x: 0, y: 0 });
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const [snapAnimateBlockIds, setSnapAnimateBlockIds] = useState<string[]>([]);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editingTextBlockId, setEditingTextBlockId] = useState<string | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [availableDocIds, setAvailableDocIds] = useState<string[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [commentAuthorName, setCommentAuthorName] = useState("Bisvo");
  const [uploadIntent, setUploadIntent] = useState<FileInsertIntent>("file");
  const [fileInsert, setFileInsert] = useState<FileInsertState>({
    open: false,
    intent: "file",
    mode: "upload",
    worldX: 120,
    worldY: 120,
    x: 48,
    y: 48,
    url: "",
  });
  const [commentPanel, setCommentPanel] = useState<CommentPanelState>({
    open: false,
    x: 44,
    y: 44,
    draft: "",
    attachments: [],
    mentions: [],
    editingCommentId: undefined,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const commentFileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRefs = useRef<Record<string, HTMLElement | null>>({});
  const measuredHeightsRef = useRef<Record<string, number>>({});
  const selectionRangesRef = useRef<Record<string, { start: number; end: number }>>({});
  const pendingFocusIdRef = useRef<string | null>(null);
  const uploadAnchorRef = useRef({ x: 120, y: 120 });
  const uploadAfterBlockRef = useRef<string | undefined>(undefined);
  const bookmarkPreviewRequestedRef = useRef<Set<string>>(new Set());
  const snapAnimateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ blockId: string; offsetX: number; offsetY: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; cameraX: number; cameraY: number; moved: boolean } | null>(null);
  const handlePointerRef = useRef<{ startX: number; startY: number; moved: boolean; blockIds: string[]; blockId: string } | null>(null);
  const hasLoadedRef = useRef(false);
  const saverRef = useRef(createPageSnapshotSaver(260, docId));

  const saveDocSnapshot = useCallback(
    async (snapshot: Parameters<typeof savePageSnapshot>[0], targetDocId: string) => {
      await savePageSnapshot(snapshot, targetDocId);
      try {
        await saveCloudPageSnapshot(targetDocId, snapshot);
      } catch {
        // Local persistence already succeeded.
      }
    },
    [],
  );

  const loadDocSnapshot = useCallback(
    async (targetDocId: string) => {
      try {
        const cloudSnapshot = await loadCloudPageSnapshot(targetDocId);
        if (cloudSnapshot) {
          await savePageSnapshot(cloudSnapshot, targetDocId);
        }
      } catch {
        // Fall back to local snapshot below.
      }
      return loadPageSnapshot(targetDocId);
    },
    [],
  );

  const refreshAvailableDocIds = useCallback(async () => {
    const localIds = await listPageDocIds();
    let cloudIds: string[] = [];
    try {
      cloudIds = await listCloudPageDocIds();
    } catch {
      cloudIds = [];
    }

    const combined = Array.from(new Set([...cloudIds, ...localIds]));
    setAvailableDocIds(combined.length ? combined : [defaultPageDocId]);
  }, []);

  const filteredMenu = useMemo(() => {
    const query = menu?.query.trim().toLowerCase() ?? "";
    if (!query) return slashCommands;
    return slashCommands.filter((item) =>
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.aliases.some((alias) => alias.toLowerCase().includes(query)),
    );
  }, [menu?.query]);

  const activeMenuIndex = filteredMenu.length > 0 ? Math.min(menuIndex, filteredMenu.length - 1) : 0;

  const queueFocus = useCallback((blockId: string) => {
    pendingFocusIdRef.current = blockId;
    requestAnimationFrame(() => {
      const pendingId = pendingFocusIdRef.current;
      if (!pendingId) return;
      const element = inputRefs.current[pendingId];
      if (element && typeof (element as HTMLInputElement | HTMLTextAreaElement).focus === "function") {
        (element as HTMLInputElement | HTMLTextAreaElement).focus();
        pendingFocusIdRef.current = null;
      }
    });
  }, []);

  const setBlockHeight = useCallback((blockId: string, height: number) => {
    setBlocks((previous) => {
      const index = previous.findIndex((block) => block.id === blockId);
      if (index < 0) {
        return previous;
      }
      const current = previous[index]!;
      if (Math.abs(current.h - height) <= 1) {
        return previous;
      }
      const delta = height - current.h;
      const next = [...previous];
      next[index] = { ...current, h: height };
      if (Math.abs(delta) > 1) {
        for (let i = 0; i < next.length; i += 1) {
          if (i === index) continue;
          const candidate = next[i]!;
          // Keep independent side columns stable; only shift nearby same-column blocks.
          if (candidate.y > current.y && Math.abs(candidate.x - current.x) <= DOC_WIDTH * 0.55) {
            next[i] = { ...candidate, y: candidate.y + delta };
          }
        }
      }
      return next;
    });
  }, []);

  const autoSizeTextarea = useCallback(
    (blockId: string, element: HTMLTextAreaElement, minHeight = LINE_HEIGHT) => {
      element.style.height = "0px";
      const next = Math.max(minHeight, element.scrollHeight);
      element.style.height = `${next}px`;
      const measured = measuredHeightsRef.current[blockId];
      if (typeof measured === "number" && Math.abs(measured - next) <= 1) {
        return;
      }
      measuredHeightsRef.current[blockId] = next;
      setBlockHeight(blockId, next);
    },
    [setBlockHeight],
  );

  const remeasureAllTextareas = useCallback(() => {
    for (const block of blocks) {
      const element = inputRefs.current[block.id];
      if (!(element instanceof HTMLTextAreaElement)) continue;
      const minHeight = block.type === "code" ? 92 : LINE_HEIGHT;
      autoSizeTextarea(block.id, element, minHeight);
    }
  }, [autoSizeTextarea, blocks]);

  const worldFromScreen = useCallback(
    (screenX: number, screenY: number) => ({ x: (screenX - camera.x) / camera.zoom, y: (screenY - camera.y) / camera.zoom }),
    [camera.x, camera.y, camera.zoom],
  );

  const toScreenPoint = useCallback(
    (worldX: number, worldY: number) => ({ x: worldX * camera.zoom + camera.x, y: worldY * camera.zoom + camera.y }),
    [camera.x, camera.y, camera.zoom],
  );

  const worldFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      return worldFromScreen(rect ? clientX - rect.left : clientX, rect ? clientY - rect.top : clientY);
    },
    [worldFromScreen],
  );

  const addTextBlockAt = useCallback(
    (worldX: number, worldY: number) => {
      const created = newBlock("text", worldX, worldY);
      setBlocks((previous) => [...previous, created]);
      queueFocus(created.id);
      return created.id;
    },
    [queueFocus],
  );

  const signFileUrl = useCallback(async (path: string) => {
    const response = await fetch("/api/page/files/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    const payload = (await response.json().catch(() => ({}))) as { signedUrl?: string; error?: string };
    if (!response.ok || !payload.signedUrl) throw new Error(payload.error ?? "Unable to sign file URL.");
    setSignedUrls((previous) => ({ ...previous, [path]: payload.signedUrl! }));
    return payload.signedUrl;
  }, []);

  const uploadFilesAt = useCallback(
    async (files: File[], worldX: number, worldY: number, intent: FileInsertIntent = "file", afterBlockId?: string) => {
      if (files.length === 0) return;
      setUploading(true);
      try {
        const formData = new FormData();
        for (const file of files) formData.append("files", file);
        const response = await fetch("/api/page/files", { method: "POST", body: formData });
        const payload = (await response.json().catch(() => ({}))) as {
          files?: Array<{ path: string; name: string; size: number; mimeType: string }>;
          error?: string;
        };
        if (!response.ok || !payload.files) throw new Error(payload.error ?? "Upload failed.");

        const createdBlocks: PageBlock[] = payload.files.map((file, index) => ({
          id: idFor(),
          type: blockTypeForIntent(intent),
          content: "",
          x: worldX,
          y: worldY + index * 72,
          w: DOC_WIDTH,
          h: blockTypeForIntent(intent) === "image" ? 280 : blockTypeForIntent(intent) === "video" ? 220 : blockTypeForIntent(intent) === "audio" ? 88 : isImageMime(file.mimeType) ? 280 : 44,
          file: {
            path: file.path,
            name: file.name,
            displayName: file.name,
            size: file.size,
            mimeType: file.mimeType || "application/octet-stream",
            source: "upload",
          },
        }));
        setBlocks((previous) => {
          const appended = [...previous, ...createdBlocks];
          if (!afterBlockId) return appended;
          const finalBlock = createdBlocks[createdBlocks.length - 1];
          if (!finalBlock) return appended;
          const nextAfterY = finalBlock.y + Math.max(finalBlock.h + blockGapFor(finalBlock.type), LINE_HEIGHT + blockGapFor(finalBlock.type));
          return appended.map((item) => (item.id === afterBlockId ? { ...item, y: nextAfterY } : item));
        });

        for (const file of payload.files) {
          if (isImageMime(file.mimeType) || intent === "video" || intent === "audio") void signFileUrl(file.path);
        }
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [signFileUrl],
  );

  const triggerUploadPickerAt = useCallback((worldX: number, worldY: number, intent: FileInsertIntent = "file", afterBlockId?: string) => {
    uploadAnchorRef.current = { x: worldX, y: worldY };
    uploadAfterBlockRef.current = afterBlockId;
    setUploadIntent(intent);
    fileInputRef.current?.click();
  }, []);

  const openFileInsertAt = useCallback((worldX: number, worldY: number, screenX: number, screenY: number, intent: FileInsertIntent, afterBlockId?: string) => {
    const panelWidth = 360;
    const panelHeight = 180;
    setFileInsert({
      open: true,
      intent,
      mode: intent === "bookmark" ? "link" : "upload",
      worldX,
      worldY,
      x: clamp(screenX, 12, Math.max(12, viewport.w - panelWidth - 12)),
      y: clamp(screenY, 12, Math.max(12, viewport.h - panelHeight - 12)),
      url: "",
      afterBlockId,
    });
  }, [viewport.h, viewport.w]);

  const createEmbedBlock = useCallback(
    (url: string, worldX: number, worldY: number, intent: FileInsertIntent, afterBlockId?: string) => {
      const blockType = blockTypeForIntent(intent);
      if (blockType === "bookmark") {
        const bookmark = inferBookmarkDataFromUrl(url);
        const createdBookmark: PageBlock = {
          id: idFor(),
          type: "bookmark",
          content: "",
          x: worldX,
          y: worldY,
          w: DOC_WIDTH,
          h: 122,
          bookmark,
        };
        setBlocks((previous) => {
          const appended = [...previous, createdBookmark];
          if (!afterBlockId) return appended;
          const nextAfterY = createdBookmark.y + Math.max(createdBookmark.h + blockGapFor(createdBookmark.type), LINE_HEIGHT + blockGapFor(createdBookmark.type));
          return appended.map((item) => (item.id === afterBlockId ? { ...item, y: nextAfterY } : item));
        });
        return;
      }
      const mimeType = inferMimeFromUrl(url);
      const created: PageBlock = {
        id: idFor(),
        type: blockType,
        content: "",
        x: worldX,
        y: worldY,
        w: DOC_WIDTH,
        h: blockType === "image" ? 280 : blockType === "video" ? 220 : blockType === "audio" ? 88 : 52,
        file: {
          name: inferDisplayNameFromUrl(url),
          displayName: inferDisplayNameFromUrl(url),
          size: 0,
          mimeType,
          source: "embed",
          externalUrl: url,
        },
      };
      setBlocks((previous) => {
        const appended = [...previous, created];
        if (!afterBlockId) return appended;
        const nextAfterY = created.y + Math.max(created.h + blockGapFor(created.type), LINE_HEIGHT + blockGapFor(created.type));
        return appended.map((item) => (item.id === afterBlockId ? { ...item, y: nextAfterY } : item));
      });
    },
    [],
  );

  const requestBookmarkPreview = useCallback(async (blockId: string, url: string) => {
    try {
      const response = await fetch(`/api/page/bookmark-preview?url=${encodeURIComponent(url)}`);
      const payload = (await response.json().catch(() => ({}))) as {
        title?: string;
        description?: string;
        imageUrl?: string;
        hostname?: string;
      };
      if (!response.ok) return;
      setBlocks((previous) =>
        previous.map((block) => {
          if (block.id !== blockId || block.type !== "bookmark" || !block.bookmark) {
            return block;
          }
          if (block.bookmark.url !== url) {
            return block;
          }
          return {
            ...block,
            bookmark: {
              ...block.bookmark,
              title: payload.title || block.bookmark.title,
              description: payload.description || block.bookmark.description,
              imageUrl: payload.imageUrl || block.bookmark.imageUrl,
              hostname: payload.hostname || block.bookmark.hostname,
            },
          };
        }),
      );
    } catch {
      // Keep fallback bookmark card if preview fetch fails.
    }
  }, []);

  const submitBookmarkUrl = useCallback(
    (blockId: string, rawUrl: string) => {
      const nextUrl = rawUrl.trim();
      if (!nextUrl) {
        window.alert("Please paste a valid URL.");
        return;
      }
      try {
        const parsed = new URL(nextUrl);
        if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
          throw new Error("Unsupported protocol");
        }
        const bookmark = inferBookmarkDataFromUrl(parsed.toString());
        const cacheKey = `${blockId}:${bookmark.url}`;
        bookmarkPreviewRequestedRef.current.add(cacheKey);
        setBlocks((previous) =>
          previous.map((block) =>
            block.id === blockId && block.type === "bookmark"
              ? {
                  ...block,
                  bookmark,
                  h: 122,
                }
              : block,
          ),
        );
        void requestBookmarkPreview(blockId, bookmark.url);
      } catch {
        window.alert("Please paste a valid URL.");
      }
    },
    [requestBookmarkPreview],
  );

  const submitEmbedUrl = useCallback((blockId: string, rawUrl: string) => {
    const nextUrl = rawUrl.trim();
    if (!nextUrl) {
      window.alert("Please paste a valid URL.");
      return;
    }
    try {
      const parsed = new URL(nextUrl);
      if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
        throw new Error("Unsupported protocol");
      }
      const embed = inferEmbedDataFromUrl(parsed.toString());
      if (!embed.embedUrl) {
        window.alert("Unable to embed this URL.");
        return;
      }
      setBlocks((previous) =>
        previous.map((block) =>
          block.id === blockId && block.type === "embed"
            ? {
                ...block,
                content: "",
                embed,
                h: 332,
              }
            : block,
        ),
      );
    } catch {
      window.alert("Please paste a valid URL.");
    }
  }, []);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setViewport({
        w: Math.max(1, Math.round(entry.contentRect.width)),
        h: Math.max(1, Math.round(entry.contentRect.height)),
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    saverRef.current = createPageSnapshotSaver(260, docId, saveDocSnapshot);
  }, [docId, saveDocSnapshot]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const metadata = data.user?.user_metadata as Record<string, unknown> | undefined;
      const preferred =
        (typeof metadata?.preferred_name === "string" && metadata.preferred_name.trim()) ||
        (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
        (typeof data.user?.email === "string" && data.user.email.split("@")[0]) ||
        "Bisvo";
      setCommentAuthorName(preferred);
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const saver = saverRef.current;
    hasLoadedRef.current = false;
    void (async () => {
      try {
        const snapshot = await loadDocSnapshot(docId);
        if (cancelled) return;
        hasLoadedRef.current = true;
        const initialBlocks =
          snapshot?.blocks?.length && !isPlaceholderPage(snapshot.blocks) ? snapshot.blocks : createEmptyPage();
        const withCurriculum = appendPotteryTemplateOnCanvas(withListHierarchy(initialBlocks));
        const migrated = migrateOverlappingPotteryTemplate(migrateCompactPotteryTemplate(migrateLegacyPotteryTemplate(withCurriculum)));
        setBlocks(migrated);
        if (snapshot?.camera) setCamera(snapshot.camera);
        else setCamera({ x: 0, y: 0, zoom: 1 });
      } catch {
        hasLoadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
      void saver.flush();
    };
  }, [docId, loadDocSnapshot]);

  useEffect(() => {
    setBlocks((previous) => {
      const next = withListHierarchy(previous);
      return next === previous ? previous : next;
    });
    // Run once on mount; avoid state feedback loops tied directly to `blocks`.
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      remeasureAllTextareas();
    });
    return () => cancelAnimationFrame(frame);
  }, [remeasureAllTextareas]);

  useEffect(() => {
    let cancelled = false;
    if (typeof document !== "undefined" && "fonts" in document) {
      void (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => {
        if (cancelled) return;
        remeasureAllTextareas();
      });
    }
    return () => {
      cancelled = true;
    };
  }, [docId, remeasureAllTextareas]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saverRef.current.schedule({ blocks, camera, updatedAt: Date.now() });
  }, [blocks, camera]);

  useEffect(() => {
    const mediaBlocks = blocks.filter(
      (block) =>
        (block.type === "image" || block.type === "video" || block.type === "audio" || (block.type === "file" && isImageMime(block.file?.mimeType))) &&
        block.file?.path,
    );
    for (const block of mediaBlocks) {
      const path = block.file!.path!;
      if (!signedUrls[path]) void signFileUrl(path);
    }
  }, [blocks, signFileUrl, signedUrls]);

  useEffect(() => {
    const bookmarkBlocks = blocks.filter((block) => block.type === "bookmark" && block.bookmark?.url);
    for (const block of bookmarkBlocks) {
      const url = block.bookmark!.url.trim();
      if (!url || url === "https://") continue;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        continue;
      }
      if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) continue;
      const cacheKey = `${block.id}:${parsed.toString()}`;
      if (bookmarkPreviewRequestedRef.current.has(cacheKey)) continue;
      bookmarkPreviewRequestedRef.current.add(cacheKey);
      void requestBookmarkPreview(block.id, parsed.toString());
    }
  }, [blocks, requestBookmarkPreview]);

  useEffect(() => {
    void refreshAvailableDocIds();
  }, [blocks, docId, refreshAvailableDocIds]);

  useEffect(() => {
    const closeMenus = () => {
      setCanvasMenu((previous) => ({ ...previous, open: false }));
      setFileMenu((previous) => ({ ...previous, open: false }));
      setQuickInsertMenu((previous) => ({ ...previous, open: false }));
      setBlockMenu((previous) => ({ ...previous, open: false, moveToQuery: "", searchQuery: "" }));
      setFileInsert((previous) => ({ ...previous, open: false }));
      setCommentPanel((previous) => ({ ...previous, open: false, menuCommentId: undefined, deleteConfirmCommentId: undefined, editingCommentId: undefined }));
    };
    window.addEventListener("pointerdown", closeMenus);
    return () => window.removeEventListener("pointerdown", closeMenus);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(null);
        return;
      }
      if (!filteredMenu.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMenuIndex((previous) => (previous + 1) % filteredMenu.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMenuIndex((previous) => (previous - 1 + filteredMenu.length) % filteredMenu.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredMenu, menu]);

  useEffect(() => {
    if (!fileInsert.open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setFileInsert((previous) => ({ ...previous, open: false }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fileInsert.open]);

  useEffect(() => {
    if (!commentPanel.open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setCommentPanel((previous) => ({ ...previous, open: false, menuCommentId: undefined, deleteConfirmCommentId: undefined, editingCommentId: undefined }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commentPanel.open]);

  useEffect(() => {
    if (!codeMenu.open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-code-menu]") || target.closest("[data-code-menu-trigger]")) {
        return;
      }
      setCodeMenu((previous) => ({ ...previous, open: false }));
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [codeMenu.open]);

  useEffect(
    () => () => {
      if (snapAnimateTimerRef.current) {
        clearTimeout(snapAnimateTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!codeMenu.open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCodeMenu((previous) => ({ ...previous, open: false }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [codeMenu.open]);

  const updateBlock = useCallback((blockId: string, patch: Partial<PageBlock>) => {
    setBlocks((previous) => previous.map((block) => (block.id === blockId ? { ...block, ...patch } : block)));
  }, []);

  const deleteBlocks = useCallback((targetIds: string[]) => {
    if (targetIds.length === 0) return;
    setBlocks((previous) => {
      const expanded = new Set(targetIds);
      for (const id of targetIds) {
        for (const childId of descendantIds(previous, id)) {
          expanded.add(childId);
        }
      }
      setSelectedBlockIds((existing) => existing.filter((id) => !expanded.has(id)));
      return previous.filter((block) => !expanded.has(block.id));
    });
  }, []);

  const duplicateBlock = useCallback(
    (blockId: string) => {
      setBlocks((previous) => {
        const index = previous.findIndex((block) => block.id === blockId);
        if (index < 0) return previous;
        const source = previous[index]!;
        const duplicate: PageBlock = {
          ...source,
          id: idFor(),
          y: source.y + Math.max(source.h + blockGapFor(source.type), LINE_HEIGHT + blockGapFor(source.type)),
          comments: source.comments?.map((comment) => ({ ...comment, id: idFor(), createdAt: Date.now() })),
        };
        return [...previous.slice(0, index + 1), duplicate, ...previous.slice(index + 1)];
      });
    },
    [],
  );

  const turnBlockInto = useCallback((blockId: string, nextType: BlockType) => {
    setBlocks((previous) =>
      previous.map((block) => {
        if (block.id !== blockId || block.type === "file") return block;
        const nextContent = nextType === "divider" || nextType === "table" || nextType === "bookmark" || nextType === "embed" ? "" : block.content;
        const nextTable = nextType === "table" ? ensureTableData(block.table) : undefined;
        const nextCode = nextType === "code" ? { ...createDefaultCodeData(), ...(block.code ?? {}) } : undefined;
        const nextBookmark = nextType === "bookmark" ? inferBookmarkDataFromUrl(block.content.trim()) : undefined;
        const nextEmbed = nextType === "embed" ? inferEmbedDataFromUrl(block.content.trim()) : undefined;
        return {
          ...block,
          type: nextType,
          content: nextContent,
          h:
            nextType === "table"
              ? tableHeightFor(nextTable?.rows ?? DEFAULT_TABLE_ROWS)
              : nextType === "bookmark"
                ? (nextBookmark?.url ? 122 : 178)
                : nextType === "embed"
                  ? (nextEmbed?.url ? 332 : 178)
                : block.h,
          checked: nextType === "todo" ? false : undefined,
          expanded: nextType === "toggle" ? block.expanded ?? true : undefined,
          indent: isListBlockType(nextType) ? block.indent : undefined,
          numberedFormat: nextType === "numbered" ? block.numberedFormat ?? DEFAULT_NUMBERED_FORMAT : undefined,
          numberedStart: nextType === "numbered" ? block.numberedStart : undefined,
          table: nextTable,
          code: nextCode,
          bookmark: nextBookmark,
          embed: nextEmbed,
          richText: parseRichText(nextContent),
          textColor: nextType === "quote" ? block.textColor : undefined,
          backgroundColor: nextType === "quote" ? block.backgroundColor : undefined,
        };
      }),
    );
  }, []);

  const copyBlockLink = useCallback(
    async (blockId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (docId === defaultPageDocId) {
        params.delete("doc");
      } else {
        params.set("doc", docId);
      }
      const query = params.toString();
      const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}#${blockId}`;
      await navigator.clipboard.writeText(url);
    },
    [docId, pathname, searchParams],
  );

  const openBlockMenuForBlock = useCallback(
    (blockId: string) => {
      const block = blocks.find((entry) => entry.id === blockId);
      if (!block) return;
      const indentOffset = typeof block.indent === "number" && block.indent > 0 ? block.indent * INDENT_STEP : 0;
      const screen = toScreenPoint(block.x + indentOffset, block.y);
      const menuWidth = 288;
      const menuHeight = 540;
      const blockWidth = Math.max(220, DOC_WIDTH - indentOffset);
      const leftCandidate = screen.x - menuWidth - 20;
      const rightCandidate = screen.x + blockWidth + 20;
      const x = leftCandidate >= 8 ? leftCandidate : rightCandidate;
      const y = screen.y - 4;
      setBlockMenu({
        open: true,
        x: clamp(x, 8, Math.max(8, window.innerWidth - menuWidth - 8)),
        y: clamp(y, 8, Math.max(8, window.innerHeight - menuHeight - 8)),
        blockId,
        moveToQuery: "",
        searchQuery: "",
      });
      setCanvasMenu((previous) => ({ ...previous, open: false }));
      setFileMenu((previous) => ({ ...previous, open: false }));
      setQuickInsertMenu((previous) => ({ ...previous, open: false }));
      setMenu(null);
      setSelectedBlockIds((previous) => (previous.includes(blockId) ? previous : [blockId]));
    },
    [blocks, toScreenPoint],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "/" || event.shiftKey || event.altKey) {
        return;
      }
      if (menu || fileInsert.open || commentPanel.open) {
        return;
      }
      event.preventDefault();
      const targetId = selectedBlockIds[0] ?? editingTextBlockId ?? blocks[0]?.id;
      if (!targetId) return;
      openBlockMenuForBlock(targetId);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [blocks, commentPanel.open, editingTextBlockId, fileInsert.open, menu, openBlockMenuForBlock, selectedBlockIds]);

  const highlightBlockByHash = useCallback(
    (blockId: string) => {
      const target = inputRefs.current[blockId];
      if (target) {
        target.classList.add("ring-2", "ring-[var(--color-accent)]");
        setTimeout(() => {
          target.classList.remove("ring-2", "ring-[var(--color-accent)]");
        }, 1200);
      }
      queueFocus(blockId);
    },
    [queueFocus],
  );

  useEffect(() => {
    const hash = window.location.hash.replace("#", "").trim();
    if (!hash) return;
    const exists = blocks.some((block) => block.id === hash);
    if (!exists) return;
    highlightBlockByHash(hash);
  }, [blocks, highlightBlockByHash]);

  const moveBlocksToDoc = useCallback(
    async (targetDocId: string, blockIds: string[]) => {
      const uniqueTarget = targetDocId.trim() || defaultPageDocId;
      const movingSet = new Set(blockIds);
      if (!movingSet.size) return;

      const movingBlocks = blocks.filter((block) => movingSet.has(block.id));
      if (movingBlocks.length === 0) return;

      const targetSnapshot = (await loadDocSnapshot(uniqueTarget)) ?? {
        blocks: [],
        camera: { x: 0, y: 0, zoom: 1 },
        updatedAt: Date.now(),
      };

      const maxY = targetSnapshot.blocks.reduce((max, block) => Math.max(max, block.y + block.h), 100);
      const pasted = movingBlocks.map((block, index) => ({
        ...block,
        y: maxY + 24 + index * Math.max(block.h + blockGapFor(block.type), LINE_HEIGHT + blockGapFor(block.type)),
      }));

      await saveDocSnapshot(
        {
          ...targetSnapshot,
          blocks: [...targetSnapshot.blocks, ...pasted],
          updatedAt: Date.now(),
        },
        uniqueTarget,
      );

      setBlocks((previous) => previous.filter((block) => !movingSet.has(block.id)));
      setSelectedBlockIds((previous) => previous.filter((id) => !movingSet.has(id)));
      setAvailableDocIds((previous) => (previous.includes(uniqueTarget) ? previous : [uniqueTarget, ...previous]));
    },
    [blocks, loadDocSnapshot, saveDocSnapshot],
  );

  const turnBlockIntoPage = useCallback(
    async (blockId: string) => {
      const block = blocks.find((entry) => entry.id === blockId);
      if (!block) return;
      const pageDocId = `page_${Math.random().toString(36).slice(2, 8)}`;
      const nestedIds = [blockId];
      for (const candidate of blocks) {
        if (candidate.id === blockId) continue;
        if (candidate.y > block.y && Math.abs(candidate.x - block.x) <= 36) {
          nestedIds.push(candidate.id);
        }
      }
      await moveBlocksToDoc(pageDocId, nestedIds);
      const pageBlock: PageBlock = {
        id: idFor(),
        type: "page",
        content: block.content.trim() || "Untitled Page",
        x: block.x,
        y: block.y,
        w: DOC_WIDTH,
        h: LINE_HEIGHT + 8,
        pageId: pageDocId,
      };
      setBlocks((previous) => [...previous, pageBlock]);
      const next = new URLSearchParams(searchParams.toString());
      next.set("doc", pageDocId);
      router.push(`${pathname}?${next.toString()}`);
    },
    [blocks, moveBlocksToDoc, pathname, router, searchParams],
  );

  const openCommentPanel = useCallback(
    (blockId: string, x: number, y: number) => {
      const panelWidth = 360;
      const panelHeight = 320;
      setCanvasMenu((previous) => ({ ...previous, open: false }));
      setFileMenu((previous) => ({ ...previous, open: false }));
      setBlockMenu((previous) => ({ ...previous, open: false, moveToQuery: "", searchQuery: "" }));
      setCommentPanel((previous) => ({
        ...previous,
        open: true,
        blockId,
        x: clamp(x, 10, Math.max(10, viewport.w - panelWidth - 10)),
        y: clamp(y, 10, Math.max(10, viewport.h - panelHeight - 10)),
        menuCommentId: undefined,
        deleteConfirmCommentId: undefined,
        editingCommentId: undefined,
      }));
    },
    [viewport.h, viewport.w],
  );

  const updateCommentInBlock = useCallback((blockId: string, commentId: string, nextText: string) => {
    const trimmed = nextText.trim();
    if (!trimmed) return;
    setBlocks((previous) =>
      previous.map((block) =>
        block.id === blockId
          ? {
              ...block,
              comments: (block.comments ?? []).map((comment) => (comment.id === commentId ? { ...comment, text: trimmed } : comment)),
            }
          : block,
      ),
    );
  }, []);

  const postComment = useCallback(() => {
    const blockId = commentPanel.blockId;
    if (!blockId) return;
    const text = commentPanel.draft.trim();
    if (!text && commentPanel.attachments.length === 0) return;
    if (commentPanel.editingCommentId) {
      updateCommentInBlock(blockId, commentPanel.editingCommentId, text);
      setCommentPanel((previous) => ({
        ...previous,
        draft: "",
        attachments: [],
        mentions: [],
        menuCommentId: undefined,
        deleteConfirmCommentId: undefined,
        editingCommentId: undefined,
      }));
      return;
    }
    const mentions = Array.from(new Set((text.match(/@[\w.-]+/g) ?? []).map((token) => token.slice(1))));
    setBlocks((previous) =>
      previous.map((block) =>
        block.id === blockId
          ? {
              ...block,
              comments: [
                ...(block.comments ?? []),
                {
                  id: idFor(),
                  authorName: commentAuthorName,
                  text,
                  createdAt: Date.now(),
                  attachments: commentPanel.attachments.length ? commentPanel.attachments : undefined,
                  mentions: mentions.length ? mentions : undefined,
                },
              ],
            }
          : block,
      ),
    );
    setCommentPanel((previous) => ({
      ...previous,
      draft: "",
      attachments: [],
      mentions: [],
      menuCommentId: undefined,
      deleteConfirmCommentId: undefined,
      editingCommentId: undefined,
    }));
  }, [commentAuthorName, commentPanel.attachments, commentPanel.blockId, commentPanel.draft, commentPanel.editingCommentId, updateCommentInBlock]);

  const deleteCommentFromBlock = useCallback((blockId: string, commentId: string) => {
    setBlocks((previous) =>
      previous.map((block) =>
        block.id === blockId
          ? {
              ...block,
              comments: (block.comments ?? []).filter((comment) => comment.id !== commentId),
            }
          : block,
      ),
    );
  }, []);

  const rememberSelection = useCallback((blockId: string, element: HTMLInputElement | HTMLTextAreaElement) => {
    selectionRangesRef.current[blockId] = {
      start: element.selectionStart ?? 0,
      end: element.selectionEnd ?? 0,
    };
  }, []);

  const turnSelectionIntoQuote = useCallback(
    (blockId: string) => {
      setBlocks((previous) => {
        const index = previous.findIndex((entry) => entry.id === blockId);
        if (index < 0) {
          return previous;
        }
        const block = previous[index]!;
        if (block.type === "file") {
          return previous;
        }

        const selected = selectionRangesRef.current[blockId];
        const start = selected ? Math.max(0, Math.min(selected.start, block.content.length)) : 0;
        const end = selected ? Math.max(0, Math.min(selected.end, block.content.length)) : block.content.length;
        const hasSelection = end > start;

        if (!hasSelection) {
          const next = [...previous];
          next[index] = {
            ...block,
            type: "quote",
            checked: undefined,
            indent: undefined,
          };
          return next;
        }

        const before = block.content.slice(0, start).trimEnd();
        const quoteBody = block.content.slice(start, end).trim();
        const after = block.content.slice(end).trimStart();
        if (!quoteBody.length) {
          return previous;
        }

        const sequence: PageBlock[] = [];
        let currentY = block.y;
        if (before.length) {
          sequence.push({
            ...block,
            type: "text",
            content: before,
            checked: undefined,
            indent: undefined,
            textColor: undefined,
            backgroundColor: undefined,
          });
          currentY += Math.max(block.h + blockGapFor("text"), LINE_HEIGHT + blockGapFor("text"));
        }

        const quoteBlock: PageBlock = {
          id: idFor(),
          type: "quote",
          content: quoteBody,
          x: block.x,
          y: currentY,
          w: DOC_WIDTH,
          h: 84,
        };
        sequence.push(quoteBlock);
        currentY += Math.max(quoteBlock.h + blockGapFor("quote"), LINE_HEIGHT + blockGapFor("quote"));

        if (after.length) {
          sequence.push({
            id: idFor(),
            type: "text",
            content: after,
            x: block.x,
            y: currentY,
            w: DOC_WIDTH,
            h: Math.max(LINE_HEIGHT, block.h),
          });
        }

        return [...previous.slice(0, index), ...sequence, ...previous.slice(index + 1)];
      });
    },
    [],
  );

  const updateListIndent = useCallback(
    (block: PageBlock, delta: number) => {
      const currentIndent = block.indent ?? 0;
      const nextIndent = clamp(currentIndent + delta, 0, MAX_LIST_INDENT);
      if (nextIndent === currentIndent) {
        return;
      }
      updateBlock(block.id, { indent: nextIndent || undefined });
    },
    [updateBlock],
  );

  const bulkConvertSelectionToTodos = useCallback(
    (block: PageBlock, selectionStart: number | null, selectionEnd: number | null) => {
      if (block.type === "file") {
        return false;
      }

      const rawStart = selectionStart ?? 0;
      const rawEnd = selectionEnd ?? block.content.length;
      const isCollapsed = rawStart === rawEnd;
      const selectedStart = isCollapsed ? 0 : Math.min(rawStart, rawEnd);
      const selectedEnd = isCollapsed ? block.content.length : Math.max(rawStart, rawEnd);
      const lineStart = block.content.lastIndexOf("\n", Math.max(0, selectedStart - 1)) + 1;
      const lineEndIndex = block.content.indexOf("\n", selectedEnd);
      const lineEnd = lineEndIndex === -1 ? block.content.length : lineEndIndex;

      const selectedSlice = block.content.slice(lineStart, lineEnd);
      const todoLines = selectedSlice
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (todoLines.length === 0) {
        return false;
      }

      const beforeContent = block.content.slice(0, lineStart).replace(/\n+$/, "");
      const afterContent = block.content.slice(lineEnd).replace(/^\n+/, "");
      const spacingForTodos = LINE_HEIGHT + blockGapFor("todo");
      const todoDrafts = todoLines.map((line) => ({
        id: idFor(),
        type: "todo" as const,
        content: line,
        checked: false,
        x: block.x,
        w: DOC_WIDTH,
        h: LINE_HEIGHT,
        indent: block.indent,
      }));
      const focusTargetId = beforeContent.length > 0 ? todoDrafts[0]?.id : todoDrafts[0]?.id ?? block.id;

      setBlocks((previous) => {
        const index = previous.findIndex((entry) => entry.id === block.id);
        if (index < 0) {
          return previous;
        }

        const sequence: PageBlock[] = [];
        let currentY = block.y;

        if (beforeContent.length > 0) {
          sequence.push({
            ...block,
            type: "text",
            content: beforeContent,
            checked: undefined,
            indent: undefined,
          });
          currentY += Math.max(block.h + blockGapFor("text"), LINE_HEIGHT + blockGapFor("text"));
        }

        for (const todoDraft of todoDrafts) {
          sequence.push({
            ...todoDraft,
            y: currentY,
          });
          currentY += spacingForTodos;
        }

        if (afterContent.length > 0) {
          sequence.push({
            id: idFor(),
            type: "text",
            content: afterContent,
            x: block.x,
            y: currentY,
            w: DOC_WIDTH,
            h: Math.max(LINE_HEIGHT, block.h),
          });
        }

        if (sequence.length === 0) {
          return previous;
        }

        return [...previous.slice(0, index), ...sequence, ...previous.slice(index + 1)];
      });

      if (focusTargetId) {
        queueFocus(focusTargetId);
      }
      return true;
    },
    [queueFocus],
  );

  const handleTextualChange = useCallback(
    (blockId: string, event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      const cursor = event.target.selectionStart ?? value.length;
      const block = blocks.find((entry) => entry.id === blockId);
      if (block?.type === "code") {
        updateBlock(blockId, { content: value });
        setMenu((previous) => (previous?.blockId === blockId ? null : previous));
        return;
      }
      const quoteShortcut = value.slice(0, cursor).match(/(^|\n)"\s$/);
      if (quoteShortcut) {
        const markerStart = cursor - 2;
        const nextContent = `${value.slice(0, markerStart)}${value.slice(cursor)}`;
        updateBlock(blockId, {
          type: "quote",
          content: nextContent,
          richText: parseRichText(nextContent),
          checked: undefined,
          indent: undefined,
          numberedFormat: undefined,
          numberedStart: undefined,
        });
        setMenu(null);
        return;
      }
      const dividerShortcut = value.slice(0, cursor).match(/(^|\n)\s*---\s$/);
      if (dividerShortcut) {
        const markerStart = cursor - dividerShortcut[0].length;
        const nextContent = `${value.slice(0, markerStart)}${value.slice(cursor)}`;
        updateBlock(blockId, {
          type: "divider",
          content: nextContent,
          richText: parseRichText(nextContent),
          checked: undefined,
          indent: undefined,
          expanded: undefined,
          numberedFormat: undefined,
          numberedStart: undefined,
        });
        setMenu(null);
        return;
      }
      const toggleShortcut = value.slice(0, cursor).match(/(^|\n)\s*>\s$/);
      if (toggleShortcut) {
        const markerStart = cursor - toggleShortcut[0].length;
        const nextContent = `${value.slice(0, markerStart)}${value.slice(cursor)}`;
        updateBlock(blockId, {
          type: "toggle",
          content: nextContent,
          richText: parseRichText(nextContent),
          expanded: true,
          checked: undefined,
          numberedFormat: undefined,
          numberedStart: undefined,
        });
        setMenu(null);
        return;
      }
      const bulletShortcut = value.slice(0, cursor).match(/(^|\n)\s*([-*+])\s$/);
      if (bulletShortcut) {
        const markerStart = cursor - bulletShortcut[0].length;
        const nextContent = `${value.slice(0, markerStart)}${value.slice(cursor)}`;
        updateBlock(blockId, {
          type: "bulleted",
          content: nextContent,
          richText: parseRichText(nextContent),
          checked: undefined,
          numberedFormat: undefined,
          numberedStart: undefined,
        });
        setMenu(null);
        return;
      }
      const numberedShortcut = value.slice(0, cursor).match(/(^|\n)\s*((?:\d+|[aAiI]))\.\s$/);
      if (numberedShortcut) {
        const parsed = parseNumberedMarker(numberedShortcut[2] ? `${numberedShortcut[2]}.` : "");
        if (!parsed) {
          updateBlock(blockId, { content: value, richText: parseRichText(value) });
          return;
        }
        const markerStart = cursor - numberedShortcut[0].length;
        const nextContent = `${value.slice(0, markerStart)}${value.slice(cursor)}`;
        updateBlock(blockId, {
          type: "numbered",
          content: nextContent,
          richText: parseRichText(nextContent),
          checked: undefined,
          numberedFormat: parsed.format,
          numberedStart: parsed.start,
        });
        setMenu(null);
        return;
      }
      updateBlock(blockId, { content: value, richText: parseRichText(value) });
      const slash = parseSlashQuery(value, cursor);
      if (!slash) {
        setMenu((previous) => (previous?.blockId === blockId ? null : previous));
        return;
      }
      const rect = event.target.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      const anchorX = (containerRect ? rect.left - containerRect.left : rect.left) + 12;
      const anchorY = (containerRect ? rect.bottom - containerRect.top : rect.bottom) + 8;
      setMenu({ blockId, query: slash.query, slashRange: { start: slash.start, end: slash.end }, anchorX, anchorY });
      setMenuIndex(0);
    },
    [blocks, updateBlock],
  );

  const applySlashCommand = useCallback(
    (commandId: SlashCommandId) => {
      if (!menu) return;
      const block = blocks.find((item) => item.id === menu.blockId);
      if (!block) {
        setMenu(null);
        return;
      }

      const beforeContent = block.content.slice(0, menu.slashRange.start);
      const afterContent = block.content.slice(menu.slashRange.end);
      const hasBefore = beforeContent.length > 0;
      const hasAfter = afterContent.length > 0;

      if (commandId === "file" || commandId === "image" || commandId === "video" || commandId === "audio") {
        const lineAwareTypes: BlockType[] = ["text", "callout", "code", "quote"];
        const useLineAwarePlacement = lineAwareTypes.includes(block.type);
        const lineOffset = useLineAwarePlacement ? Math.max(0, beforeContent.split("\n").length - 1) * LINE_HEIGHT : 0;
        const insertionY = hasBefore
          ? useLineAwarePlacement
            ? block.y + lineOffset
            : block.y + Math.max(block.h + blockGapFor(block.type), LINE_HEIGHT + blockGapFor(block.type))
          : block.y;
        let afterBlockId: string | undefined;
        const estimatedInsertedHeight = insertedHeightForIntent(commandId);
        setBlocks((previous) => {
          const index = previous.findIndex((entry) => entry.id === block.id);
          if (index < 0) return previous;
          const sequence: PageBlock[] = [];
          if (hasBefore) {
            const beforeBlock: PageBlock = { ...block, content: beforeContent };
            sequence.push(beforeBlock);
          }
          if (hasAfter) {
            const afterBlock = newBlock("text", block.x, insertionY + Math.max(estimatedInsertedHeight + blockGapFor(commandId), LINE_HEIGHT + blockGapFor(commandId)));
            afterBlock.content = afterContent;
            afterBlockId = afterBlock.id;
            sequence.push(afterBlock);
          }
          return [...previous.slice(0, index), ...sequence, ...previous.slice(index + 1)];
        });
        const base = toScreenPoint(block.x, insertionY);
        openFileInsertAt(block.x, insertionY, base.x + 10, base.y + 8, commandId, afterBlockId);
        setMenu(null);
        return;
      }

      if (!hasBefore && !hasAfter) {
        const nextTable = commandId === "table" ? createDefaultTableData() : undefined;
        const nextCode = commandId === "code" ? createDefaultCodeData() : undefined;
        const nextBookmark = commandId === "bookmark" ? inferBookmarkDataFromUrl("") : undefined;
        const nextEmbed = commandId === "embed" ? inferEmbedDataFromUrl("") : undefined;
        updateBlock(block.id, {
          type: commandId,
          content: "",
          richText: parseRichText(""),
          checked: commandId === "todo" ? false : undefined,
          indent: isListBlockType(commandId) ? block.indent : undefined,
          numberedFormat: commandId === "numbered" ? block.numberedFormat ?? DEFAULT_NUMBERED_FORMAT : undefined,
          numberedStart: commandId === "numbered" ? block.numberedStart : undefined,
          table: nextTable,
          code: nextCode,
          bookmark: nextBookmark,
          embed: nextEmbed,
          h:
            commandId === "table"
              ? tableHeightFor(nextTable?.rows ?? DEFAULT_TABLE_ROWS)
              : commandId === "bookmark"
                ? 178
                : commandId === "embed"
                  ? 178
                  : block.h,
          w: DOC_WIDTH,
        });
        setMenu(null);
        queueFocus(block.id);
        return;
      }

      let insertedId: string | undefined;
      setBlocks((previous) => {
        const index = previous.findIndex((entry) => entry.id === block.id);
        if (index < 0) return previous;
        const sequence: PageBlock[] = [];
        let insertionY = block.y;
        if (hasBefore) {
          const beforeBlock: PageBlock = { ...block, content: beforeContent };
          sequence.push(beforeBlock);
          insertionY = beforeBlock.y + Math.max(beforeBlock.h + blockGapFor(beforeBlock.type), LINE_HEIGHT + blockGapFor(beforeBlock.type));
        }

        const inserted = newBlock(commandId, block.x, insertionY);
        inserted.content = "";
        if (commandId === "todo") inserted.checked = false;
        if (commandId === "toggle") inserted.expanded = true;
        if (isListBlockType(commandId) && typeof block.indent === "number" && block.indent > 0) {
          inserted.indent = block.indent;
        }
        if (commandId === "numbered") {
          inserted.numberedFormat = block.numberedFormat ?? DEFAULT_NUMBERED_FORMAT;
          inserted.numberedStart = undefined;
        }
        if (commandId === "table") {
          inserted.table = createDefaultTableData();
          inserted.h = tableHeightFor(inserted.table.rows);
        }
        if (commandId === "code") {
          inserted.code = createDefaultCodeData();
        }
        inserted.richText = parseRichText(inserted.content);
        insertedId = inserted.id;
        sequence.push(inserted);

        const nextY = inserted.y + Math.max(inserted.h + blockGapFor(inserted.type), LINE_HEIGHT + blockGapFor(inserted.type));
        if (hasAfter) {
          const afterBlock = newBlock("text", block.x, nextY);
          afterBlock.content = afterContent;
          sequence.push(afterBlock);
        }
        return [...previous.slice(0, index), ...sequence, ...previous.slice(index + 1)];
      });

      setMenu(null);
      if (insertedId) queueFocus(insertedId);
    },
    [blocks, menu, openFileInsertAt, queueFocus, toScreenPoint, updateBlock],
  );

  const insertBlockBelow = useCallback(
    (source: PageBlock, type: BlockType, initialContent = "") => {
      const created = newBlock(type, source.x, source.y + Math.max(source.h + blockGapFor(source.type), LINE_HEIGHT + blockGapFor(source.type)));
      if (initialContent) {
        created.content = initialContent;
        created.richText = parseRichText(initialContent);
      }
      if (isListBlockType(type) && typeof source.indent === "number" && source.indent > 0) {
        created.indent = source.indent;
      }
      if (type === "numbered" && source.type === "numbered") {
        created.numberedFormat = source.numberedFormat ?? DEFAULT_NUMBERED_FORMAT;
        created.numberedStart = undefined;
      }
      setBlocks((previous) => {
        const index = previous.findIndex((item) => item.id === source.id);
        if (index < 0) {
          return [...previous, created];
        }
        return [...previous.slice(0, index + 1), created, ...previous.slice(index + 1)];
      });
      queueFocus(created.id);
    },
    [queueFocus],
  );

  const removeBlockAndFocusNeighbor = useCallback(
    (blockId: string) => {
      setBlocks((previous) => {
        const index = previous.findIndex((item) => item.id === blockId);
        if (index < 0) {
          return previous;
        }
        if (previous.length <= 1) {
          return [];
        }
        const neighbor = previous[index - 1] ?? previous[index + 1];
        if (neighbor) {
          queueFocus(neighbor.id);
        }
        const targetSet = new Set([blockId, ...descendantIds(previous, blockId)]);
        return previous.filter((item) => !targetSet.has(item.id));
      });
    },
    [queueFocus],
  );

  const onBlockKeyDown = useCallback(
    (block: PageBlock, event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (isBulkTodoShortcut(event)) {
        const converted = bulkConvertSelectionToTodos(block, event.currentTarget.selectionStart, event.currentTarget.selectionEnd);
        if (converted) {
          event.preventDefault();
          return;
        }
      }

      if (isBulletedShortcut(event) && block.type !== "file") {
        event.preventDefault();
        updateBlock(block.id, {
          type: "bulleted",
          checked: undefined,
          indent: block.indent,
          richText: parseRichText(block.content),
          numberedFormat: undefined,
          numberedStart: undefined,
        });
        return;
      }

      if (isNumberedShortcut(event) && block.type !== "file") {
        event.preventDefault();
        updateBlock(block.id, {
          type: "numbered",
          checked: undefined,
          indent: block.indent,
          numberedFormat: block.numberedFormat ?? DEFAULT_NUMBERED_FORMAT,
          numberedStart: block.numberedStart,
          richText: parseRichText(block.content),
        });
        return;
      }

      if (isToggleShortcut(event) && block.type !== "file") {
        event.preventDefault();
        updateBlock(block.id, {
          type: "toggle",
          checked: undefined,
          indent: block.indent,
          expanded: block.expanded ?? true,
          numberedFormat: undefined,
          numberedStart: undefined,
          richText: parseRichText(block.content),
        });
        return;
      }

      if (isQuoteShortcut(event) && block.type !== "file") {
        event.preventDefault();
        updateBlock(block.id, {
          type: "quote",
          checked: undefined,
          indent: undefined,
          numberedFormat: undefined,
          numberedStart: undefined,
          richText: parseRichText(block.content),
        });
        return;
      }

      if (event.key === " " && !event.shiftKey && !event.metaKey && !event.ctrlKey && block.type !== "file") {
        const start = event.currentTarget.selectionStart ?? 0;
        const end = event.currentTarget.selectionEnd ?? start;
        if (start === end) {
          const nextValue = `${block.content.slice(0, start)} ${block.content.slice(end)}`;
          const before = nextValue.slice(0, start + 1);
          const dividerShortcut = before.match(/(^|\n)\s*---\s$/);
          const toggleShortcut = before.match(/(^|\n)\s*>\s$/);
          const bulletShortcut = before.match(/(^|\n)\s*([-*+])\s$/);
          const numberedShortcut = before.match(/(^|\n)\s*((?:\d+|[aAiI]))\.\s$/);
          if (dividerShortcut || toggleShortcut || bulletShortcut || numberedShortcut) {
            event.preventDefault();
            const marker = dividerShortcut?.[0] ?? toggleShortcut?.[0] ?? bulletShortcut?.[0] ?? numberedShortcut?.[0] ?? "";
            const markerStart = start + 1 - marker.length;
            const nextContent = `${nextValue.slice(0, markerStart)}${nextValue.slice(start + 1)}`;
            const nextType: BlockType = dividerShortcut ? "divider" : toggleShortcut ? "toggle" : bulletShortcut ? "bulleted" : "numbered";
            const numberedMarker = numberedShortcut?.[2] ? parseNumberedMarker(`${numberedShortcut[2]}.`) : null;
            updateBlock(block.id, {
              type: nextType,
              content: nextContent,
              richText: parseRichText(nextContent),
              checked: undefined,
              indent: nextType === "divider" ? undefined : block.indent,
              expanded: nextType === "toggle" ? true : undefined,
              numberedFormat: nextType === "numbered" ? numberedMarker?.format ?? block.numberedFormat ?? DEFAULT_NUMBERED_FORMAT : undefined,
              numberedStart: nextType === "numbered" ? numberedMarker?.start : undefined,
            });
            requestAnimationFrame(() => {
              const input = inputRefs.current[block.id] as HTMLInputElement | HTMLTextAreaElement | null;
              if (!input) return;
              input.focus();
              input.setSelectionRange(markerStart, markerStart);
            });
            return;
          }
        }
      }

      if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && !menu && block.type === "toggle") {
        event.preventDefault();
        updateBlock(block.id, { expanded: !(block.expanded ?? true) });
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.altKey && event.key.toLowerCase() === "t") {
        event.preventDefault();
        setBlocks((previous) => {
          const hasCollapsed = previous.some((entry) => entry.type === "toggle" && entry.expanded === false);
          return previous.map((entry) => (entry.type === "toggle" ? { ...entry, expanded: hasCollapsed } : entry));
        });
        return;
      }

      if ((block.type === "quote" || isListBlockType(block.type)) && (event.metaKey || event.ctrlKey) && ["b", "i", "k"].includes(event.key.toLowerCase())) {
        event.preventDefault();
        const start = event.currentTarget.selectionStart ?? 0;
        const end = event.currentTarget.selectionEnd ?? 0;
        const lowered = event.key.toLowerCase();
        if (lowered === "b") {
          const { nextValue, nextCursorStart, nextCursorEnd } = wrapSelection(block.content, start, end, "**");
          updateBlock(block.id, { content: nextValue, richText: parseRichText(nextValue) });
          requestAnimationFrame(() => {
            const input = inputRefs.current[block.id] as HTMLTextAreaElement | null;
            if (!input) return;
            input.focus();
            input.setSelectionRange(nextCursorStart, nextCursorEnd);
          });
          return;
        }
        if (lowered === "i") {
          const { nextValue, nextCursorStart, nextCursorEnd } = wrapSelection(block.content, start, end, "*");
          updateBlock(block.id, { content: nextValue, richText: parseRichText(nextValue) });
          requestAnimationFrame(() => {
            const input = inputRefs.current[block.id] as HTMLTextAreaElement | null;
            if (!input) return;
            input.focus();
            input.setSelectionRange(nextCursorStart, nextCursorEnd);
          });
          return;
        }
        const selectedText = block.content.slice(Math.min(start, end), Math.max(start, end)) || "link";
        const url = window.prompt("Paste URL", "https://");
        if (!url) {
          return;
        }
        const replacement = `[${selectedText}](${url.trim()})`;
        const from = Math.min(start, end);
        const to = Math.max(start, end);
        const nextValue = `${block.content.slice(0, from)}${replacement}${block.content.slice(to)}`;
        updateBlock(block.id, { content: nextValue, richText: parseRichText(nextValue) });
        requestAnimationFrame(() => {
          const input = inputRefs.current[block.id] as HTMLTextAreaElement | null;
          if (!input) return;
          input.focus();
          const caret = from + replacement.length;
          input.setSelectionRange(caret, caret);
        });
        return;
      }

      if (menu && menu.blockId === block.id && event.key === "Enter") {
        event.preventDefault();
        const picked = filteredMenu[activeMenuIndex];
        if (picked) applySlashCommand(picked.id);
        return;
      }

      if (event.key === "Tab" && isListBlockType(block.type)) {
        event.preventDefault();
        updateListIndent(block, event.shiftKey ? -1 : 1);
        return;
      }

      if (event.key === "Enter" && !event.shiftKey && !menu && ["text", "h1", "h2", "h3", "todo", "bulleted", "numbered", "toggle", "quote", "callout", "divider"].includes(block.type)) {
        event.preventDefault();
        if (block.type === "divider") {
          insertBlockBelow(block, "text");
          return;
        }
        if (isListBlockType(block.type)) {
          const isEmpty = block.content.trim().length === 0;
          if (isEmpty) {
            updateBlock(block.id, {
              type: "text",
              checked: undefined,
              indent: undefined,
              numberedFormat: undefined,
              numberedStart: undefined,
            });
            queueFocus(block.id);
            return;
          }
          const cursor = event.currentTarget.selectionStart ?? block.content.length;
          const before = block.content.slice(0, cursor);
          const after = block.content.slice(cursor);
          if (cursor > 0 && cursor < block.content.length) {
            updateBlock(block.id, { content: before, richText: parseRichText(before) });
            insertBlockBelow(block, block.type, after);
            return;
          }
          insertBlockBelow(block, block.type, "");
          return;
        }
        if (block.type === "text") {
          const cursor = event.currentTarget.selectionStart ?? block.content.length;
          const before = block.content.slice(0, cursor);
          const after = block.content.slice(cursor);
          if (cursor > 0 && cursor < block.content.length) {
            updateBlock(block.id, { content: before, richText: parseRichText(before) });
            insertBlockBelow(block, "text", after);
            return;
          }
          insertBlockBelow(block, "text", "");
          return;
        }
        if (block.type === "quote") {
          insertBlockBelow(block, "text", ATTRIBUTION_PREFIX);
          return;
        }
        insertBlockBelow(block, "text");
        return;
      }

      if (event.key === "Backspace" && isListBlockType(block.type)) {
        const cursorStart = event.currentTarget.selectionStart ?? 0;
        if (cursorStart === 0 && (block.indent ?? 0) > 0) {
          event.preventDefault();
          updateListIndent(block, -1);
          return;
        }
        if (cursorStart === 0 && block.content.trim().length === 0) {
          event.preventDefault();
          updateBlock(block.id, {
            type: "text",
            checked: undefined,
            indent: undefined,
            numberedFormat: undefined,
            numberedStart: undefined,
          });
          queueFocus(block.id);
          return;
        }
      }

      if ((event.key === "Backspace" || event.key === "Delete") && block.type !== "file" && block.content.trim().length === 0) {
        event.preventDefault();
        removeBlockAndFocusNeighbor(block.id);
      }
    },
    [
      activeMenuIndex,
      applySlashCommand,
      bulkConvertSelectionToTodos,
      filteredMenu,
      insertBlockBelow,
      menu,
      queueFocus,
      removeBlockAndFocusNeighbor,
      updateBlock,
      updateListIndent,
    ],
  );

  const beginPan = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      panRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        cameraX: camera.x,
        cameraY: camera.y,
        moved: false,
      };

      const onMove = (moveEvent: PointerEvent) => {
        const pan = panRef.current;
        if (!pan) return;
        const dx = moveEvent.clientX - pan.startX;
        const dy = moveEvent.clientY - pan.startY;
        if (Math.abs(dx) + Math.abs(dy) > 4) pan.moved = true;
        setCamera((previous) => ({ ...previous, x: pan.cameraX + dx, y: pan.cameraY + dy }));
      };

      const onUp = (upEvent: PointerEvent) => {
        const pan = panRef.current;
        panRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (!pan?.moved) {
          const world = worldFromClient(upEvent.clientX, upEvent.clientY);
          addTextBlockAt(world.x, world.y);
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [addTextBlockAt, camera.x, camera.y, worldFromClient],
  );

  const beginDragBlock = useCallback(
    (block: PageBlock, event: ReactPointerEvent<HTMLElement>, blockIds?: string[]) => {
      if (event.button !== 0 || isTextInputTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      setMenu(null);
      setBlockMenu((previous) => ({ ...previous, open: false, moveToQuery: "", searchQuery: "" }));
      setDragPreview(null);
      const world = worldFromClient(event.clientX, event.clientY);
      const draggingIds = blockIds && blockIds.length > 0 ? blockIds : isListBlockType(block.type) ? [block.id, ...descendantIds(blocks, block.id)] : [block.id];
      const sourceBlocks = blocks.filter((entry) => draggingIds.includes(entry.id));
      const leadBlock = sourceBlocks.find((entry) => entry.id === block.id) ?? block;
      dragRef.current = { blockId: leadBlock.id, offsetX: world.x - leadBlock.x, offsetY: world.y - leadBlock.y };
      const startPositions = new Map(sourceBlocks.map((entry) => [entry.id, { x: entry.x, y: entry.y }]));
      const leadStart = startPositions.get(leadBlock.id) ?? { x: leadBlock.x, y: leadBlock.y };

      const onMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const pointer = worldFromClient(moveEvent.clientX, moveEvent.clientY);
        const nextLeadX = pointer.x - drag.offsetX;
        const nextLeadY = pointer.y - drag.offsetY;
        const deltaX = nextLeadX - leadStart.x;
        const deltaY = nextLeadY - leadStart.y;
        setBlocks((previous) =>
          previous.map((entry) =>
            startPositions.has(entry.id)
              ? {
                  ...entry,
                  x: (startPositions.get(entry.id)?.x ?? entry.x) + deltaX,
                  y: (startPositions.get(entry.id)?.y ?? entry.y) + deltaY,
                }
              : entry,
          ),
        );
        const candidates = blocks.filter((entry) => entry.id !== leadBlock.id && !startPositions.has(entry.id));
        const intent = inferDropIntent(nextLeadX, nextLeadY, leadBlock.h, candidates);
        if (!intent) {
          setDragPreview(null);
          return;
        }
        if (intent.mode === "insert") {
          setDragPreview({ mode: "insert", x: intent.target.x, y: intent.y, width: Math.max(180, intent.target.w) });
          return;
        }
        if (intent.mode === "column") {
          setDragPreview({
            mode: "column",
            x: intent.x,
            y: intent.y,
            width: intent.width,
            height: intent.height,
          });
          return;
        }
        setDragPreview({
          mode: "nest",
          x: intent.target.x + INDENT_STEP,
          y: intent.y - 12,
          height: 24,
        });
      };

      const onUp = () => {
        dragRef.current = null;
        setDragPreview(null);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setBlocks((previous) => {
          const lead = previous.find((entry) => entry.id === leadBlock.id);
          if (!lead) return previous;
          const candidates = previous.filter((entry) => entry.id !== lead.id && !startPositions.has(entry.id));
          const intent = inferDropIntent(lead.x, lead.y, lead.h, candidates);
          if (!intent) return previous;

          const next = previous.map((entry) => ({ ...entry }));
          const leadEntry = next.find((entry) => entry.id === lead.id);
          if (!leadEntry) return previous;

          // Rearrange vertically when dropped near the same horizontal lane.
          if (intent.mode === "insert") {
            leadEntry.x = intent.target.x;
            leadEntry.y = intent.y;
            leadEntry.indent = intent.target.indent;
            return next;
          }

          // Create columns by snapping to left/right side of target.
          if (intent.mode === "column") {
            leadEntry.x = intent.x;
            leadEntry.y = intent.y;
            return next;
          }

          // Nest if slightly right and below target.
          if (intent.mode === "nest") {
            leadEntry.x = intent.target.x;
            leadEntry.indent = clamp((intent.target.indent ?? 0) + 1, 0, MAX_LIST_INDENT);
            leadEntry.y = intent.y;
            return next;
          }

          return previous;
        });
        if (snapAnimateTimerRef.current) {
          clearTimeout(snapAnimateTimerRef.current);
        }
        setSnapAnimateBlockIds([leadBlock.id]);
        snapAnimateTimerRef.current = setTimeout(() => setSnapAnimateBlockIds([]), 220);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [blocks, worldFromClient],
  );

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || event.target !== event.currentTarget) return;
      setMenu(null);
      setSelectedBlockIds([]);
      beginPan(event);
    },
    [beginPan],
  );

  const onHandlePointerDown = useCallback(
    (block: PageBlock, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      if (event.metaKey || event.ctrlKey) {
        setSelectedBlockIds((previous) => (previous.includes(block.id) ? previous.filter((id) => id !== block.id) : [...previous, block.id]));
        return;
      }

      const activeSelection = selectedBlockIds.includes(block.id) ? selectedBlockIds : [block.id];
      setSelectedBlockIds(activeSelection);
      handlePointerRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        blockIds: activeSelection,
        blockId: block.id,
      };

      const startDrag = (clientX: number, clientY: number) => {
        const synthetic = {
          ...event,
          clientX,
          clientY,
          button: 0,
          preventDefault: () => {},
          stopPropagation: () => {},
          target: event.target,
        } as unknown as ReactPointerEvent<HTMLElement>;
        beginDragBlock(block, synthetic, activeSelection);
      };

      const onMove = (moveEvent: PointerEvent) => {
        const pointer = handlePointerRef.current;
        if (!pointer) return;
        if (Math.abs(moveEvent.clientX - pointer.startX) + Math.abs(moveEvent.clientY - pointer.startY) > HANDLE_DRAG_MOVE_THRESHOLD) {
          pointer.moved = true;
          startDrag(moveEvent.clientX, moveEvent.clientY);
          handlePointerRef.current = null;
          cleanup();
        }
      };

      const onUp = () => {
        const pointer = handlePointerRef.current;
        handlePointerRef.current = null;
        if (pointer && !pointer.moved) {
          const indentOffset = typeof block.indent === "number" && block.indent > 0 ? block.indent * INDENT_STEP : 0;
          const screen = toScreenPoint(block.x + indentOffset, block.y);
          const menuWidth = 288;
          const menuHeight = 540;
          const blockWidth = Math.max(220, DOC_WIDTH - indentOffset);
          const leftCandidate = screen.x - menuWidth - 20;
          const rightCandidate = screen.x + blockWidth + 20;
          const x = leftCandidate >= 8 ? leftCandidate : rightCandidate;
          const y = screen.y - 4;
          setBlockMenu({
            open: true,
            x: clamp(x, 8, Math.max(8, window.innerWidth - menuWidth - 8)),
            y: clamp(y, 8, Math.max(8, window.innerHeight - menuHeight - 8)),
            blockId: block.id,
            moveToQuery: "",
            searchQuery: "",
          });
          setCanvasMenu((previous) => ({ ...previous, open: false }));
          setFileMenu((previous) => ({ ...previous, open: false }));
          setQuickInsertMenu((previous) => ({ ...previous, open: false }));
        }
        cleanup();
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [beginDragBlock, selectedBlockIds, toScreenPoint],
  );

  const insertFromQuickMenu = useCallback(
    (blockId: string, commandId: SlashCommandId) => {
      const source = blocks.find((entry) => entry.id === blockId);
      if (!source) return;
      if (commandId === "file" || commandId === "image" || commandId === "video" || commandId === "audio") {
        const insertionY = source.y + Math.max(source.h + blockGapFor(source.type), LINE_HEIGHT + blockGapFor(source.type));
        const base = toScreenPoint(source.x, insertionY);
        openFileInsertAt(source.x, insertionY, base.x + 10, base.y + 8, commandId);
        setQuickInsertMenu((previous) => ({ ...previous, open: false }));
        return;
      }
      insertBlockBelow(source, commandId, "");
      setQuickInsertMenu((previous) => ({ ...previous, open: false }));
    },
    [blocks, insertBlockBelow, openFileInsertAt, toScreenPoint],
  );
  const openFileBlock = useCallback(
    async (block: PageBlock) => {
      if (!block.file) return;
      try {
        const url = block.file.externalUrl
          ? block.file.externalUrl
          : block.file.path
            ? signedUrls[block.file.path] ?? (await signFileUrl(block.file.path))
            : null;
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Unable to open file.");
      }
    },
    [signFileUrl, signedUrls],
  );

  const downloadFileBlock = useCallback(
    async (block: PageBlock) => {
      if (!block.file) return;
      try {
        const url = block.file.externalUrl
          ? block.file.externalUrl
          : block.file.path
            ? signedUrls[block.file.path] ?? (await signFileUrl(block.file.path))
            : null;
        if (!url) return;
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = block.file.displayName || block.file.name || "file";
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Unable to download file.");
      }
    },
    [signFileUrl, signedUrls],
  );

  const renameFileBlock = useCallback((blockId: string) => {
    setBlocks((previous) => {
      const current = previous.find((entry) => entry.id === blockId);
      if (!current?.file) return previous;
      const nextName = window.prompt("Rename file block title", current.file.displayName);
      if (!nextName || !nextName.trim()) return previous;
      return previous.map((entry) =>
        entry.id === blockId && entry.file
          ? {
              ...entry,
              file: {
                ...entry.file,
                displayName: nextName.trim(),
              },
            }
          : entry,
      );
    });
  }, []);

  const deleteFileBlock = useCallback(
    async (blockId: string) => {
      const block = blocks.find((entry) => entry.id === blockId);
      if (!block?.file) return;
      if (block.file.externalUrl) {
        setBlocks((previous) => previous.filter((entry) => entry.id !== blockId));
        return;
      }
      if (!block.file.path) return;
      try {
        const response = await fetch("/api/page/files", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: block.file.path }),
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to delete file.");
        setBlocks((previous) => previous.filter((entry) => entry.id !== blockId));
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Unable to delete file.");
      }
    },
    [blocks],
  );

  const updateFileCaption = useCallback((blockId: string) => {
    const current = blocks.find((entry) => entry.id === blockId);
    if (!current) return;
    const caption = window.prompt("Add caption", current.content || "");
    if (caption === null) return;
    updateBlock(blockId, { content: caption.trim() });
  }, [blocks, updateBlock]);

  const updateCodeBlock = useCallback((blockId: string, patch: Partial<PageCodeData>) => {
    setBlocks((previous) =>
      previous.map((block) => {
        if (block.id !== blockId || block.type !== "code") {
          return block;
        }
        return {
          ...block,
          code: {
            ...createDefaultCodeData(),
            ...(block.code ?? {}),
            ...patch,
          },
        };
      }),
    );
  }, []);

  const copyCodeBlock = useCallback(
    async (blockId: string) => {
      const block = blocks.find((entry) => entry.id === blockId);
      if (!block || block.type !== "code") return;
      try {
        await navigator.clipboard.writeText(block.content || "");
      } catch {
        window.alert("Unable to copy code.");
      }
    },
    [blocks],
  );

  const editCodeCaption = useCallback(
    (blockId: string) => {
      const block = blocks.find((entry) => entry.id === blockId);
      if (!block || block.type !== "code") return;
      const currentCaption = block.code?.caption ?? "";
      const nextCaption = window.prompt("Code caption", currentCaption);
      if (nextCaption === null) return;
      updateCodeBlock(blockId, { caption: nextCaption.trim() });
    },
    [blocks, updateCodeBlock],
  );

  const focusTableCell = useCallback((blockId: string, row: number, column: number) => {
    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLInputElement>(`[data-table-cell="${blockId}:${row}:${column}"]`);
      if (!target) return;
      target.focus();
      const end = target.value.length;
      target.setSelectionRange(end, end);
    });
  }, []);

  const updateTableCell = useCallback((blockId: string, row: number, column: number, value: string) => {
    setBlocks((previous) =>
      previous.map((block) => {
        if (block.id !== blockId || block.type !== "table") {
          return block;
        }
        const table = ensureTableData(block.table);
        const nextCells = table.cells.map((entry) => [...entry]);
        if (!nextCells[row]) {
          return block;
        }
        nextCells[row]![column] = value;
        return {
          ...block,
          table: {
            ...table,
            cells: nextCells,
          },
        };
      }),
    );
  }, []);

  const appendTableRow = useCallback((blockId: string) => {
    setBlocks((previous) =>
      previous.map((block) => {
        if (block.id !== blockId || block.type !== "table") {
          return block;
        }
        const table = ensureTableData(block.table);
        const nextRows = table.rows + 1;
        const nextCells = [...table.cells.map((entry) => [...entry]), Array.from({ length: table.columns }, () => "")];
        return {
          ...block,
          table: { ...table, rows: nextRows, cells: nextCells },
          h: tableHeightFor(nextRows),
        };
      }),
    );
  }, []);

  const appendTableColumn = useCallback((blockId: string) => {
    setBlocks((previous) =>
      previous.map((block) => {
        if (block.id !== blockId || block.type !== "table") {
          return block;
        }
        const table = ensureTableData(block.table);
        const nextColumns = table.columns + 1;
        const nextCells = table.cells.map((entry) => [...entry, ""]);
        return {
          ...block,
          table: { ...table, columns: nextColumns, cells: nextCells },
        };
      }),
    );
  }, []);

  const toggleTableHeader = useCallback((blockId: string, key: "headerRow" | "headerColumn") => {
    setBlocks((previous) =>
      previous.map((block) => {
        if (block.id !== blockId || block.type !== "table") {
          return block;
        }
        const table = ensureTableData(block.table);
        return {
          ...block,
          table: {
            ...table,
            [key]: !table[key],
          },
        };
      }),
    );
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      const screenX = rect ? event.clientX - rect.left : event.clientX;
      const screenY = rect ? event.clientY - rect.top : event.clientY;

      if (event.ctrlKey || event.metaKey) {
        const pointerWorld = worldFromScreen(screenX, screenY);
        const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08;
        const nextZoom = clamp(camera.zoom * zoomFactor, 0.28, 2.4);
        setCamera({ x: screenX - pointerWorld.x * nextZoom, y: screenY - pointerWorld.y * nextZoom, zoom: nextZoom });
        return;
      }

      setCamera((previous) => ({ ...previous, x: previous.x - event.deltaX, y: previous.y - event.deltaY }));
    },
    [camera.zoom, worldFromScreen],
  );

  const renderInput = (block: PageBlock) => {
    const attachInputRef = (node: HTMLElement | null) => {
      inputRefs.current[block.id] = node;
      if (node instanceof HTMLTextAreaElement) {
        const minHeight = block.type === "code" ? 92 : LINE_HEIGHT;
        autoSizeTextarea(block.id, node, minHeight);
      }
    };

    const sharedProps = {
      value: block.content,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleTextualChange(block.id, event);
        rememberSelection(block.id, event.target);
        if (event.target instanceof HTMLTextAreaElement) {
          const minHeight = block.type === "code" ? 92 : LINE_HEIGHT;
          autoSizeTextarea(block.id, event.target, minHeight);
        }
      },
      onInput: (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = event.currentTarget;
        if (target instanceof HTMLTextAreaElement) {
          const minHeight = block.type === "code" ? 92 : LINE_HEIGHT;
          autoSizeTextarea(block.id, target, minHeight);
        }
      },
      onSelect: (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        rememberSelection(block.id, event.currentTarget);
      },
      onFocus: () => setEditingTextBlockId(block.id),
      onBlur: (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditingTextBlockId((previous) => (previous === block.id ? null : previous));
        const target = event.currentTarget;
        if (target instanceof HTMLTextAreaElement) {
          const minHeight = block.type === "code" ? 92 : LINE_HEIGHT;
          autoSizeTextarea(block.id, target, minHeight);
        }
      },
      onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlockKeyDown(block, event),
      placeholder: 'Type "/" for commands',
    };

    if (block.type === "h1") {
      return (
        <textarea
          ref={attachInputRef as never}
          {...sharedProps}
          rows={1}
          className="w-full resize-none bg-transparent text-5xl leading-tight font-black tracking-tight text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
        />
      );
    }
    if (block.type === "h2") {
      return (
        <textarea
          ref={attachInputRef as never}
          {...sharedProps}
          rows={1}
          className="w-full resize-none bg-transparent text-4xl leading-tight font-bold text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
        />
      );
    }
    if (block.type === "h3") {
      return (
        <textarea
          ref={attachInputRef as never}
          {...sharedProps}
          rows={1}
          className="w-full resize-none bg-transparent text-3xl leading-tight font-semibold text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
        />
      );
    }
    if (block.type === "todo") {
      return (
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={Boolean(block.checked)}
            onChange={(event) => updateBlock(block.id, { checked: event.target.checked })}
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)]"
          />
          <input
            ref={attachInputRef as never}
            {...sharedProps}
            className={cn(
              "w-full bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65",
              block.checked ? "line-through text-[var(--color-text-muted)]" : "",
            )}
          />
        </div>
      );
    }
    if (block.type === "bulleted") {
      return (
        <div className="flex items-start gap-3">
          <span className="mt-1 text-[var(--color-text-muted)]">•</span>
          <div className="w-full">
            <textarea
              ref={attachInputRef as never}
              {...sharedProps}
              rows={1}
              className="w-full resize-none bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
            />
            {hasInlineFormatting(block.content) && editingTextBlockId !== block.id && (
              <div className="mt-1 text-[0.95rem] leading-6 opacity-95">{renderRichText(block.richText)}</div>
            )}
          </div>
        </div>
      );
    }
    if (block.type === "numbered") {
      return (
        <div className="flex items-start gap-2.5">
          <span className="mt-1 min-w-[1.6rem] text-right text-[var(--color-text-muted)]">{numberedLabelFor(blocks, block.id)}</span>
          <div className="w-full">
            <textarea
              ref={attachInputRef as never}
              {...sharedProps}
              rows={1}
              className="w-full resize-none bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
            />
            {hasInlineFormatting(block.content) && editingTextBlockId !== block.id && (
              <div className="mt-1 text-[0.95rem] leading-6 opacity-95">{renderRichText(block.richText)}</div>
            )}
          </div>
        </div>
      );
    }
    if (block.type === "toggle") {
      const expanded = block.expanded ?? true;
      return (
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            className="mt-[2px] inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
            onClick={() => updateBlock(block.id, { expanded: !expanded })}
            title={expanded ? "Collapse" : "Expand"}
          >
            <span className={cn("inline-block transition-transform", expanded ? "rotate-90" : "")}>{">"}</span>
          </button>
          <div className="w-full">
            <textarea
              ref={attachInputRef as never}
              {...sharedProps}
              rows={1}
              className="w-full resize-none bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
            />
            {hasInlineFormatting(block.content) && editingTextBlockId !== block.id && (
              <div className="mt-1 text-[0.95rem] leading-6 opacity-95">{renderRichText(block.richText)}</div>
            )}
          </div>
        </div>
      );
    }
    if (block.type === "table") {
      const table = ensureTableData(block.table);
      return (
        <div className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/95">
          <div className="flex flex-wrap items-center gap-1 border-b border-[var(--color-border)] px-2 py-1.5">
            <button
              type="button"
              className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              onClick={() => appendTableRow(block.id)}
            >
              + Row
            </button>
            <button
              type="button"
              className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              onClick={() => appendTableColumn(block.id)}
            >
              + Column
            </button>
            <button
              type="button"
              className={cn(
                "rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
                table.headerRow ? "bg-[var(--color-accent-soft)] text-[var(--color-text)]" : "",
              )}
              onClick={() => toggleTableHeader(block.id, "headerRow")}
            >
              Header row
            </button>
            <button
              type="button"
              className={cn(
                "rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
                table.headerColumn ? "bg-[var(--color-accent-soft)] text-[var(--color-text)]" : "",
              )}
              onClick={() => toggleTableHeader(block.id, "headerColumn")}
            >
              Header column
            </button>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-full" style={{ gridTemplateColumns: `repeat(${table.columns}, minmax(140px, 1fr))` }}>
              {table.cells.map((row, rowIndex) =>
                row.map((cell, columnIndex) => (
                  <input
                    key={`${block.id}-cell-${rowIndex}-${columnIndex}`}
                    ref={rowIndex === 0 && columnIndex === 0 ? (attachInputRef as never) : undefined}
                    data-table-cell={`${block.id}:${rowIndex}:${columnIndex}`}
                    value={cell}
                    onChange={(event) => updateTableCell(block.id, rowIndex, columnIndex, event.target.value)}
                    onFocus={() => setEditingTextBlockId(block.id)}
                    onBlur={() => setEditingTextBlockId((previous) => (previous === block.id ? null : previous))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (rowIndex === table.rows - 1) {
                          appendTableRow(block.id);
                        }
                        focusTableCell(block.id, Math.min(table.rows, rowIndex + 1), columnIndex);
                        return;
                      }
                      if (event.key === "Tab") {
                        event.preventDefault();
                        const movingBackward = event.shiftKey;
                        let nextRow = rowIndex;
                        let nextColumn = columnIndex + (movingBackward ? -1 : 1);
                        if (nextColumn >= table.columns) {
                          nextColumn = 0;
                          nextRow += 1;
                        } else if (nextColumn < 0) {
                          nextColumn = table.columns - 1;
                          nextRow -= 1;
                        }
                        if (nextRow >= table.rows) {
                          appendTableRow(block.id);
                          nextRow = table.rows;
                        } else if (nextRow < 0) {
                          nextRow = 0;
                          nextColumn = 0;
                        }
                        focusTableCell(block.id, nextRow, nextColumn);
                        return;
                      }
                      if ((event.key === "Backspace" || event.key === "Delete") && cell.length === 0 && rowIndex === 0 && columnIndex === 0) {
                        event.preventDefault();
                        removeBlockAndFocusNeighbor(block.id);
                      }
                    }}
                    placeholder={`Cell ${rowIndex + 1}, ${columnIndex + 1}`}
                    className={cn(
                      "h-10 border-b border-r border-[var(--color-border)] bg-transparent px-2.5 text-sm text-[var(--color-text)] outline-none focus:bg-[var(--color-surface-muted)]/60",
                      table.headerRow && rowIndex === 0 ? "font-semibold" : "",
                      table.headerColumn && columnIndex === 0 ? "font-semibold" : "",
                    )}
                  />
                )),
              )}
            </div>
          </div>
        </div>
      );
    }
    if (block.type === "divider") {
      return (
        <div
          ref={attachInputRef as never}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              insertBlockBelow(block, "text");
              return;
            }
            if (event.key === "Backspace" || event.key === "Delete") {
              event.preventDefault();
              removeBlockAndFocusNeighbor(block.id);
            }
          }}
          className="group/divider w-full rounded-sm py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <div className="h-px w-full bg-[var(--color-border)]/95" />
        </div>
      );
    }
    if (block.type === "page") {
      return (
        <button
          type="button"
          className="w-full rounded bg-[var(--color-surface-muted)] px-3 py-2 text-left text-base font-medium text-[var(--color-text)] underline decoration-[var(--color-border)] underline-offset-4"
          onClick={() => {
            if (!block.pageId) return;
            const params = new URLSearchParams(searchParams.toString());
            params.set("doc", block.pageId);
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          {block.content || "Open page"}
        </button>
      );
    }
    if (block.type === "quote") {
      const hasMarkdownSyntax = /\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((https?:\/\/[^\s)]+)\)|`[^`]+`|@[\w.-]+/.test(block.content);
      return (
        <div
          className="rounded-md border-l-4 px-4 py-2"
          style={{
            borderLeftColor: block.textColor || "var(--color-border)",
            backgroundColor: block.backgroundColor || "transparent",
            color: block.textColor || "var(--color-text)",
          }}
        >
          <textarea
            ref={attachInputRef as never}
            {...sharedProps}
            rows={1}
            onFocus={() => {
              setEditingTextBlockId(block.id);
              setEditingQuoteId(block.id);
            }}
            onBlur={() => {
              setEditingTextBlockId((previous) => (previous === block.id ? null : previous));
              setEditingQuoteId((previous) => (previous === block.id ? null : previous));
            }}
            className="w-full resize-none bg-transparent pl-1 text-[1.28rem] font-medium italic leading-9 outline-none placeholder:text-[var(--color-text-muted)]/65"
          />
          {hasMarkdownSyntax && editingQuoteId !== block.id && (
            <div className="mt-1.5 pl-1 text-base leading-7 opacity-95">{renderQuoteInlineMarkdown(block.content)}</div>
          )}
        </div>
      );
    }
    if (block.type === "callout") {
      return (
        <textarea
          ref={attachInputRef as never}
          {...sharedProps}
          rows={1}
          className="w-full resize-none bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
        />
      );
    }
    if (block.type === "code") {
      const codeConfig = { ...createDefaultCodeData(), ...(block.code ?? {}) };
      return (
        <div className="group/code relative w-full rounded-md bg-[#f7f7f5]">
          <div
            className={cn(
              "absolute right-2 top-1.5 z-[2] flex items-center rounded-md bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-opacity",
              codeMenu.open && codeMenu.blockId === block.id
                ? "opacity-100"
                : "pointer-events-none opacity-0 group-hover/code:pointer-events-auto group-hover/code:opacity-100 group-focus-within/code:pointer-events-auto group-focus-within/code:opacity-100",
            )}
          >
            <select
              value={codeConfig.language}
              onChange={(event) => updateCodeBlock(block.id, { language: event.target.value })}
              onFocus={() => setEditingTextBlockId(block.id)}
              className="h-7 rounded-l-md bg-transparent px-2 text-xs text-[var(--color-text-muted)] outline-none"
            >
              {CODE_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              aria-label="Copy code"
              onClick={() => {
                void copyCodeBlock(block.id);
              }}
            >
              ⧉
            </button>
            <button
              type="button"
              data-code-menu-trigger="true"
              className="inline-flex h-7 w-7 items-center justify-center rounded-r-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              aria-label="Code options"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const isSame = codeMenu.open && codeMenu.blockId === block.id;
                setCodeMenu(
                  isSame
                    ? { open: false, x: 0, y: 0 }
                    : {
                        open: true,
                        blockId: block.id,
                        x: event.clientX,
                        y: event.clientY + 6,
                      },
                );
              }}
            >
              <span className="inline-flex items-center justify-center gap-[2px]">
                <span className="h-[2px] w-[2px] rounded-full bg-current" />
                <span className="h-[2px] w-[2px] rounded-full bg-current" />
                <span className="h-[2px] w-[2px] rounded-full bg-current" />
              </span>
            </button>
          </div>
          <textarea
            ref={attachInputRef as never}
            {...sharedProps}
            rows={3}
            wrap={codeConfig.wrap ? "soft" : "off"}
            className={cn(
              "w-full resize-none bg-transparent px-4 pb-2 pt-10 font-mono text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65",
              codeConfig.wrap ? "" : "overflow-x-auto",
            )}
            style={{ whiteSpace: codeConfig.wrap ? "pre-wrap" : "pre" }}
          />
          {codeConfig.caption ? <p className="px-2.5 py-1.5 text-xs text-[var(--color-text-muted)]">{codeConfig.caption}</p> : null}
        </div>
      );
    }

    return (
      <textarea
        ref={attachInputRef as never}
        {...sharedProps}
        rows={1}
        className="w-full resize-none bg-transparent text-base leading-8 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/65"
      />
    );
  };

  const menuBlock = menu ? blocks.find((block) => block.id === menu.blockId) : undefined;
  const commentTargetBlock = commentPanel.blockId ? blocks.find((block) => block.id === commentPanel.blockId) : undefined;
  const codeMenuBlock = codeMenu.blockId ? blocks.find((block) => block.id === codeMenu.blockId) : undefined;
  const hiddenBlockIds = useMemo(() => {
    const hidden = new Set<string>();
    const collapsedIndentStack: number[] = [];
    for (const block of blocks) {
      const indent = block.indent ?? 0;
      while (collapsedIndentStack.length && indent <= collapsedIndentStack[collapsedIndentStack.length - 1]!) {
        collapsedIndentStack.pop();
      }
      if (collapsedIndentStack.length) {
        hidden.add(block.id);
      }
      if (block.type === "toggle" && block.expanded === false) {
        collapsedIndentStack.push(indent);
      }
    }
    return hidden;
  }, [blocks]);
  const canPostComment = commentPanel.draft.trim().length > 0 || commentPanel.attachments.length > 0;
  const blockMenuBlock = blockMenu.blockId ? blocks.find((block) => block.id === blockMenu.blockId) : undefined;
  const blockMenuActions = blockMenuBlock
    ? [
        ...(blockMenuBlock.type === "file" || blockMenuBlock.type === "image" || blockMenuBlock.type === "video" || blockMenuBlock.type === "audio"
          ? [
              {
                id: "file_caption",
                label: "Caption",
                shortcut: "",
                onClick: () => {
                  updateFileCaption(blockMenu.blockId!);
                },
              },
              {
                id: "file_download",
                label: "Download",
                shortcut: "",
                onClick: () => {
                  void downloadFileBlock(blockMenuBlock);
                },
              },
            ]
          : []),
        ...(blockMenuBlock.type === "bookmark" && blockMenuBlock.bookmark
          ? [
              {
                id: "bookmark_open",
                label: "Open link",
                shortcut: "",
                onClick: () => {
                  window.open(blockMenuBlock.bookmark!.url, "_blank", "noopener,noreferrer");
                },
              },
              {
                id: "bookmark_edit",
                label: "Edit link",
                shortcut: "",
                onClick: () => {
                  const nextUrl = window.prompt("Bookmark URL", blockMenuBlock.bookmark!.url);
                  if (!nextUrl) return;
                  try {
                    const parsed = new URL(nextUrl.trim());
                    updateBlock(blockMenuBlock.id, { bookmark: inferBookmarkDataFromUrl(parsed.toString()), h: 122, content: "" });
                    void requestBookmarkPreview(blockMenuBlock.id, parsed.toString());
                  } catch {
                    window.alert("Please paste a valid URL.");
                  }
                },
              },
            ]
          : []),
        ...(blockMenuBlock.type === "embed" && blockMenuBlock.embed
          ? [
              {
                id: "embed_open",
                label: "Open original",
                shortcut: "",
                onClick: () => {
                  if (!blockMenuBlock.embed?.url) return;
                  window.open(blockMenuBlock.embed.url, "_blank", "noopener,noreferrer");
                },
              },
              {
                id: "embed_edit",
                label: "Edit embed link",
                shortcut: "",
                onClick: () => {
                  const current = blockMenuBlock.embed?.url ?? "";
                  const nextUrl = window.prompt("Embed URL", current);
                  if (!nextUrl) return;
                  try {
                    const parsed = new URL(nextUrl.trim());
                    const embed = inferEmbedDataFromUrl(parsed.toString());
                    if (!embed.embedUrl) {
                      window.alert("Unable to embed this URL.");
                      return;
                    }
                    updateBlock(blockMenuBlock.id, { embed, h: 332, content: "" });
                  } catch {
                    window.alert("Please paste a valid URL.");
                  }
                },
              },
            ]
          : []),
        {
          id: "copy_link",
          label: "Copy link to block",
          shortcut: "Alt+Shift+L",
          onClick: () => {
            void copyBlockLink(blockMenu.blockId!);
          },
        },
        {
          id: "duplicate",
          label: "Duplicate",
          shortcut: "Ctrl+D",
          onClick: () => {
            duplicateBlock(blockMenu.blockId!);
          },
        },
        {
          id: "delete",
          label: "Delete",
          shortcut: "Del",
          danger: true,
          onClick: () => {
            const targets = selectedBlockIds.includes(blockMenu.blockId!) ? selectedBlockIds : [blockMenu.blockId!];
            deleteBlocks(targets);
            setBlockMenu({ open: false, x: 0, y: 0, moveToQuery: "", searchQuery: "" });
          },
        },
      ]
    : [];
  const filteredBlockMenuActions = blockMenu.searchQuery.trim()
    ? blockMenuActions.filter((item) => item.label.toLowerCase().includes(blockMenu.searchQuery.trim().toLowerCase()))
    : blockMenuActions;
  const menuGroups = useMemo(
    () => ({
      basic: filteredMenu.filter((item) => item.group === "basic"),
      media: filteredMenu.filter((item) => item.group === "media"),
    }),
    [filteredMenu],
  );

  const slashMenuLayout = useMemo(() => {
    if (!menu) return { left: 0, top: 0 };
    const cardWidth = Math.min(360, viewport.w - 24);
    const rowCount = Math.max(1, filteredMenu.length);
    const estimatedHeight = clamp(84 + rowCount * 40 + (menuGroups.media.length > 0 && menuGroups.basic.length > 0 ? 24 : 0), 170, 360);
    const rightSpace = viewport.w - menu.anchorX;
    const leftSpace = menu.anchorX;
    const belowSpace = viewport.h - menu.anchorY;
    const aboveSpace = menu.anchorY;

    const horizontal = rightSpace >= cardWidth + 10 || rightSpace >= leftSpace ? menu.anchorX : menu.anchorX - cardWidth;
    const vertical = belowSpace >= estimatedHeight + 10 || belowSpace >= aboveSpace ? menu.anchorY : menu.anchorY - estimatedHeight - 8;

    return {
      left: clamp(horizontal, 8, Math.max(8, viewport.w - cardWidth - 8)),
      top: clamp(vertical, 8, Math.max(8, viewport.h - estimatedHeight - 8)),
    };
  }, [filteredMenu.length, menu, menuGroups.basic.length, menuGroups.media.length, viewport.h, viewport.w]);

  const fileInsertPanelPosition = useMemo(() => {
    if (!(fileInsert.open && fileInsert.intent === "file")) {
      return { left: fileInsert.x, top: fileInsert.y };
    }
    const panelWidth = 352;
    const ghostHeight = 48;
    const ghostScreen = toScreenPoint(fileInsert.worldX, fileInsert.worldY);
    const ghostWidth = DOC_WIDTH * camera.zoom;
    const left = ghostScreen.x + (ghostWidth - panelWidth) / 2;
    const top = ghostScreen.y + ghostHeight + 10;
    return {
      left: clamp(left, 12, Math.max(12, viewport.w - panelWidth - 12)),
      top: clamp(top, 12, Math.max(12, viewport.h - 196)),
    };
  }, [camera.zoom, fileInsert.intent, fileInsert.open, fileInsert.worldX, fileInsert.worldY, fileInsert.x, fileInsert.y, toScreenPoint, viewport.h, viewport.w]);
  return (
    <main className="route-shell text-[var(--color-text)]">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptForIntent(uploadIntent)}
        className="hidden"
        onChange={(event) => {
          const chosen = Array.from(event.target.files ?? []);
          event.currentTarget.value = "";
          void uploadFilesAt(chosen, uploadAnchorRef.current.x, uploadAnchorRef.current.y, uploadIntent, uploadAfterBlockRef.current);
          uploadAfterBlockRef.current = undefined;
        }}
      />
      <input
        ref={commentFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          const names = Array.from(event.target.files ?? []).map((file) => file.name);
          event.currentTarget.value = "";
          if (!names.length) return;
          setCommentPanel((previous) => ({
            ...previous,
            attachments: Array.from(new Set([...previous.attachments, ...names])).slice(0, 6),
          }));
        }}
      />

      <div
        ref={containerRef}
        className="relative h-screen w-full overflow-hidden bg-[var(--color-surface)]"
        onPointerDown={onCanvasPointerDown}
        onWheel={handleWheel}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          const files = Array.from(event.dataTransfer.files ?? []);
          const world = worldFromClient(event.clientX, event.clientY);
          void uploadFilesAt(files, world.x, world.y);
        }}
        onContextMenu={(event) => {
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          const world = worldFromClient(event.clientX, event.clientY);
          setCanvasMenu({ open: true, x: event.clientX, y: event.clientY, worldX: world.x, worldY: world.y });
          setFileMenu({ open: false, x: 0, y: 0 });
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            transformOrigin: "top left",
          }}
        >
          {blocks.map((block) => {
            if (hiddenBlockIds.has(block.id)) return null;
            const resolvedFileUrl = block.file?.externalUrl || (block.file?.path ? signedUrls[block.file.path] : undefined);
            const indentOffset = typeof block.indent === "number" && block.indent > 0 ? block.indent * INDENT_STEP : 0;
            const latestComment = block.comments?.length ? block.comments[block.comments.length - 1] : undefined;
            const showInlineFileComment = block.type === "file" && block.file ? !isImageMime(block.file.mimeType) : false;
            return (
              <div
                key={block.id}
                className={cn(
                  "group pointer-events-auto absolute rounded-md",
                  snapAnimateBlockIds.includes(block.id) ? "transition-[left,top] duration-200 ease-out" : "",
                )}
                style={{ left: block.x + indentOffset, top: block.y, width: DOC_WIDTH - indentOffset }}
                onPointerDown={(event) => {
                  if ((event.target as HTMLElement).closest('[data-page-drag-handle="true"]')) return;
                  setSelectedBlockIds([block.id]);
                }}
              >
                <button
                  type="button"
                  aria-label="Open block menu"
                  data-page-drag-handle="true"
                  className={cn(
                    "absolute -left-9 top-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)]/55 transition hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100",
                    selectedBlockIds.includes(block.id) || (blockMenu.open && blockMenu.blockId === block.id)
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-text)] opacity-100"
                      : "opacity-45",
                  )}
                  onPointerDown={(event) => onHandlePointerDown(block, event)}
                >
                  <span className="grid grid-cols-2 gap-[2px]">
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                    <span className="h-[2px] w-[2px] rounded-full bg-current" />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Insert block"
                  className={cn(
                    "absolute -left-16 top-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)]/55 transition hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100",
                    quickInsertMenu.open && quickInsertMenu.blockId === block.id
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-text)] opacity-100"
                      : "opacity-45",
                  )}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const nextOpen = !(quickInsertMenu.open && quickInsertMenu.blockId === block.id);
                    if (!nextOpen) {
                      setQuickInsertMenu((previous) => ({ ...previous, open: false }));
                      return;
                    }
                    setSelectedBlockIds((previous) => (previous.includes(block.id) ? previous : [block.id]));
                    setMenu(null);
                    setBlockMenu((previous) => ({ ...previous, open: false, moveToQuery: "", searchQuery: "" }));
                    setCanvasMenu((previous) => ({ ...previous, open: false }));
                    setFileMenu((previous) => ({ ...previous, open: false }));
                    setQuickInsertMenu({
                      open: true,
                      blockId: block.id,
                      x: event.clientX + 10,
                      y: event.clientY + 8,
                    });
                  }}
                >
                  +
                </button>

                <div
                  style={{
                    color: block.textColor || undefined,
                    backgroundColor: block.backgroundColor || undefined,
                    borderRadius: block.backgroundColor ? 8 : undefined,
                    padding: block.backgroundColor ? "6px 8px" : undefined,
                  }}
                >
                  {block.type === "embed" && block.embed ? (
                    block.embed.url ? (
                      <div className="w-full rounded-md bg-[var(--color-surface)]/85 px-3 py-2.5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-[var(--color-text-muted)]">{block.embed.provider || block.embed.url}</p>
                          <a
                            href={block.embed.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--color-text-muted)] underline decoration-current/40 underline-offset-2"
                            onClick={(event) => event.stopPropagation()}
                          >
                            Open original
                          </a>
                        </div>
                        <div className="overflow-hidden rounded bg-black/5">
                          <iframe
                            src={block.embed.embedUrl || block.embed.url}
                            title={block.embed.title || "Embedded content"}
                            className="h-[260px] w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full rounded-md bg-[var(--color-surface)]/85 px-3 py-3">
                        <div className="flex items-center gap-2 text-[16px] text-[var(--color-text-muted)]">
                          <SlashCommandIcon id="embed" />
                          <span>Embed from a link</span>
                        </div>
                        <form
                          className="mx-auto mt-3 w-full max-w-[30rem] rounded-xl border border-[var(--color-border)]/65 bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)]"
                          onSubmit={(event) => {
                            event.preventDefault();
                            submitEmbedUrl(block.id, block.content);
                          }}
                        >
                          <input
                            ref={(node) => {
                              inputRefs.current[block.id] = node;
                            }}
                            value={block.content}
                            onChange={(event) => updateBlock(block.id, { content: event.target.value })}
                            onFocus={() => setEditingTextBlockId(block.id)}
                            onBlur={() => setEditingTextBlockId((previous) => (previous === block.id ? null : previous))}
                            placeholder="Paste in https://..."
                            className="w-full rounded-md bg-[var(--color-surface-muted)]/55 px-2.5 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/80"
                          />
                          <button type="submit" className="mt-2 w-full rounded-md bg-[#2f80ed] px-3 py-2 text-sm font-medium text-white hover:bg-[#206fd8]">
                            Create embed
                          </button>
                        </form>
                      </div>
                    )
                  ) : block.type === "bookmark" && block.bookmark ? (
                    block.bookmark.url ? (
                      <button
                        type="button"
                        className="w-full rounded-md bg-[var(--color-surface)]/85 px-3 py-2.5 text-left"
                        onClick={(event) => {
                          event.stopPropagation();
                          window.open(block.bookmark!.url, "_blank", "noopener,noreferrer");
                        }}
                      >
                        <div className="flex items-stretch gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-medium text-[var(--color-text)]">{block.bookmark.title || block.bookmark.url}</p>
                            {block.bookmark.description ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{block.bookmark.description}</p> : null}
                            <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{block.bookmark.hostname || block.bookmark.url}</p>
                          </div>
                          {block.bookmark.imageUrl ? (
                            <div className="h-[88px] w-[156px] shrink-0 overflow-hidden rounded">
                              <Image src={block.bookmark.imageUrl} alt={block.bookmark.title || "Bookmark preview"} width={312} height={176} unoptimized className="h-full w-full object-cover" />
                            </div>
                          ) : null}
                        </div>
                      </button>
                    ) : (
                      <div className="w-full rounded-md bg-[var(--color-surface)]/85 px-3 py-3">
                        <div className="flex items-center gap-2 text-[16px] text-[var(--color-text-muted)]">
                          <SlashCommandIcon id="bookmark" />
                          <span>Add a web bookmark</span>
                        </div>
                        <form
                          className="mx-auto mt-3 w-full max-w-[30rem] rounded-xl border border-[var(--color-border)]/65 bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)]"
                          onSubmit={(event) => {
                            event.preventDefault();
                            submitBookmarkUrl(block.id, block.content);
                          }}
                        >
                          <input
                            ref={(node) => {
                              inputRefs.current[block.id] = node;
                            }}
                            value={block.content}
                            onChange={(event) => updateBlock(block.id, { content: event.target.value })}
                            onFocus={() => setEditingTextBlockId(block.id)}
                            onBlur={() => setEditingTextBlockId((previous) => (previous === block.id ? null : previous))}
                            placeholder="Paste in https://..."
                            className="w-full rounded-md bg-[var(--color-surface-muted)]/55 px-2.5 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]/80"
                          />
                          <button type="submit" className="mt-2 w-full rounded-md bg-[#2f80ed] px-3 py-2 text-sm font-medium text-white hover:bg-[#206fd8]">
                            Create bookmark
                          </button>
                          <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">Create a visual bookmark from a link.</p>
                        </form>
                      </div>
                    )
                  ) : (block.type === "file" || block.type === "image" || block.type === "video" || block.type === "audio") && block.file ? (
                    <div
                      className={cn(
                        "relative rounded-md bg-[var(--color-surface)]/85 p-3",
                        showInlineFileComment ? "flex items-start justify-between gap-4 border-none" : "border border-[var(--color-border)]",
                      )}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setFileMenu({ open: true, x: event.clientX, y: event.clientY, blockId: block.id });
                        setCanvasMenu((previous) => ({ ...previous, open: false }));
                      }}
                    >
                      <div className={cn(showInlineFileComment ? "min-w-0 flex-1 pr-1" : "")}>
                        {(block.type === "image" || isImageMime(block.file.mimeType)) ? (
                          resolvedFileUrl ? (
                            <button
                              type="button"
                              className="block overflow-hidden rounded-md"
                              onClick={(event) => {
                                event.stopPropagation();
                                void openFileBlock(block);
                              }}
                            >
                              <Image src={resolvedFileUrl} alt={block.file.displayName} width={960} height={540} unoptimized className="h-auto w-full object-contain" />
                            </button>
                          ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">Loading image preview...</p>
                          )
                        ) : block.type === "video" ? (
                          resolvedFileUrl ? (
                            block.file.mimeType.startsWith("video/") || (block.file.externalUrl && inferMimeFromUrl(block.file.externalUrl).startsWith("video/")) ? (
                              <video controls preload="metadata" className="w-full rounded-md">
                                <source src={resolvedFileUrl} type={block.file.mimeType} />
                              </video>
                            ) : (
                              <iframe
                                src={resolvedFileUrl}
                                className="aspect-video w-full rounded-md bg-black/5"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                title={block.file.displayName}
                              />
                            )
                          ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">Loading video preview...</p>
                          )
                        ) : block.type === "audio" ? (
                          resolvedFileUrl ? (
                            block.file.mimeType.startsWith("audio/") || (block.file.externalUrl && inferMimeFromUrl(block.file.externalUrl).startsWith("audio/")) ? (
                              <audio controls preload="metadata" className="w-full">
                                <source src={resolvedFileUrl} type={block.file.mimeType} />
                              </audio>
                            ) : (
                              <iframe
                                src={resolvedFileUrl}
                                className="h-24 w-full rounded-md bg-black/5"
                                allow="autoplay; encrypted-media"
                                title={block.file.displayName}
                              />
                            )
                          ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">Loading audio preview...</p>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void openFileBlock(block);
                            }}
                            className="flex items-center gap-1.5 text-left"
                          >
                            <FileDocIcon />
                            <span className="text-[15px] text-[var(--color-text)]">{block.file.displayName}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{formatFileSize(block.file.size)}</span>
                          </button>
                        )}
                        {!showInlineFileComment && (
                          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                            {block.file.mimeType || "file"} - {formatFileSize(block.file.size)}
                          </p>
                        )}
                        {block.content.trim().length > 0 && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{block.content.trim()}</p>}
                      </div>
                      {showInlineFileComment && latestComment && (
                        <button
                          type="button"
                          className="min-w-[18rem] max-w-[19rem] shrink-0 rounded-xl border border-[#dedede] bg-[#f7f7f7] px-4 py-2 text-left"
                          onClick={(event) => {
                            event.stopPropagation();
                            const anchor = toScreenPoint(block.x + block.w - 40, block.y + block.h + 10);
                            openCommentPanel(block.id, anchor.x, anchor.y);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#e2e2e2] text-[11px] text-[#9a9a9a]">
                              {initialForName(latestComment.authorName || commentAuthorName)}
                            </span>
                            <span className="truncate text-sm font-semibold text-[#2f2f2f]">{latestComment.authorName || commentAuthorName}</span>
                            <span className="text-xs text-[#9f9f9f]">{relativeTimeLabel(latestComment.createdAt)}</span>
                          </div>
                          <p className="mt-1 truncate text-[15px] text-[#2f2f2f]">{latestComment.text || "Attachment"}</p>
                        </button>
                      )}
                    </div>
                  ) : (
                    renderInput(block)
                  )}
                </div>
              </div>
            );
          })}
          {dragPreview && (
            <div className="pointer-events-none absolute" style={{ left: dragPreview.x, top: dragPreview.y }}>
              {dragPreview.mode === "insert" ? (
                <div className="h-0.5 rounded-full bg-[#2f80ed]" style={{ width: dragPreview.width }} />
              ) : dragPreview.mode === "nest" ? (
                <div className="w-0.5 rounded-full bg-[#2f80ed]" style={{ height: dragPreview.height }} />
              ) : (
                <div
                  className="rounded-md border border-[#2f80ed]/80 bg-[#2f80ed]/10"
                  style={{ width: dragPreview.width, height: dragPreview.height }}
                />
              )}
            </div>
          )}
          {fileInsert.open && fileInsert.intent === "file" && (
            <div
              className="absolute rounded-xl border border-[#e1e1e1] bg-[#f1f1f1] px-4 py-3 text-[15px] text-[#6f6f6f]"
              style={{ left: fileInsert.worldX, top: fileInsert.worldY, width: DOC_WIDTH }}
            >
              <span className="inline-flex items-center gap-2">
                <UploadEmbedGhostIcon />
                <span>Upload or embed a file</span>
              </span>
            </div>
          )}
        </div>
        {menu && menuBlock && (
          <div
            className="absolute z-40 w-[min(22.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[#d8d8d8] bg-[#f9f9f9] p-0 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
            style={{
              left: slashMenuLayout.left,
              top: slashMenuLayout.top,
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onWheel={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="border-b border-[#e5e5e5] px-3.5 py-2.5 text-xs text-[#888]">Basic blocks</div>
            <div className="max-h-[18rem] overflow-y-auto px-2 py-1.5">
              {filteredMenu.length === 0 && <p className="px-2 py-1.5 text-sm text-[#8c8c8c]">No matching commands.</p>}
              {menuGroups.basic.concat(menuGroups.media).map((item) => {
                const idx = filteredMenu.findIndex((entry) => entry.id === item.id);
                return (
                  <button
                    key={`${item.id}-${item.label}`}
                    type="button"
                    onClick={() => applySlashCommand(item.id)}
                    onMouseEnter={() => setMenuIndex(idx)}
                    className={cn(
                      "mb-0.5 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[15px]",
                      idx === activeMenuIndex ? "bg-[#ececec] text-[#111]" : "text-[#2f2f2f] hover:bg-[#efefef]",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center">
                        <SlashCommandIcon id={item.id} />
                      </span>
                      <span>{item.label}</span>
                    </span>
                    <span className="text-xs text-[#949494]">{item.trigger || ""}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setMenu(null)}
              className="flex w-full items-center justify-between border-t border-[#e5e5e5] px-3.5 py-2 text-left text-[15px] text-[#2f2f2f] hover:bg-[#efefef]"
            >
              <span>Close menu</span>
              <span className="text-xs text-[#9a9a9a]">esc</span>
            </button>
          </div>
        )}

        {quickInsertMenu.open && quickInsertMenu.blockId && (
          <div
            className="fixed z-50 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-[#d8d8d8] bg-[#f9f9f9] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
            style={{
              left: clamp(quickInsertMenu.x, 8, Math.max(8, viewport.w - 328)),
              top: clamp(quickInsertMenu.y, 8, Math.max(8, viewport.h - 380)),
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#e5e5e5] px-3 py-2 text-xs text-[#888]">Insert block below</div>
            <div className="max-h-[18rem] overflow-y-auto p-1.5">
              {slashCommands.map((item) => (
                <button
                  key={`quick-insert-${item.id}`}
                  type="button"
                  className="mb-0.5 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[15px] text-[#2f2f2f] hover:bg-[#efefef]"
                  onClick={() => insertFromQuickMenu(quickInsertMenu.blockId!, item.id)}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="inline-flex h-5 min-w-5 items-center justify-center">
                      <SlashCommandIcon id={item.id} />
                    </span>
                    <span>{item.label}</span>
                  </span>
                  <span className="text-xs text-[#949494]">{item.trigger || ""}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {codeMenu.open && codeMenu.blockId && codeMenuBlock?.type === "code" && (
          <div
            data-code-menu="true"
            className="fixed z-[55] min-w-44 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-[var(--shadow-lg)]"
            style={{
              left: clamp(codeMenu.x, 8, Math.max(8, viewport.w - 220)),
              top: clamp(codeMenu.y, 8, Math.max(8, viewport.h - 160)),
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                updateCodeBlock(codeMenu.blockId!, { wrap: !(codeMenuBlock.code?.wrap ?? false) });
                setCodeMenu((previous) => ({ ...previous, open: false }));
              }}
            >
              {(codeMenuBlock.code?.wrap ?? false) ? "Disable wrap code" : "Enable wrap code"}
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                editCodeCaption(codeMenu.blockId!);
                setCodeMenu((previous) => ({ ...previous, open: false }));
              }}
            >
              Caption
            </button>
          </div>
        )}

        {fileInsert.open && (
          <div
            className="absolute z-50 w-[22rem] rounded-xl border border-[#d7d7d7] bg-[#f6f6f6] p-2 shadow-[0_14px_26px_rgba(0,0,0,0.2)]"
            style={{ left: fileInsertPanelPosition.left, top: fileInsertPanelPosition.top }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {fileInsert.intent !== "bookmark" && (
              <div className="flex items-center gap-1 rounded-lg border border-[#d9d9d9] bg-white p-1">
                {(["upload", "link"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm",
                      fileInsert.mode === tab ? "border border-[#2f80ed] bg-[#e8f1ff] text-[#1b5fc7]" : "text-[#777] hover:bg-[#f0f0f0]",
                    )}
                    onClick={() => setFileInsert((previous) => ({ ...previous, mode: tab }))}
                  >
                    {tab === "upload" ? "Upload" : "Link"}
                  </button>
                ))}
              </div>
            )}
            {fileInsert.intent !== "bookmark" && fileInsert.mode === "upload" ? (
              <div className="px-2 pb-2 pt-3">
                <button
                  type="button"
                  className="w-full rounded-md bg-[#2f80ed] px-3 py-2 text-sm font-medium text-white hover:bg-[#206fd8]"
                  onClick={() => {
                    triggerUploadPickerAt(fileInsert.worldX, fileInsert.worldY, fileInsert.intent, fileInsert.afterBlockId);
                    setFileInsert((previous) => ({ ...previous, open: false }));
                  }}
                >
                  Choose a file
                </button>
              </div>
            ) : (
              <form
                className="space-y-2 px-2 pb-2 pt-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const nextUrl = fileInsert.url.trim();
                  if (!nextUrl) return;
                  try {
                    const parsed = new URL(nextUrl);
                    createEmbedBlock(parsed.toString(), fileInsert.worldX, fileInsert.worldY, fileInsert.intent, fileInsert.afterBlockId);
                    setFileInsert((previous) => ({ ...previous, open: false, url: "" }));
                  } catch {
                    window.alert("Please paste a valid URL.");
                  }
                }}
              >
                <input
                  type="url"
                  value={fileInsert.url}
                  onChange={(event) => setFileInsert((previous) => ({ ...previous, url: event.target.value }))}
                  placeholder={fileInsert.intent === "bookmark" ? "Paste website URL" : "Paste file URL"}
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-2.5 py-2 text-sm text-[#303030] outline-none focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed]/30"
                />
                <button type="submit" className="w-full rounded-md bg-[#2f80ed] px-3 py-2 text-sm font-medium text-white hover:bg-[#206fd8]">
                  {fileInsert.intent === "bookmark" ? "Create bookmark" : "Embed link"}
                </button>
              </form>
            )}
          </div>
        )}

        {commentPanel.open && commentTargetBlock && (
          <div
            className="absolute z-[58] w-[22rem] rounded-xl border border-[#d7d7d7] bg-[#f5f5f5] p-2 shadow-[0_14px_28px_rgba(0,0,0,0.18)]"
            style={{ left: commentPanel.x, top: commentPanel.y }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="max-h-60 space-y-2 overflow-y-auto p-1">
              {(commentTargetBlock.comments ?? []).length === 0 && <p className="px-1 py-2 text-sm text-[#8b8b8b]">No comments yet.</p>}
              {(commentTargetBlock.comments ?? []).map((comment) => (
                <article key={comment.id} className="rounded-[12px] border border-[#d9d9d9] bg-[#f7f7f7] px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#dedede] text-[11px] text-[#9a9a9a]">
                        {initialForName(comment.authorName || commentAuthorName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#2e2e2e]">{comment.authorName || commentAuthorName}</p>
                      </div>
                      <span className="text-xs text-[#9d9d9d]">{relativeTimeLabel(comment.createdAt)}</span>
                    </div>
                    <button
                      type="button"
                      className="rounded px-1.5 py-0.5 text-[#8b8b8b] hover:bg-[#ececec] hover:text-[#3a3a3a]"
                      onClick={() =>
                        setCommentPanel((previous) => ({
                          ...previous,
                          menuCommentId: previous.menuCommentId === comment.id ? undefined : comment.id,
                          deleteConfirmCommentId: undefined,
                        }))
                      }
                    >
                      ...
                    </button>
                  </div>
                  <p className="mt-1 text-[15px] text-[#2b2b2b]">{comment.text || <span className="text-[#9a9a9a]">Attachment only</span>}</p>
                  {comment.attachments?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {comment.attachments.map((attachment) => (
                        <span key={attachment} className="rounded-md border border-[#d2d2d2] bg-white px-1.5 py-0.5 text-[11px] text-[#636363]">
                          {attachment}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {commentPanel.menuCommentId === comment.id && (
                    <div className="relative">
                      <div className="absolute right-0 top-1 z-[59] min-w-44 rounded-xl border border-[#d2d2d2] bg-[#efefef] p-1.5 shadow-[0_8px_18px_rgba(0,0,0,0.14)]">
                        <button
                          type="button"
                          className="block w-full rounded px-2 py-1.5 text-left text-sm text-[#333] hover:bg-[#dfdfdf]"
                          onClick={() => setCommentPanel((previous) => ({ ...previous, menuCommentId: undefined }))}
                        >
                          Mark as unread
                        </button>
                        <button
                          type="button"
                          className="mt-0.5 block w-full rounded px-2 py-1.5 text-left text-sm text-[#333] hover:bg-[#dfdfdf]"
                          onClick={() =>
                            setCommentPanel((previous) => ({
                              ...previous,
                              draft: comment.text,
                              attachments: comment.attachments ?? [],
                              menuCommentId: undefined,
                              editingCommentId: comment.id,
                            }))
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="mt-0.5 block w-full rounded px-2 py-1.5 text-left text-sm text-[#333] hover:bg-[#dfdfdf]"
                          onClick={async () => {
                            await copyBlockLink(commentTargetBlock.id);
                            setCommentPanel((previous) => ({ ...previous, menuCommentId: undefined }));
                          }}
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          className="mt-0.5 block w-full rounded px-2 py-1.5 text-left text-sm text-[#333] hover:bg-[#dfdfdf]"
                          onClick={() => setCommentPanel((previous) => ({ ...previous, menuCommentId: undefined }))}
                        >
                          Mute replies
                        </button>
                        <button
                          type="button"
                          className="mt-0.5 block w-full rounded px-2 py-1.5 text-left text-sm text-[#cc4f46] hover:bg-[#dfdfdf]"
                          onClick={() => setCommentPanel((previous) => ({ ...previous, menuCommentId: undefined, deleteConfirmCommentId: comment.id }))}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {!!commentPanel.attachments.length && (
              <div className="mt-1 flex flex-wrap gap-1 px-1">
                {commentPanel.attachments.map((attachment) => (
                  <button
                    key={attachment}
                    type="button"
                    className="rounded-md border border-[#d2d2d2] bg-white px-1.5 py-0.5 text-[11px] text-[#666]"
                    onClick={() => setCommentPanel((previous) => ({ ...previous, attachments: previous.attachments.filter((item) => item !== attachment) }))}
                  >
                    {attachment} x
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#d9d9d9] bg-white px-2 py-1.5">
              <input
                value={commentPanel.draft}
                onChange={(event) => setCommentPanel((previous) => ({ ...previous, draft: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    postComment();
                  }
                }}
                placeholder="Add a comment..."
                className="h-7 w-full bg-transparent text-sm text-[#333] outline-none placeholder:text-[#a2a2a2]"
              />
              <button
                type="button"
                className="rounded p-1 text-[#7d7d7d] hover:bg-[#f0f0f0] hover:text-[#4a4a4a]"
                onClick={() => commentFileInputRef.current?.click()}
                title="Attach file"
              >
                +
              </button>
              <button
                type="button"
                className="rounded p-1 text-[#7d7d7d] hover:bg-[#f0f0f0] hover:text-[#4a4a4a]"
                onClick={() => setCommentPanel((previous) => ({ ...previous, draft: `${previous.draft}${previous.draft.endsWith(" ") || previous.draft.length === 0 ? "" : " "}@` }))}
                title="Mention"
              >
                @
              </button>
              <button
                type="button"
                className={cn("rounded-full p-1 text-xs", canPostComment ? "bg-[#2f80ed] text-white" : "bg-[#efefef] text-[#a6a6a6]")}
                disabled={!canPostComment}
                onClick={postComment}
                title={commentPanel.editingCommentId ? "Save comment" : "Post comment"}
              >
                ^
              </button>
            </div>
          </div>
        )}

        {commentPanel.open && commentPanel.deleteConfirmCommentId && commentTargetBlock && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 px-4"
            onPointerDown={() => setCommentPanel((previous) => ({ ...previous, deleteConfirmCommentId: undefined }))}
          >
            <div
              className="w-full max-w-[22rem] rounded-2xl border border-[#cecece] bg-[#f0f0f0] p-5 text-center shadow-[0_18px_30px_rgba(0,0,0,0.25)]"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <p className="text-[1.2rem] font-semibold text-[#343434]">Would you like to delete this comment?</p>
              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-[#e06557] px-3 py-2 text-base font-semibold text-white hover:bg-[#d35749]"
                onClick={() => {
                  deleteCommentFromBlock(commentTargetBlock.id, commentPanel.deleteConfirmCommentId!);
                  setCommentPanel((previous) => ({ ...previous, deleteConfirmCommentId: undefined }));
                }}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-2 w-full rounded-lg border border-[#d4d4d4] bg-[#f3f3f3] px-3 py-2 text-base text-[#333] hover:bg-[#ececec]"
                onClick={() => setCommentPanel((previous) => ({ ...previous, deleteConfirmCommentId: undefined }))}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {canvasMenu.open && (
          <div
            className="fixed z-50 min-w-48 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-[var(--shadow-lg)]"
            style={{ left: canvasMenu.x, top: canvasMenu.y }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                triggerUploadPickerAt(canvasMenu.worldX, canvasMenu.worldY);
                setCanvasMenu((previous) => ({ ...previous, open: false }));
              }}
            >
              Upload files here
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                addTextBlockAt(canvasMenu.worldX, canvasMenu.worldY);
                setCanvasMenu((previous) => ({ ...previous, open: false }));
              }}
            >
              New text block
            </button>
          </div>
        )}

        {fileMenu.open && fileMenu.blockId && (
          <div
            className="fixed z-50 min-w-44 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-[var(--shadow-lg)]"
            style={{ left: fileMenu.x, top: fileMenu.y }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                const block = blocks.find((entry) => entry.id === fileMenu.blockId);
                if (block) void openFileBlock(block);
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Open in new tab
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                updateFileCaption(fileMenu.blockId!);
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Add caption
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                const target = blocks.find((entry) => entry.id === fileMenu.blockId!);
                if (target) {
                  const anchor = toScreenPoint(target.x + target.w * 0.35, target.y + target.h + 12);
                  openCommentPanel(target.id, anchor.x, anchor.y);
                }
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Comment
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                const block = blocks.find((entry) => entry.id === fileMenu.blockId);
                if (block) void downloadFileBlock(block);
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Download original
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                renameFileBlock(fileMenu.blockId!);
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Rename title
            </button>
            <button
              type="button"
              className="mt-0.5 block w-full rounded px-2.5 py-1.5 text-left text-sm text-[#f87171] hover:bg-[var(--color-surface-muted)]"
              onClick={() => {
                void deleteFileBlock(fileMenu.blockId!);
                setFileMenu({ open: false, x: 0, y: 0 });
              }}
            >
              Delete file
            </button>
          </div>
        )}

        {blockMenu.open && blockMenu.blockId && blockMenuBlock && (
          <div
            className="fixed z-50 w-[18rem] rounded-2xl border border-[#d7d7d7] bg-[#f7f7f7] p-2 text-[#2e2e2e] shadow-[0_12px_28px_rgba(0,0,0,0.14)]"
            style={{ left: blockMenu.x, top: blockMenu.y }}
            onPointerDown={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
          >
            <input
              value={blockMenu.searchQuery}
              onChange={(event) => setBlockMenu((previous) => ({ ...previous, searchQuery: event.target.value }))}
              className="w-full rounded-lg border border-[#4b95ef] bg-white px-2 py-1.5 text-sm outline-none ring-1 ring-[#4b95ef]/25"
              placeholder="Search actions..."
            />
            <p className="mt-3 px-1 text-xs font-medium text-[#727272]">{blockMenuBlock.type === "todo" ? "To-do list" : blockMenuBlock.type}</p>

            <details className="mt-2">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-1.5 py-1.5 text-[1rem] hover:bg-[#ececec]">
                <span>Turn into</span>
                <span className="text-[#8b8b8b]">{">"}</span>
              </summary>
              <div className="mt-1 grid grid-cols-2 gap-1 pl-1">
                {TURN_INTO_TYPES.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    disabled={blockMenuBlock.type === "file"}
                    className="rounded px-2 py-1 text-left text-xs hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-45"
                    onClick={() => {
                      if (item.type === "quote") {
                        turnSelectionIntoQuote(blockMenu.blockId!);
                      } else {
                        turnBlockInto(blockMenu.blockId!, item.type);
                      }
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </details>

            <details>
              <summary className="mt-0.5 flex cursor-pointer list-none items-center justify-between rounded-md px-1.5 py-1.5 text-[1rem] hover:bg-[#ececec]">
                <span>Color</span>
                <span className="text-[#8b8b8b]">{">"}</span>
              </summary>
              <div className="mt-1 max-h-[24rem] space-y-2 overflow-y-auto pl-1 pr-1">
                <p className="px-1 text-[11px] font-medium text-[#808080]">Text color</p>
                <div className="space-y-0.5">
                  {BLOCK_TEXT_COLORS.map((color) => (
                    <button
                      key={`text-color-${color.id}`}
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-sm text-[#2f2f2f] hover:bg-[#ececec]"
                      onClick={() => updateBlock(blockMenu.blockId!, { textColor: color.value || undefined })}
                    >
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#d7d7d7] bg-white text-[15px]"
                        style={{ color: color.preview }}
                      >
                        A
                      </span>
                      <span>{color.label}</span>
                    </button>
                  ))}
                </div>
                <p className="px-1 pt-2 text-[11px] font-medium text-[#808080]">Background color</p>
                <div className="space-y-0.5 pb-1">
                  {BLOCK_BG_COLORS.map((color) => (
                    <button
                      key={`bg-color-${color.id}`}
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-sm text-[#2f2f2f] hover:bg-[#ececec]"
                      onClick={() => updateBlock(blockMenu.blockId!, { backgroundColor: color.value || undefined })}
                    >
                      <span className="inline-flex h-6 w-6 rounded-md border border-[#d7d7d7]" style={{ backgroundColor: color.preview }} />
                      <span>{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </details>

            {blockMenuBlock.type === "numbered" && (
              <details>
                <summary className="mt-0.5 flex cursor-pointer list-none items-center justify-between rounded-md px-1.5 py-1.5 text-[1rem] hover:bg-[#ececec]">
                  <span>List options</span>
                  <span className="text-[#8b8b8b]">{">"}</span>
                </summary>
                <div className="space-y-2 px-1 pb-1">
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: "numbers", label: "1." },
                        { id: "letters", label: "a." },
                        { id: "roman", label: "i." },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          "rounded border px-2 py-1 text-xs",
                          (blockMenuBlock.numberedFormat ?? DEFAULT_NUMBERED_FORMAT) === item.id
                            ? "border-[#2f80ed] bg-[#e8f1ff] text-[#1b5fc7]"
                            : "border-[#d5d5d5] bg-white text-[#444] hover:bg-[#efefef]",
                        )}
                        onClick={() =>
                          updateBlock(blockMenu.blockId!, {
                            numberedFormat: item.id,
                          })
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <label className="block text-xs text-[#6f6f6f]">
                    Start at
                    <input
                      type="number"
                      min={1}
                      value={blockMenuBlock.numberedStart ?? 1}
                      onChange={(event) => {
                        const parsed = Number.parseInt(event.target.value, 10);
                        updateBlock(blockMenu.blockId!, {
                          numberedStart: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
                        });
                      }}
                      className="mt-1 w-full rounded border border-[#d7d7d7] bg-white px-2 py-1 text-xs outline-none"
                    />
                  </label>
                </div>
              </details>
            )}
            {blockMenuBlock.type === "code" && (
              <details>
                <summary className="mt-0.5 flex cursor-pointer list-none items-center justify-between rounded-md px-1.5 py-1.5 text-[1rem] hover:bg-[#ececec]">
                  <span>Code options</span>
                  <span className="text-[#8b8b8b]">{">"}</span>
                </summary>
                <div className="space-y-2 px-1 pb-1">
                  <label className="block text-xs text-[#6f6f6f]">
                    Language
                    <select
                      value={blockMenuBlock.code?.language ?? "Plain Text"}
                      onChange={(event) => updateCodeBlock(blockMenu.blockId!, { language: event.target.value })}
                      className="mt-1 w-full rounded border border-[#d7d7d7] bg-white px-2 py-1 text-xs outline-none"
                    >
                      {CODE_LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="w-full rounded border border-[#d7d7d7] bg-white px-2 py-1 text-left text-xs text-[#444] hover:bg-[#efefef]"
                    onClick={() => updateCodeBlock(blockMenu.blockId!, { wrap: !(blockMenuBlock.code?.wrap ?? false) })}
                  >
                    {(blockMenuBlock.code?.wrap ?? false) ? "Disable wrap code" : "Enable wrap code"}
                  </button>
                  <button
                    type="button"
                    className="w-full rounded border border-[#d7d7d7] bg-white px-2 py-1 text-left text-xs text-[#444] hover:bg-[#efefef]"
                    onClick={() => editCodeCaption(blockMenu.blockId!)}
                  >
                    Edit caption
                  </button>
                </div>
              </details>
            )}

            <div className="my-2 border-t border-[#dfdfdf]" />

            {filteredBlockMenuActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-[1rem] hover:bg-[#ececec]",
                  action.danger ? "text-[#b64040]" : "text-[#2e2e2e]",
                )}
                onClick={action.onClick}
              >
                <span>{action.label}</span>
                <span className="text-xs text-[#989898]">{action.shortcut}</span>
              </button>
            ))}

            <button
              type="button"
              disabled={blockMenuBlock.type === "file"}
              className="mt-0.5 flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-[1rem] text-[#2e2e2e] hover:bg-[#ececec] disabled:opacity-45"
              onClick={() => {
                void turnBlockIntoPage(blockMenu.blockId!);
                setBlockMenu({ open: false, x: 0, y: 0, moveToQuery: "", searchQuery: "" });
              }}
            >
              <span>Turn into page</span>
              <span className="text-xs text-[#989898]">Ctrl+Alt+P</span>
            </button>

            <details>
              <summary className="mt-0.5 flex cursor-pointer list-none items-center justify-between rounded-md px-1.5 py-1.5 text-[1rem] hover:bg-[#ececec]">
                <span>Move to</span>
                <span className="text-xs text-[#989898]">Ctrl+Shift+P</span>
              </summary>
              <div className="space-y-1 px-1 pb-1">
                <input
                  value={blockMenu.moveToQuery}
                  onChange={(event) => setBlockMenu((previous) => ({ ...previous, moveToQuery: event.target.value }))}
                  className="mt-1 w-full rounded border border-[#d7d7d7] bg-white px-2 py-1 text-xs outline-none"
                  placeholder="Search page id"
                />
                <div className="max-h-24 space-y-0.5 overflow-auto">
                  {availableDocIds
                    .filter((id) => id.includes(blockMenu.moveToQuery.trim()))
                    .slice(0, 6)
                    .map((id) => (
                      <button
                        key={id}
                        type="button"
                        className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-[#ececec]"
                        onClick={() => {
                          const targets = selectedBlockIds.includes(blockMenu.blockId!) ? selectedBlockIds : [blockMenu.blockId!];
                          void moveBlocksToDoc(id, targets);
                          setBlockMenu({ open: false, x: 0, y: 0, moveToQuery: "", searchQuery: "" });
                        }}
                      >
                        {id}
                      </button>
                    ))}
                </div>
              </div>
            </details>

            <button
              type="button"
              className="mt-0.5 flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-[1rem] hover:bg-[#ececec]"
              onClick={() => {
                const target = blocks.find((entry) => entry.id === blockMenu.blockId!);
                if (target) {
                  const anchor = toScreenPoint(target.x + target.w * 0.35, target.y + target.h + 12);
                  openCommentPanel(target.id, anchor.x, anchor.y);
                }
                setBlockMenu({ open: false, x: 0, y: 0, moveToQuery: "", searchQuery: "" });
              }}
            >
              <span>Comment</span>
              <span className="text-xs text-[#989898]">Ctrl+Shift+M</span>
            </button>
            <div className="mt-2 border-t border-[#dfdfdf] pt-2 text-[11px] text-[#8d8d8d]">
              <p>Last edited in this page</p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="pointer-events-none fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]">
            Uploading files...
          </div>
        )}
      </div>
    </main>
  );
}

