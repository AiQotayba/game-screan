import type { NextConfig } from "next";
import path from "node:path";

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "https://api-ga.sy-calculator.com";
const monorepoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@game-screan/shared"],
  turbopack: {
    root: monorepoRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiOrigin}/uploads/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${apiOrigin}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
