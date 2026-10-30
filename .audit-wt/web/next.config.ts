import path from "path";
import type { NextConfig } from "next";

const apiInternal = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000";
const repoRoot = path.join(__dirname, "..");
const sirrayaWeb = path.join(repoRoot, "sirraya", "web");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: {
    resolveAlias: {
      "@sirraya": sirrayaWeb,
    },
  },
  experimental: {
    agentUpgrade: "security",
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    return [
      { source: "/health", destination: `${apiInternal}/health` },
      { source: "/api/:path*", destination: `${apiInternal}/api/:path*` },
      { source: "/auth/:path*", destination: `${apiInternal}/auth/:path*` },
    ];
  },
};

export default nextConfig;
