import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.trycloudflare.com"],
  turbopack: {
    root: "../..",
  },
};

export default nextConfig;
