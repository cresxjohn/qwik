import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|gif|webp|svg|ico|css|js)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-resources",
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.s3\..*\.amazonaws\.com\/.*$/,
        handler: "CacheFirst",
        options: {
          cacheName: "s3-images",
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /^https:\/\/api\..*$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-font-assets",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`,
        pathname: "/attachments/**",
      },
    ],
  },
};

export default withPWAConfig(nextConfig);
