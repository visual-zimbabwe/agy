import { NextResponse } from "next/server";

type PoetryDbResponse = Array<{
  title?: string;
  author?: string;
  lines?: string[];
  linecount?: string;
}>;

const clean = (value?: string | null) => value?.trim() || undefined;

export async function GET() {
  try {
    const response = await fetch("https://poetrydb.org/random/1/title,author,lines,linecount.json", { cache: "no-store" });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return NextResponse.json({ error: body || `PoetryDB request failed with ${response.status}` }, { status: response.status });
    }

    const payload = (await response.json()) as PoetryDbResponse;
    const poem = payload[0];
    if (!poem || !Array.isArray(poem.lines) || poem.lines.length === 0) {
      return NextResponse.json({ error: "PoetryDB did not include a usable poem" }, { status: 502 });
    }

    return NextResponse.json({
      title: clean(poem.title),
      author: clean(poem.author),
      lines: poem.lines.map((line) => line.trimEnd()),
      lineCount: Number.parseInt(poem.linecount ?? `${poem.lines.length}`, 10) || poem.lines.length,
      sourceUrl: "https://poetrydb.org/",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PoetryDB request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
