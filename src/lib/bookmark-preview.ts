import dns from "node:dns/promises";
import net from "node:net";

import type { WebBookmarkKind, WebBookmarkMetadata } from "@/features/wall/types";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 7000;
const OEMBED_TIMEOUT_MS = 4000;
const MAX_HTML_BYTES = 524288;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

const entityMap: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
};

type ParsedTag = {
  name: string;
  attributes: Record<string, string>;
};

type ParsedHead = {
  metas: ParsedTag[];
  links: ParsedTag[];
  title: string;
};

type MetadataDraft = Partial<Pick<WebBookmarkMetadata, "title" | "description" | "siteName" | "faviconUrl" | "imageUrl" | "kind">>;

const decodeHtml = (value: string) =>
  value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === "#") {
      const numeric = entity[1]?.toLowerCase() === "x" ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : match;
    }
    return entityMap[entity.toLowerCase()] ?? match;
  });

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const sanitizeText = (value: string, maxLength: number) => collapseWhitespace(decodeHtml(value).replace(/[\u0000-\u001F\u007F]/g, "")).slice(0, maxLength);

const sanitizeMetaKey = (value: string) => value.trim().toLowerCase();

const safeAbsoluteUrl = (raw: string, base: string) => {
  try {
    const parsed = new URL(raw, base);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
};

const stripAtPrefix = (value: string) => value.replace(/^@+/, "").trim();

const parseTagAttributes = (tagHtml: string) => {
  const attributes: Record<string, string> = {};
  const attrPattern = /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(tagHtml))) {
    const name = match[1]?.toLowerCase();
    if (!name || name.startsWith("<") || name === "meta" || name === "link") {
      continue;
    }
    const rawValue = match[2] ?? match[3] ?? match[4] ?? "";
    attributes[name] = decodeHtml(rawValue.trim());
  }

  return attributes;
};

const parseHeadTags = (html: string): ParsedHead => {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => ({
    name: "meta",
    attributes: parseTagAttributes(match[0]),
  }));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => ({
    name: "link",
    attributes: parseTagAttributes(match[0]),
  }));
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return {
    metas,
    links,
    title: titleMatch?.[1] ? sanitizeText(titleMatch[1], 220) : "",
  };
};

const buildMetaIndex = (tags: ParsedTag[]) => {
  const index = new Map<string, string>();

  for (const tag of tags) {
    const content = sanitizeText(tag.attributes.content ?? "", 700);
    if (!content) {
      continue;
    }

    const keys = [tag.attributes.property, tag.attributes.name, tag.attributes.itemprop]
      .map((value) => (value ? sanitizeMetaKey(value) : ""))
      .filter(Boolean);

    for (const key of keys) {
      if (!index.has(key)) {
        index.set(key, content);
      }
    }
  }

  return index;
};

const pickMeta = (index: Map<string, string>, keys: string[]) => {
  for (const key of keys) {
    const value = index.get(sanitizeMetaKey(key));
    if (value) {
      return value;
    }
  }
  return "";
};

const pickFavicon = (links: ParsedTag[], baseUrl: string) => {
  const candidates = links
    .map((tag) => {
      const rel = (tag.attributes.rel ?? "").toLowerCase();
      const href = tag.attributes.href ?? "";
      return {
        rel,
        href,
      };
    })
    .filter((candidate) => candidate.href && candidate.rel.includes("icon"))
    .sort((left, right) => {
      const score = (value: string) => {
        if (value.includes("apple-touch-icon")) {
          return 3;
        }
        if (value.includes("shortcut icon")) {
          return 2;
        }
        return 1;
      };
      return score(right.rel) - score(left.rel);
    });

  for (const candidate of candidates) {
    const resolved = safeAbsoluteUrl(candidate.href, baseUrl);
    if (resolved) {
      return resolved;
    }
  }

  return "";
};

const isPrivateHostname = (hostname: string) => {
  const value = hostname.toLowerCase();
  return value === "localhost" || value.endsWith(".localhost") || value.endsWith(".local");
};

const isPrivateIp = (value: string) => {
  if (!net.isIP(value)) {
    return false;
  }
  if (net.isIPv4(value)) {
    const parts = value.split(".").map(Number);
    const a = parts[0] ?? -1;
    const b = parts[1] ?? -1;
    return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  const normalized = value.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:") || normalized.startsWith("::ffff:127.");
};

const assertSafeUrl = async (urlValue: string) => {
  const parsed = new URL(urlValue);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Unsupported URL protocol.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Authenticated URLs are not supported.");
  }
  if (isPrivateHostname(parsed.hostname) || isPrivateIp(parsed.hostname)) {
    throw new Error("Local network URLs are not allowed.");
  }
  const records = await dns.lookup(parsed.hostname, { all: true });
  if (records.some((record) => isPrivateIp(record.address))) {
    throw new Error("Local network URLs are not allowed.");
  }
  return parsed;
};

const inferKind = (urlValue: URL, contentType: string, metadata: { siteName: string; title: string; description: string }) => {
  const host = urlValue.hostname.toLowerCase();
  const path = urlValue.pathname.toLowerCase();
  const haystack = `${metadata.siteName} ${metadata.title} ${metadata.description} ${host} ${path}`.toLowerCase();
  if (host.includes("youtube.") || host.includes("youtu.be") || haystack.includes(" video")) return "video" satisfies WebBookmarkKind;
  if (host === "github.com" || host.endsWith(".github.com")) return "repo" satisfies WebBookmarkKind;
  if (host.includes("docs.") || path.includes("/docs") || haystack.includes("documentation") || haystack.includes(" api ")) return "docs" satisfies WebBookmarkKind;
  if (host.includes("arxiv.org") || haystack.includes("paper") || haystack.includes("research")) return "paper" satisfies WebBookmarkKind;
  if (host.includes("twitter.com") || host.includes("x.com") || host.includes("linkedin.com") || host.includes("reddit.com")) return "post" satisfies WebBookmarkKind;
  if (haystack.includes("buy") || haystack.includes("pricing") || haystack.includes("product")) return "product" satisfies WebBookmarkKind;
  if (contentType.includes("article") || haystack.includes("article") || haystack.includes("blog")) return "article" satisfies WebBookmarkKind;
  return "website" satisfies WebBookmarkKind;
};

const readHtml = async (response: Response) => {
  const text = await response.text();
  return text.slice(0, MAX_HTML_BYTES);
};

const fetchWithRedirects = async (urlValue: string) => {
  let currentUrl = urlValue;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertSafeUrl(currentUrl);
    const response = await fetch(currentUrl, {
      method: "GET",
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("Preview redirect failed.");
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return { response, finalUrl: currentUrl };
  }
  throw new Error("Too many redirects.");
};

const extractYouTubeVideoId = (urlValue: URL) => {
  if (urlValue.hostname.includes("youtu.be")) {
    return urlValue.pathname.split("/").filter(Boolean)[0] ?? "";
  }
  if (urlValue.searchParams.get("v")) {
    return urlValue.searchParams.get("v") ?? "";
  }
  const pathParts = urlValue.pathname.split("/").filter(Boolean);
  if (pathParts[0] === "embed" || pathParts[0] === "shorts" || pathParts[0] === "live") {
    return pathParts[1] ?? "";
  }
  return "";
};

const mergeMetadata = (base: WebBookmarkMetadata, draft?: MetadataDraft | null): WebBookmarkMetadata => {
  if (!draft) {
    return base;
  }
  const domain = base.domain.toLowerCase();
  const titleLooksWeak = !base.title.trim() || base.title.trim().toLowerCase() === domain;
  const siteLooksWeak = !base.siteName.trim() || base.siteName.trim().toLowerCase() === domain;
  const descriptionLooksWeak = !base.description.trim();

  return {
    ...base,
    title: draft.title && titleLooksWeak ? draft.title : base.title,
    description: draft.description && descriptionLooksWeak ? draft.description : base.description,
    siteName: draft.siteName && siteLooksWeak ? draft.siteName : base.siteName,
    faviconUrl: draft.faviconUrl || base.faviconUrl,
    imageUrl: draft.imageUrl || base.imageUrl,
    kind: draft.kind || base.kind,
  };
};

const fetchYouTubeMetadata = async (normalizedUrl: string): Promise<MetadataDraft | null> => {
  const parsed = new URL(normalizedUrl);
  if (!parsed.hostname.includes("youtube.") && !parsed.hostname.includes("youtu.be")) {
    return null;
  }

  const videoId = extractYouTubeVideoId(parsed);
  const fallbackThumbnail = videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : "";

  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("YouTube oEmbed failed.");
    }

    const payload = (await response.json()) as {
      title?: string;
      thumbnail_url?: string;
      author_name?: string;
      provider_name?: string;
    };

    return {
      title: payload.title ? sanitizeText(payload.title, 220) : undefined,
      siteName: sanitizeText(payload.provider_name || "YouTube", 120) || "YouTube",
      imageUrl: payload.thumbnail_url ? safeAbsoluteUrl(payload.thumbnail_url, normalizedUrl) : fallbackThumbnail || undefined,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent("youtube.com")}&sz=64`,
      kind: "video",
      description: payload.author_name ? `From ${sanitizeText(payload.author_name, 120)}` : undefined,
    };
  } catch {
    if (!fallbackThumbnail) {
      return null;
    }
    return {
      siteName: "YouTube",
      imageUrl: fallbackThumbnail,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent("youtube.com")}&sz=64`,
      kind: "video",
    };
  }
};

const fetchProviderMetadata = async (normalizedUrl: string) => {
  const youtube = await fetchYouTubeMetadata(normalizedUrl);
  if (youtube) {
    return youtube;
  }
  return null;
};

export const buildBookmarkMetadata = (urlValue: string, finalUrlValue: string, html: string, contentType: string): WebBookmarkMetadata => {
  const finalUrl = new URL(finalUrlValue);
  const domain = finalUrl.hostname.replace(/^www\./i, "");
  const parsedHead = parseHeadTags(html);
  const metaIndex = buildMetaIndex(parsedHead.metas);

  const title = pickMeta(metaIndex, ["og:title", "twitter:title"]) || parsedHead.title || domain;
  const description = pickMeta(metaIndex, ["og:description", "twitter:description", "description"]);
  const siteName =
    pickMeta(metaIndex, ["og:site_name", "application-name"]) || stripAtPrefix(pickMeta(metaIndex, ["twitter:site", "twitter:creator"])) || domain;
  const imageRaw = pickMeta(metaIndex, ["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"]);
  const imageUrl = imageRaw ? safeAbsoluteUrl(imageRaw, finalUrl.toString()) : "";
  const faviconFromLink = pickFavicon(parsedHead.links, finalUrl.toString());
  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  const faviconUrl = faviconFromLink || safeAbsoluteUrl("/favicon.ico", finalUrl.origin) || fallbackFavicon;

  return {
    url: urlValue,
    finalUrl: finalUrl.toString(),
    title,
    description,
    siteName,
    domain,
    faviconUrl,
    imageUrl: imageUrl || undefined,
    kind: inferKind(finalUrl, contentType, { siteName, title, description }),
    contentType: contentType || undefined,
  } satisfies WebBookmarkMetadata;
};

export const fetchBookmarkMetadata = async (rawUrl: string) => {
  const parsed = await assertSafeUrl(rawUrl);
  const normalizedUrl = parsed.toString();
  const providerMetadata = await fetchProviderMetadata(normalizedUrl);
  const { response, finalUrl } = await fetchWithRedirects(normalizedUrl);
  if (!response.ok) {
    throw new Error("Unable to fetch preview.");
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const finalParsed = new URL(finalUrl);
  const domain = finalParsed.hostname.replace(/^www\./i, "");

  if (!contentType.includes("text/html")) {
    const base = {
      url: normalizedUrl,
      finalUrl,
      title: domain,
      description: "",
      siteName: domain,
      domain,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
      kind: inferKind(finalParsed, contentType, { siteName: domain, title: domain, description: "" }),
      contentType: contentType || undefined,
    } satisfies WebBookmarkMetadata;

    return {
      url: normalizedUrl,
      normalizedUrl,
      metadata: mergeMetadata(base, providerMetadata),
    };
  }

  const html = await readHtml(response);
  const metadata = mergeMetadata(buildBookmarkMetadata(normalizedUrl, finalUrl, html, contentType), providerMetadata);

  return {
    url: normalizedUrl,
    normalizedUrl,
    metadata,
  };
};
