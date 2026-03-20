import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  url: z.string().url(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  title: z.string().trim().min(1).max(160).optional(),
});

const allowedHosts = new Set(["apod.nasa.gov", "www.nasa.gov", "images-assets.nasa.gov", "img.youtube.com", "i.ytimg.com"]);

const cleanSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "apod";

const inferExtension = (targetUrl: URL, contentType?: string | null) => {
  const pathMatch = targetUrl.pathname.match(/\.([a-z0-9]{3,4})$/i);
  if (pathMatch?.[1]) {
    return pathMatch[1].toLowerCase();
  }
  if (contentType?.includes("png")) {
    return "png";
  }
  if (contentType?.includes("webp")) {
    return "webp";
  }
  return "jpg";
};

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({
    url: new URL(request.url).searchParams.get("url") ?? undefined,
    date: new URL(request.url).searchParams.get("date") ?? undefined,
    title: new URL(request.url).searchParams.get("title") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid APOD download request" }, { status: 400 });
  }

  const targetUrl = new URL(parsed.data.url);
  const hostname = targetUrl.hostname.toLowerCase();
  if (!allowedHosts.has(hostname) && !hostname.endsWith(".nasa.gov")) {
    return NextResponse.json({ error: "Unsupported APOD media host" }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, { cache: "no-store" });
    if (!response.ok || !response.body) {
      return NextResponse.json({ error: `APOD media request failed with ${response.status}` }, { status: response.status || 502 });
    }

    const extension = inferExtension(targetUrl, response.headers.get("content-type"));
    const title = cleanSlug(parsed.data.title || "apod");
    const date = parsed.data.date || "latest";
    const filename = `apod-${date}-${title}.${extension}`;

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "APOD media request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
