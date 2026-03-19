import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api/auth";

const decodeHtml = (value: string) =>
  value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const pickMeta = (html: string, names: string[]) => {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
    const match = html.match(rx);
    if (match?.[1]) {
      return decodeHtml(match[1].trim());
    }
  }
  return "";
};

const pickTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1].trim()) : "";
};

const safeAbsoluteUrl = (raw: string, base: string) => {
  try {
    const parsed = new URL(raw, base);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
};

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim() ?? "";
  if (!url) {
    return NextResponse.json({ error: "Missing URL." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
    return NextResponse.json({ error: "Unsupported URL protocol." }, { status: 400 });
  }

  try {
    const response = await fetch(parsed.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "AgyBookmarkBot/1.0 (+https://localhost)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Unable to fetch preview." }, { status: 502 });
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({
        title: parsed.hostname.replace(/^www\./, ""),
        description: "",
        imageUrl: "",
        hostname: parsed.hostname.replace(/^www\./, ""),
      });
    }

    const html = await response.text();
    const title = pickMeta(html, ["og:title", "twitter:title"]) || pickTitle(html) || parsed.hostname.replace(/^www\./, "");
    const description = pickMeta(html, ["og:description", "twitter:description", "description"]);
    const imageRaw = pickMeta(html, ["og:image", "twitter:image", "twitter:image:src"]);
    const imageUrl = imageRaw ? safeAbsoluteUrl(imageRaw, response.url) : "";
    const hostname = new URL(response.url).hostname.replace(/^www\./, "");

    return NextResponse.json({
      title,
      description,
      imageUrl,
      hostname,
    });
  } catch {
    return NextResponse.json({ error: "Preview request failed." }, { status: 502 });
  }
}


