import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(120deg,#f8efe0_0%,#f2f6e7_50%,#e9f0f8_100%)] text-zinc-900">
      <div className="pointer-events-none absolute -left-16 top-20 h-72 w-72 rounded-full bg-amber-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-12 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl" />

      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-14 md:px-10">
        <p className="mb-5 inline-block w-fit rounded-full border border-zinc-300/70 bg-white/65 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-zinc-700 uppercase">
          Spatial Thinking Canvas
        </p>

        <h1 className="max-w-4xl text-5xl leading-[1.06] font-black tracking-tight text-zinc-900 md:text-7xl">
          Idea-Wall turns scattered thoughts into a living map.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700 md:text-xl">
          Capture ideas as sticky notes, drag them into patterns, search instantly, cluster by proximity,
          and export snapshots or markdown reflections. Everything stays local-first in your browser.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/wall"
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Open Wall
          </Link>
          <a
            href="#features"
            className="rounded-xl border border-zinc-400/70 bg-white/80 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-white"
          >
            See Features
          </a>
        </div>

        <div id="features" className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            ["Capture", "Create and edit notes in seconds with keyboard-first shortcuts."],
            ["Organize", "Pan, zoom, resize, color, and group ideas across an infinite wall."],
            ["Reflect", "Export PNG snapshots and markdown summaries for review."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-zinc-300/60 bg-white/70 p-5 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-700">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
