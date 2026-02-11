import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Idea-Wall",
  description: "Infinite local-first canvas for sticky-note style thinking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
