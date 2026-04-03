import type { NextConfig } from "next";

const outputMode = process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined;
const supabaseProxyTarget =
  process.env.SUPABASE_PROXY_TARGET ||
  process.env.SUPABASE_SERVER_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  output: outputMode,
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://localhost:3001",
  ],
  async rewrites() {
    if (!supabaseProxyTarget) {
      return [];
    }

    const normalizedTarget = supabaseProxyTarget.replace(/\/+$/, "");
    return [
      {
        source: "/supabase/:path*",
        destination: `${normalizedTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
