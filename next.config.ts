import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cashrhythm-dev.s3.ap-southeast-1.amazonaws.com",
        pathname: "/attachments/**",
      },
    ],
  },
};

export default nextConfig;
