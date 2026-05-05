import type { NextConfig } from "next";

const backendOrigin =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:5001";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/c/:slug", destination: "/catalogo/:slug", permanent: true }];
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendOrigin.replace(/\/$/, "")}/api/:path*`,
      },
    ];
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
