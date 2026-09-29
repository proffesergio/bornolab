import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/convert",
        destination: "/bijoy-unicode-converter",
        permanent: true,
      },
      {
        // Renamed study material (old "HTML guide" id → new interactive id).
        source: "/study/buet-msc-cse-prep-html",
        destination: "/study/buet-msc-cse-prep-interactive",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
