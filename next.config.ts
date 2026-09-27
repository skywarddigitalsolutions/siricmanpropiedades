import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles only the traced production dependencies into
  // .next/standalone, so the runtime Docker image doesn't need node_modules
  // or the full npm install to run `node server.js`.
  output: "standalone",
};

export default nextConfig;
