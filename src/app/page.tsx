import Link from "next/link";

export default function Home() {
  return (
    <main className="route-shell text-[var(--color-text)]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-12 pt-6 sm:px-8 sm:pt-8">
        <header className="flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-panel)]">
          <p className="text-sm font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">Idea-Wall</p>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-[var(--radius-md)] bg-[var(--color-accent-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-foreground)] transition hover:bg-[var(--color-accent)]"
            >
              Create account
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:py-10">
          <div className="motion-fade-in">
            <p className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
              Spatial Thinking Studio
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-black tracking-tight sm:text-5xl lg:text-6xl">
              Turn scattered notes into a connected map you can navigate.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
              Capture ideas fast, cluster and link them on an infinite canvas, then export your work as polished snapshots
              or markdown. Local-first by default, cloud sync when you sign in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/wall"
                className="rounded-[var(--radius-lg)] bg-[var(--color-accent-strong)] px-5 py-3 text-sm font-semibold text-[var(--color-accent-foreground)] shadow-[var(--shadow-md)] transition hover:bg-[var(--color-accent)]"
              >
                Open Wall
              </Link>
              <a
                href="#features"
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface)]"
              >
                Explore Features
              </a>
            </div>
          </div>

          <aside className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-4 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)] motion-panel-enter sm:p-5">
            <h2 className="text-lg font-semibold">Studio Rhythm</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
              <li className="rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-2">Capture notes with `N` or quick capture.</li>
              <li className="rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-2">Shape structure with tags, zones, and links.</li>
              <li className="rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-2">Review timeline changes and export when ready.</li>
            </ul>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Mobile layout keeps actions at the top and content cards stacked for fast thumb access.
            </p>
          </aside>
        </div>

        <div id="features" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Capture", "Create, edit, and tag notes in seconds with keyboard-first commands."],
            ["Organize", "Pan, zoom, group, align, and distribute across an infinite spatial layout."],
            ["Reflect", "Export PNG, PDF, markdown, or publish read-only snapshots."],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-4 shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)]"
            >
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)]">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
