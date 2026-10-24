import type { NextConfig } from "next";

/**
 * Ledger Desktop renderer configuration.
 *
 * The packaged application must run with no Next.js server, no dev server and no
 * remote backend, so the renderer is built as a fully static export (`out/`).
 * Electron serves that directory through a custom protocol (see
 * `electron/main/protocol.ts`) with SPA fallback so client-side routes such as
 * `/dashboard` resolve to `out/index.html`.
 *
 * `trailingSlash: true` keeps the generated file layout (`out/dashboard/index.html`)
 * consistent with the protocol handler's path resolution.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // The workspace root is one level up (monorepo layout); pin the tracing root so
  // Next does not warn about the sibling lockfile.
  outputFileTracingRoot: process.cwd(),
  eslint: {
    // Lint is run explicitly via `npm run lint`; do not block production builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
