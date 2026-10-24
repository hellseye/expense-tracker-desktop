/**
 * Bundles the preload script into a single self-contained CommonJS file.
 *
 * The renderer runs sandboxed, and a sandboxed preload may only `require` a small
 * whitelist of Electron/Node modules — relative imports are not allowed. Rolling
 * the preload (and its shared contract module) into one file keeps the renderer
 * sandboxed without duplicating the IPC channel list.
 */

import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: [path.join(root, "electron", "preload", "index.ts")],
  outfile: path.join(root, "dist-electron", "preload", "index.js"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  // `electron` must stay external: resolving the npm package would inline its
  // path-resolution shim (and its fs/child_process requires), which does not
  // exist inside a sandboxed preload.
  external: ["electron"],
  minify: true,
  sourcemap: false,
  logLevel: "info",
});

console.log("[build] preload bundled -> dist-electron/preload/index.js");
