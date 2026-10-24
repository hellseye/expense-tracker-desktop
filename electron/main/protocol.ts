import { protocol } from "electron";
import fs from "node:fs";
import path from "node:path";

export const RENDERER_PROTOCOL = "app";
export const RENDERER_HOST = "ledger";

/**
 * Declares the custom scheme as a privileged, standard scheme.
 *
 * This must run before the app is ready. Registering the scheme as `standard` is
 * what gives `app://ledger/...` a real origin, so that a Content-Security-Policy
 * of `'self'` matches the renderer's own scripts and assets. Without it Chromium
 * treats the scheme as opaque and blocks every same-origin subresource.
 */
export function registerPrivilegedSchemes(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: RENDERER_PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

/**
 * Content Security Policy for the packaged renderer.
 *
 * The renderer is fully local: every asset is served from the app bundle and no
 * remote origin is ever contacted. `script-src` must allow `'unsafe-inline'`
 * because Next.js' App Router embeds its RSC payload in inline
 * `self.__next_f.push(...)` bootstrap scripts in the static export — there is no
 * nonce or hash available for those. Everything else is locked down hard.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function contentTypeFor(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

/**
 * Resolves a request path to a file inside `outDir`.
 *
 * Returns `null` when nothing matches, which the caller turns into a 404.
 * Path traversal is rejected outright.
 */
function resolveFile(outDir: string, requestPath: string): string | null {
  const root = path.resolve(outDir);

  // The original web application exposed an /api/* surface. A static export has
  // none, so these must 404 instead of falling back to the HTML shell — the
  // renderer's fetch calls would otherwise receive HTML where they expect JSON.
  if (requestPath === "/api" || requestPath.startsWith("/api/")) {
    return null;
  }

  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const candidate = path.resolve(root, `.${decoded}`);

  if (!candidate.startsWith(root + path.sep) && candidate !== root) {
    return null;
  }

  const tryPaths: string[] = [candidate];

  // `/dashboard` -> `/dashboard/index.html` (Next static export layout), and an
  // extension-less path that matches no file is a client-side route, so it falls
  // back to the application shell.
  if (!path.extname(candidate)) {
    tryPaths.push(path.join(candidate, "index.html"));
    tryPaths.push(path.join(root, "index.html"));
  }

  for (const attempt of tryPaths) {
    if (fs.existsSync(attempt) && fs.statSync(attempt).isFile()) {
      return attempt;
    }
  }

  return null;
}

/**
 * Registers the custom protocol that serves the static renderer with SPA
 * fallback. Using a registered scheme (rather than `file://`) keeps origin
 * handling predictable and lets us attach security headers to every response.
 */
export function registerRendererProtocol(outDir: string): void {
  protocol.handle(RENDERER_PROTOCOL, (request) => {
    const url = new URL(request.url);
    const filePath = resolveFile(outDir, url.pathname);

    if (!filePath) {
      return new Response("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    try {
      const body = fs.readFileSync(filePath);
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": contentTypeFor(filePath),
          "Content-Security-Policy": CONTENT_SECURITY_POLICY,
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Cache-Control": "no-cache",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return new Response(`Internal Server Error: ${message}`, {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  });
}

export function rendererEntryPoint(): string {
  return `${RENDERER_PROTOCOL}://${RENDERER_HOST}/index.html`;
}
