import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  async rewrites() {
    const rawBackendUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
      process.env.BACKEND_URL ||
      (process.env.NODE_ENV === "production" ? "https://sprintforge-btpl.onrender.com" : "http://localhost:5000");

    // If backend is a full URL (http:// or https://), proxy /api requests through Next.js
    if (rawBackendUrl.startsWith("http://") || rawBackendUrl.startsWith("https://")) {
      return [
        {
          source: "/api/:path*",
          destination: `${rawBackendUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
