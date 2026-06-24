import Link from "next/link";

const noteTypeCards = [
  {
    title: "Journal Notes",
    body: "Long-form writing with a calm editorial rhythm for working through an idea instead of filing it away.",
    accent: "bg-[color:rgb(163_56_24_/_0.08)] text-[#a33818]",
    tags: ["Manuscript", "Reflection"],
  },
  {
    title: "Visual Anchors",
    body: "Images, sketches, and reference fragments stay embedded in the same spatial field as the thoughts they support.",
    accent: "bg-[color:rgb(117_87_23_/_0.12)] text-[#755717]",
    tags: ["Image", "Reference"],
  },
  {
    title: "Bookmark Objects",
    body: "Web findings become collectible surfaces with context, not a graveyard of plain links.",
    accent: "bg-[color:rgb(77_99_86_/_0.14)] text-[#4d6356]",
    tags: ["Preview", "Capture"],
  },
];

const synthesisCards = [
  {
    title: "Pattern recognition",
    body: "Recall related fragments from prior sessions while you are still shaping the current cluster.",
  },
  {
    title: "Visual chronology",
    body: "Track when an idea changed without leaving the spatial surface where it was formed.",
  },
];

const privacyFacts = ["Local-first storage", "Password-protected notes", "Private by default posture"];

export default function Home() {
  return (
    <main className="route-shell overflow-x-hidden text-[var(--foreground)]">
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 rounded-full bg-[var(--color-surface-glass)] px-4 py-2 shadow-[var(--shadow-sm)] ring-1 ring-[var(--color-border-muted)] backdrop-blur-[20px] sm:px-6">
          <div className="font-display text-2xl italic tracking-tight text-[#a33818]">Agy</div>
          <nav className="hidden items-center gap-7 md:flex">
            {[
              ["Atelier", "#hero"],
              ["Structure", "#structure"],
              ["Privacy", "#privacy"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="font-display text-base italic tracking-tight text-[var(--color-text-muted)] transition-colors hover:text-[#a33818]"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition hover:bg-black/5"
            >
              Sign in
            </Link>
            <Link
              href="/wall"
              className="rounded-full bg-[#a33818] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_rgba(163,56,24,0.22)] transition hover:translate-y-[1px] hover:bg-[#8f2f13]"
            >
              Enter Wall
            </Link>
          </div>
        </header>

        <div id="hero" className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-4xl space-y-8 bg-[radial-gradient(circle_at_50%_50%,rgb(163_56_24_/_0.03)_0%,transparent_70%)] py-20 text-center motion-fade-in">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4d6356]">The Digital Atelier for Thought</p>
            <h1 className="font-display mt-6 text-5xl font-medium italic leading-none tracking-[-0.04em] text-[var(--foreground)] sm:text-7xl lg:text-[6.4rem]">
              A wall for collecting,
              <br />
              shaping, and connecting ideas.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">
              Agy is a local-first spatial workspace. Capture notes, cluster related fragments, layer media, and keep your
              thinking visible long enough for structure to emerge.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/wall"
                className="rounded-full bg-[#a33818] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(163,56,24,0.22)] transition hover:-translate-y-0.5 hover:bg-[#8f2f13]"
              >
                Enter the Wall
              </Link>
              <Link
                href="/decks"
                className="rounded-full bg-[var(--color-surface-glass)] px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] ring-1 ring-[var(--color-border-muted)] backdrop-blur-[14px] transition hover:bg-[var(--color-surface)]"
              >
                Open Decks
              </Link>
            </div>
          </div>

          <div className="relative mt-16 h-[34rem] overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,rgb(255_219_166_/_0.42),rgb(250_236_208_/_0.75)_44%,rgb(250_243_232_/_0.92))] shadow-[var(--shadow-md)] sm:h-[40rem]">
            <div className="absolute left-[8%] top-[16%] w-52 rotate-[-7deg] rounded-[0.9rem] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:w-60">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a33818]">Journal</p>
              <h2 className="font-display mt-3 text-xl italic text-[var(--foreground)]">Leaving Earth</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
                What would it look like to leave a planet? The note stays near the questions, not buried in a file tree.
              </p>
            </div>
            <div className="absolute left-1/2 top-[28%] z-10 w-64 -translate-x-1/2 rounded-[1rem] bg-[var(--color-surface-glass)] p-5 shadow-[var(--shadow-md)] ring-1 ring-white/30 backdrop-blur-[18px] sm:w-80">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4d6356]">
                <span>Bookmark</span>
                <span>Linked</span>
              </div>
              <h3 className="font-display mt-6 text-[1.75rem] leading-8 text-[var(--foreground)]">The Geometry of Perception</h3>
              <div className="mt-6 flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#a33818]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#4d6356]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#755717]" />
              </div>
            </div>
            <div className="absolute bottom-[8%] right-[9%] w-60 rotate-[7deg] overflow-hidden rounded-[1rem] bg-[var(--color-surface-muted)] shadow-[var(--shadow-md)] sm:w-72">
              <div className="h-40 bg-[linear-gradient(145deg,#f6eedf,#d8c6a2_48%,#7f6342_49%,#f6eedf_63%)]" />
              <div className="p-5">
                <h3 className="font-display text-xl italic text-[var(--foreground)]">Synthesis Phase 01</h3>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4d6356]">Draft cluster</p>
                <div className="mt-5 space-y-2">
                  <div className="h-1.5 rounded-full bg-black/10" />
                  <div className="h-1.5 w-5/6 rounded-full bg-black/10" />
                </div>
              </div>
            </div>
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-35" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">
              <path d="M250 250 C 440 280, 420 360, 600 340" fill="none" stroke="#a33818" strokeDasharray="5 7" strokeWidth="2" />
              <path d="M620 400 C 760 430, 850 520, 1010 500" fill="none" stroke="#4d6356" strokeDasharray="5 7" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </section>

      <section id="structure" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4d6356]">Spatial organization</p>
            <h2 className="font-display mt-5 text-4xl italic leading-tight text-[var(--foreground)] sm:text-5xl">
              Ideas live in relationship,
              <br />
              not in a vertical stack.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--color-text-muted)]">
              Agy turns arrangement into a thinking tool. Notes can sit near evidence, drift into thematic groups, and keep
              a visible memory of how a concept took shape.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.6rem] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)]">
              <h3 className="font-display text-2xl italic text-[var(--foreground)]">Infinite panning</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                Hold context while moving across large idea fields without flattening your work into folders.
              </p>
            </article>
            <article className="translate-y-8 rounded-[1.6rem] bg-[color:rgb(163_56_24_/_0.08)] p-8 shadow-[var(--shadow-sm)] sm:mt-10">
              <h3 className="font-display text-2xl italic text-[#a33818]">Contextual clusters</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                Move fragments until the composition reveals structure, tension, and synthesis.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#755717]">The anatomy of a thought</p>
          <h2 className="font-display mt-5 text-4xl italic text-[var(--foreground)] sm:text-5xl">
            Diverse note types,
            <br />
            one coherent surface.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {noteTypeCards.map((card, index) => (
            <article
              key={card.title}
              className={`rounded-[1.7rem] p-8 shadow-[var(--shadow-sm)] ${
                index === 1 ? "bg-[var(--color-surface-muted)]" : index === 2 ? "bg-[#4d6356] text-white" : "bg-[var(--color-surface)]"
              }`}
            >
              <div className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${index === 2 ? "bg-white/12 text-white" : card.accent}`}>
                {card.tags[0]}
              </div>
              <h3 className={`font-display mt-6 text-3xl italic ${index === 2 ? "text-white" : "text-[var(--foreground)]"}`}>{card.title}</h3>
              <p className={`mt-4 text-sm leading-7 ${index === 2 ? "text-white/78" : "text-[var(--color-text-muted)]"}`}>{card.body}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      index === 2 ? "bg-white/10 text-white" : "bg-black/5 text-[var(--color-text-muted)]"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[color:rgb(246_243_238_/_0.9)] py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:items-center">
          <div className="relative mx-auto flex h-[22rem] w-full max-w-md items-center justify-center rounded-[2rem] bg-[var(--background)] shadow-[inset_0_0_0_1px_rgb(163_56_24_/_0.06)]">
            <div className="absolute inset-8 rounded-[1.8rem] border border-[rgb(163_56_24_/_0.12)]" />
            <div className="absolute inset-16 rounded-[1.8rem] border border-[rgb(163_56_24_/_0.18)]" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-[#a33818] shadow-[0_18px_34px_rgba(163,56,24,0.24)]">
              <span className="text-xl text-white">o</span>
            </div>
            <div className="absolute left-6 top-8 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4d6356] shadow-[var(--shadow-sm)]">
              Pattern detected
            </div>
            <div className="absolute bottom-8 right-6 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a33818] shadow-[var(--shadow-sm)]">
              Spatial link
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4d6356]">Synthesis and recall</p>
            <h2 className="font-display mt-5 text-4xl italic leading-tight text-[var(--foreground)] sm:text-5xl">
              Surface the right fragment
              <br />
              while the idea is still warm.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--color-text-muted)]">
              The wall is built for accumulation, but also for return. Search, recall, and timeline views keep old notes
              accessible without flattening the spatial context that made them useful.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {synthesisCards.map((card, index) => (
                <article key={card.title} className="rounded-[1.4rem] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
                  <p className={`text-sm font-semibold ${index === 0 ? "text-[#a33818]" : "text-[#4d6356]"}`}>
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </p>
                  <h3 className="font-display mt-3 text-2xl italic text-[var(--foreground)]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4d6356]">Local-first privacy</p>
        <h2 className="font-display mt-5 text-4xl italic text-[var(--foreground)] sm:text-5xl">
          Your notes belong to you.
          <br />
          The tool should reflect that.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--color-text-muted)]">
          Agy is designed around ownership. Notes live on your device, private notes can be locked, and the product stays
          focused on thought work instead of extracting your attention.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {privacyFacts.map((fact) => (
            <span key={fact} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a33818]" />
              {fact}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#a33818_0%,#8f2f13_55%,#6b2412_100%)] px-6 py-16 text-center text-white shadow-[var(--shadow-lg)] sm:px-10 sm:py-20">
          <div className="absolute inset-x-[-10%] top-[-50%] h-56 rounded-full bg-white/10 blur-[120px]" />
          <div className="relative">
            <h2 className="font-display text-4xl italic sm:text-6xl">The canvas is waiting.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
              Open the wall, capture the next fragment, and let the spatial structure emerge from the work itself.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/wall"
                className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgb(252_244_231)]"
              >
                Enter the Wall
              </Link>
              <Link href="/signup" className="rounded-full bg-white/12 px-7 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/18">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
