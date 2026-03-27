"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  getHelpArticleHref,
  getRelatedHelpArticles,
  helpArticles,
  helpCategories,
  searchHelpArticles,
  type HelpArticle,
  type HelpCategoryId,
} from "@/features/help/content";

type QuickHelpDialogProps = {
  open: boolean;
  onClose: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
  onReplayTour: () => void;
};

const categoryAccent: Record<HelpCategoryId, string> = {
  "getting-started": "text-[#a33818]",
  workflows: "text-[#4d6356]",
  troubleshooting: "text-[#755717]",
  account: "text-[#6a5a74]",
};

export const QuickHelpDialog = ({
  open,
  onClose,
  onOpenShortcuts,
  onOpenSettings,
  onReplayTour,
}: QuickHelpDialogProps) => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<HelpCategoryId | "all">("all");
  const [selectedArticleId, setSelectedArticleId] = useState<string>(helpArticles[0]?.id ?? "");

  const visibleArticles = useMemo(() => {
    const matches = searchHelpArticles(query, "wall");
    if (activeCategory === "all") {
      return matches;
    }
    return matches.filter((article) => article.category === activeCategory);
  }, [activeCategory, query]);

  const selectedArticle = useMemo<HelpArticle | undefined>(() => {
    const current = visibleArticles.find((article) => article.id === selectedArticleId);
    return current ?? visibleArticles[0];
  }, [selectedArticleId, visibleArticles]);

  const featuredArticles = useMemo(() => helpArticles.filter((article) => article.contexts.includes("wall")).slice(0, 4), []);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClassName="max-w-7xl"
      panelClassName="overflow-hidden border-[#e9dfd2] bg-[rgba(252,249,244,0.98)] p-0 shadow-[0_40px_90px_rgba(28,28,25,0.16)]"
      contentClassName="mt-0"
      showCloseButton
      closeLabel="Close"
    >
      <div className="grid max-h-[82vh] min-h-[42rem] lg:grid-cols-[15rem_minmax(0,1fr)_19rem]">
        <aside className="border-b border-[#efe5da] bg-[#f8f2ea]/80 px-5 py-6 lg:border-b-0 lg:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b7f73]">Help Center</p>
          <h2 className="mt-4 font-[Newsreader] text-[2rem] italic leading-none text-[#1c1c19]">Quick answers while you work.</h2>
          <p className="mt-3 text-sm leading-6 text-[#64594f]">
            Search task guidance, troubleshooting, and workflow references without leaving the wall.
          </p>

          <div className="mt-7 space-y-2">
            <CategoryButton
              active={activeCategory === "all"}
              label="All topics"
              description="Browse every quick-help article."
              onClick={() => setActiveCategory("all")}
            />
            {helpCategories.map((category) => (
              <CategoryButton
                key={category.id}
                active={activeCategory === category.id}
                label={category.label}
                description={category.description}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>

          <div className="mt-7 rounded-[24px] bg-white/78 p-4 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.32)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b7f73]">Quick Actions</p>
            <div className="mt-3 grid gap-2">
              <Button variant="secondary" size="sm" className="justify-start border-[#e8dccf] bg-[#fcf8f2] text-[#1c1c19]" onClick={onReplayTour}>
                Replay tour
              </Button>
              <Button variant="secondary" size="sm" className="justify-start border-[#e8dccf] bg-[#fcf8f2] text-[#1c1c19]" onClick={onOpenShortcuts}>
                Open shortcuts
              </Button>
              <Button variant="secondary" size="sm" className="justify-start border-[#e8dccf] bg-[#fcf8f2] text-[#1c1c19]" onClick={onOpenSettings}>
                Open settings
              </Button>
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col border-b border-[#efe5da] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#efe5da] px-6 pb-5 pt-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a33818]">Self-Serve Support</p>
              <h3 className="mt-3 font-[Newsreader] text-[2.8rem] italic leading-none text-[#1c1c19]">How can we help?</h3>
              <p className="mt-3 text-sm text-[#7a6f64]">Browse wall-first guidance now, then jump into the full library when you need more depth.</p>
            </div>
            <div className="mx-auto mt-6 max-w-2xl rounded-full bg-white/88 px-5 py-3 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.38)]">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search help topics, recovery steps, or workflows"
                className="w-full border-none bg-transparent text-sm text-[#1c1c19] outline-none placeholder:text-[#94877a]"
                aria-label="Search help topics"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {!query ? (
              <section>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b7f73]">Featured</p>
                    <p className="mt-1 text-sm text-[#685d53]">High-value answers for common wall questions.</p>
                  </div>
                  <Link
                    href="/help"
                    onClick={onClose}
                    className="rounded-full bg-[#a33818] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white no-underline transition hover:bg-[#8e2f12]"
                  >
                    Open full library
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {featuredArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      selected={selectedArticle?.id === article.id}
                      onClick={() => setSelectedArticleId(article.id)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className={query ? "" : "mt-7"}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b7f73]">
                    {query ? "Search results" : activeCategory === "all" ? "Browse all" : helpCategories.find((category) => category.id === activeCategory)?.label}
                  </p>
                  <p className="mt-1 text-sm text-[#685d53]">
                    {visibleArticles.length === 0 ? "No quick-help matches in the current scope." : `${visibleArticles.length} article${visibleArticles.length === 1 ? "" : "s"} available.`}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {visibleArticles.map((article) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    selected={selectedArticle?.id === article.id}
                    onClick={() => setSelectedArticleId(article.id)}
                  />
                ))}
              </div>
            </section>
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto px-5 py-6">
          {selectedArticle ? (
            <>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${categoryAccent[selectedArticle.category]}`}>
                {helpCategories.find((category) => category.id === selectedArticle.category)?.label}
              </p>
              <h3 className="mt-3 font-[Newsreader] text-[2.1rem] italic leading-tight text-[#1c1c19]">{selectedArticle.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#655b51]">{selectedArticle.summary}</p>

              <div className="mt-5 space-y-5">
                {selectedArticle.sections.slice(0, 2).map((section) => (
                  <div key={section.title} className="rounded-[24px] bg-[#f8f2ea]/72 p-4 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.22)]">
                    <h4 className="font-[Newsreader] text-xl italic text-[#1c1c19]">{section.title}</h4>
                    {(section.paragraphs ?? []).map((paragraph) => (
                      <p key={paragraph} className="mt-2 text-sm leading-6 text-[#5f564e]">
                        {paragraph}
                      </p>
                    ))}
                    {section.bullets ? (
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5f564e]">
                        {section.bullets.slice(0, 4).map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a33818]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <Link
                  href={getHelpArticleHref(selectedArticle.id)}
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#a33818] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white no-underline transition hover:bg-[#8e2f12]"
                >
                  Read full article
                </Link>
                {selectedArticle.id === "keyboard-shortcuts" ? (
                  <Button variant="secondary" size="sm" className="w-full border-[#e8dccf] bg-[#fcf8f2] text-[#1c1c19]" onClick={onOpenShortcuts}>
                    Open shortcuts modal
                  </Button>
                ) : null}
              </div>

              {getRelatedHelpArticles(selectedArticle).length > 0 ? (
                <div className="mt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b7f73]">Related</p>
                  <div className="mt-3 space-y-2">
                    {getRelatedHelpArticles(selectedArticle).map((related) => (
                      <button
                        key={related.id}
                        type="button"
                        onClick={() => setSelectedArticleId(related.id)}
                        className="block w-full rounded-[18px] bg-white/78 px-4 py-3 text-left shadow-[inset_0_0_0_1px_rgba(223,192,184,0.28)] transition hover:bg-white"
                      >
                        <span className="block text-sm font-semibold text-[#1c1c19]">{related.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#6d6258]">{related.summary}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-[#6d6258]">Select a help topic to preview it here.</p>
          )}
        </aside>
      </div>
    </ModalShell>
  );
};

const CategoryButton = ({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`block w-full rounded-[20px] px-4 py-3 text-left transition ${
      active ? "bg-white text-[#1c1c19] shadow-[0_12px_30px_rgba(28,28,25,0.08)]" : "text-[#665d55] hover:bg-white/68"
    }`}
  >
    <span className="block text-sm font-semibold">{label}</span>
    <span className="mt-1 block text-xs leading-5 text-[#8a7d71]">{description}</span>
  </button>
);

const ArticleCard = ({
  article,
  selected,
  onClick,
}: {
  article: HelpArticle;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-[28px] p-5 text-left transition ${
      selected
        ? "bg-[#f6efe6] shadow-[0_20px_40px_rgba(28,28,25,0.08)]"
        : "bg-white/74 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.24)] hover:bg-white"
    }`}
  >
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a33818]">{article.readTime}</p>
    <h4 className="mt-3 font-[Newsreader] text-[1.8rem] italic leading-tight text-[#1c1c19]">{article.title}</h4>
    <p className="mt-3 text-sm leading-6 text-[#625850]">{article.summary}</p>
  </button>
);

const ArticleRow = ({
  article,
  selected,
  onClick,
}: {
  article: HelpArticle;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`block w-full rounded-[24px] px-4 py-4 text-left transition ${
      selected ? "bg-[#f4ede4]" : "bg-white/70 hover:bg-white"
    } shadow-[inset_0_0_0_1px_rgba(223,192,184,0.25)]`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b7f73]">{article.readTime}</p>
        <h4 className="mt-2 font-[Newsreader] text-[1.55rem] italic leading-tight text-[#1c1c19]">{article.title}</h4>
      </div>
      <span className="rounded-full bg-[#fcf8f2] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b6f64]">
        {helpCategories.find((category) => category.id === article.category)?.label}
      </span>
    </div>
    <p className="mt-3 text-sm leading-6 text-[#625850]">{article.summary}</p>
  </button>
);
