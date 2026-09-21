import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/convert",
        destination: "/bijoy-unicode-converter",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
