/**
 * Development runner.
 *
 * Starts the Next.js dev server for the renderer, waits until it answers, then
 * builds the Electron main/preload sources and launches the app in dev mode.
 * Both children are killed when this process receives SIGINT/SIGTERM, so a
 * single Ctrl-C tears everything down without leaving orphaned processes.
 */

import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RENDERER_URL = process.env.LEDGER_RENDERER_URL || "http://localhost:3001";
const READY_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 500;

const children = [];

function shutdown(code = 0) {
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // Already gone.
    }
  }
  // Give children a moment to exit before the parent leaves.
  setTimeout(() => process.exit(code), 400);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("exit", () => {
  for (const child of children) {
    try {
      child.kill("SIGKILL");
    } catch {
      // Already gone.
    }
  }
});

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
          return;
        }
        retry();
      });
      req.on("error", retry);
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(attempt, POLL_INTERVAL_MS);
    };

    attempt();
  });
}

async function main() {
  console.log("[dev] starting renderer dev server…");
  const renderer = spawn("npm", ["run", "dev:renderer"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  children.push(renderer);

  await waitForServer(RENDERER_URL, READY_TIMEOUT_MS);
  console.log(`[dev] renderer ready at ${RENDERER_URL}`);

  console.log("[dev] compiling electron main/preload…");
  const build = spawn("npm", ["run", "build:electron"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  children.push(build);
  const buildCode = await new Promise((resolve) =>
    build.on("exit", (code) => resolve(code ?? 1)),
  );
  if (buildCode !== 0) {
    throw new Error(`electron build failed with code ${buildCode}`);
  }

  console.log("[dev] launching electron…");
  const electron = spawn("npx", ["electron", "dist-electron/main/index.js"], {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      LEDGER_DEV: "1",
      LEDGER_RENDERER_URL: RENDERER_URL,
    },
  });
  children.push(electron);

  electron.on("exit", (code) => {
    console.log(`[dev] electron exited (${code})`);
    shutdown(code ?? 0);
  });
}

main().catch((error) => {
  console.error("[dev] fatal:", error.message);
  shutdown(1);
});
