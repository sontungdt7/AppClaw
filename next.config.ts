import type { NextConfig } from "next";
import path from "path";

const appRoot = __dirname;

const nextConfig: NextConfig = {
  // Ensure modules resolve from AppClaw, not workspace root (/home/metta)
  outputFileTracingRoot: appRoot,
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(appRoot, "node_modules"),
      ...(config.resolve.modules || []),
    ];
    return config;
  },
  turbopack: {
    root: appRoot,
  },
  images: {
    localPatterns: [
      {
        pathname: "/logo.png",
        search: "?v=2",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
