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
    "http://127.0.0.1:5000",
    "http://localhost:5000",
    "http://10.0.0.121:5000",
    "http://100.69.19.119:5000",
    "http://100.69.19.119:3000",
    "http://127.0.0.1:3001",
    "http://localhost:3001",
    "https://xy3ywehn9o.localto.net",
    "xy3ywehn9o.localto.net",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "http://xy3ywehn9o.localto.net",
        "https://xy3ywehn9o.localto.net",
        "http://10.0.0.121:5000",
        "http://100.69.19.119:5000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
      ],
    },
  },
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
