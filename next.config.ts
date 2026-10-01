import type { NextConfig } from "next";

// Property photos go through a Server Action (browser → Next BFF → API). The
// API accepts up to 15 MB per image; leave headroom for multipart overhead.
const UPLOAD_BODY_LIMIT = "16mb";

const nextConfig: NextConfig = {
  // Standalone output bundles only the traced production dependencies into
  // .next/standalone, so the runtime Docker image doesn't need node_modules
  // or the full npm install to run `node server.js`.
  output: "standalone",
  experimental: {
    // Server Actions default to a 1 MB body.
    serverActions: { bodySizeLimit: UPLOAD_BODY_LIMIT },
    // `src/proxy.ts` matches `/admin/*`, and requests through the proxy are
    // buffered with a 10 MB default cap.
    proxyClientMaxBodySize: UPLOAD_BODY_LIMIT,
  },
};

export default nextConfig;
