import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve blocking metadata for all user agents to maximize crawler compatibility.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
