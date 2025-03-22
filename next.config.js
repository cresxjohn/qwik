/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qwikfinx.s3.ap-southeast-1.amazonaws.com",
        pathname: "/attachments/**",
      },
      {
        protocol: "https",
        hostname: "qwikfinx-dev.s3.ap-southeast-1.amazonaws.com",
        pathname: "/attachments/**",
      },
    ],
  },
};

module.exports = nextConfig;
