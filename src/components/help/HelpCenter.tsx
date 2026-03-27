"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  getHelpArticleById,
  getHelpArticleHref,
  getHelpArticlesForCategory,
  getRelatedHelpArticles,
  helpArticles,
  helpCategories,
  searchHelpArticles,
  wallShortcutRows,
  type HelpArticle,
  type HelpCategoryId,
} from "@/features/help/content";

const categoryAccent: Record<HelpCategoryId, string> = {
  "getting-started": "text-[#a33818]",
  workflows: "text-[#4d6356]",
  troubleshooting: "text-[#755717]",
  account: "text-[#6a5a74]",
};

export const HelpCenter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  const articleId = searchParams.get("article");
  const selectedArticle = getHelpArticleById(articleId);
  const filteredArticles = useMemo(() => searchHelpArticles(query), [query]);
  const featuredArticles = useMemo(() => helpArticles.slice(0, 6), []);

  const setArticle = (nextArticleId?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextArticleId) {
      params.set("article", nextArticleId);
    } else {
      params.delete("article");
    }
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#1c1c19]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.22]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_-8%,rgba(234,214,188,0.52),transparent_28%),radial-gradient(circle_at_88%_6%,rgba(239,231,216,0.78),transparent_24%),linear-gradient(180deg,#fdfaf6_0%,#fcf9f4_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(223,192,184,0.68)_0.8px,transparent_0.8px)] bg-[length:38px_38px]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-[#eee2d5]/80 bg-[rgba(252,249,244,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link href="/wall" className="font-[Newsreader] text-[2rem] italic leading-none text-[#1c1c19] no-underline">
              Agy
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link href="/wall" className="text-sm font-medium text-[#5f554d] no-underline transition hover:text-[#a33818]">
                Wall
              </Link>
              <Link href="/decks" className="text-sm font-medium text-[#5f554d] no-underline transition hover:text-[#a33818]">
                Decks
              </Link>
              <Link href="/page" className="text-sm font-medium text-[#5f554d] no-underline transition hover:text-[#a33818]">
                Page
              </Link>
              <Link href="/settings" className="text-sm font-medium text-[#5f554d] no-underline transition hover:text-[#a33818]">
                Settings
              </Link>
            </nav>
          </div>
          <Link
            href="/wall"
            className="rounded-full border border-[#e7d9cc] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6359] no-underline transition hover:border-[#d8c5b5] hover:text-[#1c1c19]"
          >
            Return to wall
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[92rem] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[16rem_minmax(0,1fr)_19rem] lg:py-10">
        <aside className="h-fit rounded-[30px] bg-white/58 p-5 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.26)] backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b7f73]">Browse</p>
          <button
            type="button"
            onClick={() => setArticle(undefined)}
            className={`mt-4 block w-full rounded-[20px] px-4 py-3 text-left transition ${!selectedArticle ? "bg-[#f4ede4] text-[#1c1c19]" : "text-[#62584f] hover:bg-white/76"}`}
          >
            <span className="block text-sm font-semibold">Overview</span>
            <span className="mt-1 block text-xs leading-5 text-[#8a7d71]">Featured help topics and common entry points.</span>
          </button>

          <div className="mt-5 space-y-5">
            {helpCategories.map((category) => (
              <div key={category.id}>
                <button
                  type="button"
                  onClick={() => setArticle(getHelpArticlesForCategory(category.id)[0]?.id)}
                  className="block w-full text-left"
                >
                  <span className="block text-sm font-semibold text-[#1c1c19]">{category.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#887c70]">{category.description}</span>
                </button>
                <div className="mt-2 space-y-1">
                  {getHelpArticlesForCategory(category.id).map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => setArticle(article.id)}
                      className={`block w-full rounded-[16px] px-3 py-2 text-left text-sm transition ${
                        selectedArticle?.id === article.id ? "bg-[#f4ede4] text-[#1c1c19]" : "text-[#675d55] hover:bg-white/74"
                      }`}
                    >
                      {article.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="min-w-0">
          <section className="rounded-[34px] bg-white/62 px-6 py-8 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.22)] backdrop-blur sm:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a33818]">Help Library</p>
              <h1 className="mt-4 font-[Newsreader] text-[3.6rem] italic leading-none text-[#1c1c19] sm:text-[4.5rem]">How can we help?</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#72675d]">
                A hybrid help system for quick answers, task guidance, and recovery paths across the product.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-2xl rounded-full bg-white/90 px-5 py-4 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.38)]">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search help topics, workflows, settings, and recovery"
                className="w-full border-none bg-transparent text-base text-[#1c1c19] outline-none placeholder:text-[#97897c]"
                aria-label="Search help library"
              />
            </div>
          </section>

          {selectedArticle ? (
            <ArticleDetail article={selectedArticle} />
          ) : (
            <section className="mt-8 space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {(query ? filteredArticles : featuredArticles).map((article) => (
                  <Link
                    key={article.id}
                    href={getHelpArticleHref(article.id)}
                    className="rounded-[30px] bg-white/76 p-6 text-inherit no-underline shadow-[inset_0_0_0_1px_rgba(223,192,184,0.24)] transition hover:bg-white hover:shadow-[0_18px_40px_rgba(28,28,25,0.08)]"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b7f73]">
                      {helpCategories.find((category) => category.id === article.category)?.label}
                    </p>
                    <h2 className="mt-3 font-[Newsreader] text-[2rem] italic leading-tight text-[#1c1c19]">{article.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-[#665c54]">{article.summary}</p>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a33818]">{article.readTime}</p>
                  </Link>
                ))}
              </div>

              {query && filteredArticles.length === 0 ? (
                <div className="rounded-[30px] bg-white/74 p-6 text-sm text-[#665c54] shadow-[inset_0_0_0_1px_rgba(223,192,184,0.22)]">
                  No matching help articles yet. Try broader wording like <span className="font-semibold">search</span>, <span className="font-semibold">export</span>, <span className="font-semibold">sync</span>, or <span className="font-semibold">settings</span>.
                </div>
              ) : null}
            </section>
          )}
        </main>

        <aside className="space-y-5">
          <div className="rounded-[30px] bg-white/62 p-5 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.24)] backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b7f73]">Top routes</p>
            <div className="mt-4 grid gap-2">
              {[
                { href: "/wall", label: "Wall workspace" },
                { href: "/page", label: "Page editor" },
                { href: "/decks", label: "Decks" },
                { href: "/settings", label: "Settings" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[18px] bg-[#fcf8f2] px-4 py-3 text-sm font-medium text-[#1c1c19] no-underline shadow-[inset_0_0_0_1px_rgba(223,192,184,0.22)] transition hover:bg-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] bg-white/62 p-5 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.24)] backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b7f73]">Shortcut sampler</p>
            <div className="mt-4 space-y-2">
              {wallShortcutRows.slice(0, 6).map(([combo, label]) => (
                <div key={combo} className="rounded-[18px] bg-[#fcf8f2] px-4 py-3 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.22)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f7368]">{combo}</p>
                  <p className="mt-1 text-sm text-[#1c1c19]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const ArticleDetail = ({ article }: { article: HelpArticle }) => (
  <article className="mt-8 rounded-[34px] bg-white/74 px-6 py-8 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.22)] backdrop-blur sm:px-10">
    <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${categoryAccent[article.category]}`}>
      {article.readTime} · {helpCategories.find((category) => category.id === article.category)?.label}
    </p>
    <h2 className="mt-4 max-w-4xl font-[Newsreader] text-[3.4rem] italic leading-none text-[#1c1c19]">{article.title}</h2>
    <p className="mt-5 max-w-3xl text-lg leading-8 text-[#665d54]">{article.summary}</p>

    <div className="mt-8 grid gap-6">
      {article.sections.map((section) => (
        <section key={section.title} className="rounded-[28px] bg-[#f8f2ea]/72 p-6 shadow-[inset_0_0_0_1px_rgba(223,192,184,0.22)]">
          <h3 className="font-[Newsreader] text-[2rem] italic text-[#1c1c19]">{section.title}</h3>
          {(section.paragraphs ?? []).map((paragraph) => (
            <p key={paragraph} className="mt-3 max-w-3xl text-base leading-8 text-[#5f564e]">
              {paragraph}
            </p>
          ))}
          {section.bullets ? (
            <ul className="mt-4 space-y-3 text-base leading-8 text-[#5f564e]">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a33818]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>

    {article.actions?.length ? (
      <div className="mt-8 flex flex-wrap gap-3">
        {article.actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-full bg-[#a33818] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white no-underline transition hover:bg-[#8e2f12]"
          >
            {action.label}
          </Link>
        ))}
      </div>
    ) : null}

    {getRelatedHelpArticles(article).length ? (
      <div className="mt-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b7f73]">Related reading</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {getRelatedHelpArticles(article).map((related) => (
            <Link
              key={related.id}
              href={getHelpArticleHref(related.id)}
              className="rounded-[24px] bg-[#fcf8f2] p-5 text-inherit no-underline shadow-[inset_0_0_0_1px_rgba(223,192,184,0.22)] transition hover:bg-white"
            >
              <h4 className="font-[Newsreader] text-[1.8rem] italic leading-tight text-[#1c1c19]">{related.title}</h4>
              <p className="mt-2 text-sm leading-6 text-[#675d54]">{related.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    ) : null}
  </article>
);
