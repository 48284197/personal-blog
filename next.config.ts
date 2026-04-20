import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xuxiweii.s3.bitiful.net',
      }
    ],
  },
};

export default nextConfig;
