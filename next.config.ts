import type { NextConfig } from "next";

/** Proxies Flask: `app/api/backend/[[...path]]/route.ts` reenvía el host público como `X-Branded-Host`. */
const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/c/:slug", destination: "/catalogo/:slug", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
    ],
  },
};

export default nextConfig;
