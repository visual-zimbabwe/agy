import type { NextConfig } from "next";

const outputMode = process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined;

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
};

export default nextConfig;
