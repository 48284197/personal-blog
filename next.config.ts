import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xuxiweii.s3.bitiful.net',
      },
      {
        protocol: 'https',
        hostname: 'ai6666.com',
      },
    ],
  },
};

export default nextConfig;
