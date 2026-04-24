import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode for catching subtle bugs early
  reactStrictMode: true,

  // Image optimization — add your domains here
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "images.clerk.dev" },
      { hostname: "*.vercel-storage.com" },
      { hostname: "*.public.blob.vercel-storage.com" },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },

  // External packages that should not be bundled by the server
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Experimental features — Next.js 15
  experimental: {
    // Partial Prerendering for hybrid static/dynamic pages
    ppr: false,
  },
};

export default nextConfig;
