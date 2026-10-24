import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the directory that holds the statically exported renderer.
 *
 * In a packaged build the renderer lives inside the app bundle
 * (`client/out` under the asar archive). In development it is the
 * `client/out` directory next to the project root. The first candidate that
 * exists wins, so the same code path works in both modes.
 */
export function resolveRendererDir(): string {
  const candidates = [
    path.join(app.getAppPath(), "client", "out"),
    path.join(process.resourcesPath ?? "", "client", "out"),
    path.join(app.getAppPath(), "out"),
    path.join(__dirname, "..", "..", "client", "out"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[0];
}

/**
 * Directory that owns all user data. This is deliberately under
 * `app.getPath("userData")` (i.e. `~/Library/Application Support/...`) and
 * never inside the application bundle, so reinstalling or upgrading the app
 * leaves the user's records untouched.
 */
export function resolveDataDir(): string {
  const dir = path.join(app.getPath("userData"), "ledger");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function resolveDatabasePath(): string {
  return path.join(resolveDataDir(), "data.db");
}

/**
 * Per-install secret used to derive the AES-256-GCM field-encryption key.
 * Generated once and stored with owner-only permissions next to the database.
 */
export function resolveSecretKeyPath(): string {
  return path.join(resolveDataDir(), "secret.key");
}

export function ensureSecretKey(): Buffer {
  const secretPath = resolveSecretKeyPath();

  if (fs.existsSync(secretPath)) {
    const raw = fs.readFileSync(secretPath, "utf8").trim();
    if (raw.length >= 32) return Buffer.from(raw, "utf8").subarray(0, 32);
  }

  const crypto = require("node:crypto") as typeof import("node:crypto");
  const secret = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(secretPath, secret, { encoding: "utf8", mode: 0o600 });
  try {
    fs.chmodSync(secretPath, 0o600);
  } catch {
    // Best effort on filesystems without POSIX permissions.
  }
  return Buffer.from(secret, "utf8").subarray(0, 32);
}

export function describeDataDir(): string {
  return resolveDataDir();
}
