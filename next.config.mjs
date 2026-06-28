/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // better-sqlite3 is a native module — keep it server-side, never bundled to the client.
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  images: {
    // Phase 1 serves local derivatives from /public/media. Remote patterns added when CDN lands.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
