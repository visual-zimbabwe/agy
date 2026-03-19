import { describe, expect, it } from "vitest";

import { isBookmarkMetadataRich } from "@/features/wall/bookmarks";
import { buildBookmarkMetadata } from "@/lib/bookmark-preview";

describe("bookmark preview metadata parsing", () => {
  it("prefers open graph metadata and resolves relative assets", () => {
    const html = `
      <html>
        <head>
          <title>Fallback Title</title>
          <meta property="og:title" content="The Modern Middle East, Explained" />
          <meta property="og:description" content="A concise explainer on the region's modern history." />
          <meta property="og:image" content="/thumbs/explainer.jpg" />
          <meta property="og:site_name" content="YouTube" />
          <meta name="twitter:title" content="Twitter Title" />
          <meta name="twitter:description" content="Twitter Description" />
          <link rel="icon" href="/favicon-32x32.png" />
        </head>
      </html>
    `;

    const metadata = buildBookmarkMetadata("https://youtube.com/watch?v=abc", "https://www.youtube.com/watch?v=abc", html, "text/html; charset=utf-8");

    expect(metadata.title).toBe("The Modern Middle East, Explained");
    expect(metadata.description).toBe("A concise explainer on the region's modern history.");
    expect(metadata.siteName).toBe("YouTube");
    expect(metadata.imageUrl).toBe("https://www.youtube.com/thumbs/explainer.jpg");
    expect(metadata.faviconUrl).toBe("https://www.youtube.com/favicon-32x32.png");
    expect(metadata.kind).toBe("video");
    expect(isBookmarkMetadataRich(metadata)).toBe(true);
  });

  it("falls back to twitter and document metadata when open graph is missing", () => {
    const html = `
      <html>
        <head>
          <title>Repository Health Dashboard</title>
          <meta name="twitter:title" content="Repository Health Dashboard" />
          <meta name="description" content="Track CI, issues, and releases in one place." />
          <meta name="twitter:image" content="https://cdn.example.com/preview.png" />
          <meta name="application-name" content="Example Docs" />
        </head>
      </html>
    `;

    const metadata = buildBookmarkMetadata("https://docs.example.com/guide", "https://docs.example.com/guide", html, "text/html");

    expect(metadata.title).toBe("Repository Health Dashboard");
    expect(metadata.description).toBe("Track CI, issues, and releases in one place.");
    expect(metadata.siteName).toBe("Example Docs");
    expect(metadata.imageUrl).toBe("https://cdn.example.com/preview.png");
    expect(metadata.kind).toBe("docs");
  });
});
