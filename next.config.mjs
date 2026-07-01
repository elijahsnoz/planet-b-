/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // better-sqlite3 is a native module — keep it server-side, never bundled to the client.
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  images: {
    // Phase 1 serves local derivatives from /public/media. Remote patterns added when CDN lands.
    // WebP only, on purpose: AVIF cold-encodes ~10x slower on the self-hosted
    // optimizer (~2.8s vs ~0.23s per image), which is what made first loads drag,
    // while WebP is the same size or smaller here and is universally supported.
    // Revisit AVIF once images are served from a CDN that encodes ahead of time.
    formats: ["image/webp"],
    // A leaner set of widths → fewer variants to encode/cache on demand.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [48, 96, 200, 384],
  },
};

export default nextConfig;
