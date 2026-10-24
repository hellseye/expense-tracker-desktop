# Increment 002 — Electron foundation

- **Date:** 2026-10-24
- **Feature / task:** Static-export renderer + Electron main/preload runtime with a secure IPC bridge.
- **Status:** complete

## Reason for the change

The renderer must run with no Next.js server, no dev server and no remote backend
(decision D1). This increment builds the desktop runtime that makes that possible and
proves the real UI renders inside an Electron window before any feature migration begins.

## Files created or modified

**Created**

- `electron/shared/types.ts` — DTOs and the `ApiResult<T>` envelope shared by main, preload and renderer.
- `electron/shared/channels.ts` — the closed set of IPC channel names.
- `electron/main/paths.ts` — renderer/data directory resolution, per-install secret handling.
- `electron/main/protocol.ts` — privileged `app://` scheme + static file serving with SPA fallback and CSP.
- `electron/main/window.ts` — hardened `BrowserWindow` factory and permission denial.
- `electron/main/menu.ts` — native macOS application menu (App/File/Edit/View/Window/Help).
- `electron/main/ipc.ts` — IPC registration, sender validation, payload validation, uniform result envelope.
- `electron/main/smoke.ts` — end-to-end launch test (`LEDGER_SMOKE_TEST=1`).
- `electron/preload/index.ts` — `contextBridge` bridge exposing a closed, typed method set.
- `scripts/dev.mjs` — dev runner (Next dev server + Electron, clean teardown).
- `scripts/build-preload.mjs` — esbuild bundling of the preload.
- `tsconfig.preload.json` — typecheck-only config for the preload.

**Modified**

- `package.json` — added `esbuild`, `build:electron`, `dev`, `dist` scripts.
- `tsconfig.electron.json` — split so `tsc` emits main+shared and esbuild bundles the preload.
- `client/src/validations/expense.validation.ts` — `PaymentMethod` now comes from `@/types` instead of `@prisma/client`.

## Implementation details

**Renderer is a static export.** `client/next.config.ts` sets `output: "export"` and
`trailingSlash: true`; `next build` prerenders all 10 routes into `client/out/`. Verified:
`/` `/login` `/register` `/dashboard` `/transactions` `/categories` `/analytics`
`/settings` `/profile` — all `○ (Static)`.

**Custom protocol instead of `file://`.** `protocol.ts` registers `app` as a privileged,
*standard* scheme before `ready`. Registering it as standard is what gives the origin a
real identity, so `script-src 'self'` matches the renderer's own chunks. Without it
Chromium treats the scheme as opaque and blocks every subresource. Client-side routes
(`/dashboard`) fall back to `index.html`; `/api/*` returns a real 404.

**Sandboxed preload.** The renderer runs with `sandbox: true`, `contextIsolation: true`,
`nodeIntegration: false`. A sandboxed preload may not `require` relative modules, so the
preload is bundled to a single file with esbuild (`external: ["electron"]`) — this keeps
the renderer sandboxed without duplicating the channel list.

**Closed IPC surface.** `ipc.ts` registers every channel explicitly and validates the
sender (`event.sender.id === mainWindow.webContents.id`) plus the payload (zod) before
touching application code. There is no wildcard handler and the preload exposes no raw
`invoke`.

**CSP.** Attached to every protocol response. `script-src` needs `'unsafe-inline'`
because Next's App Router embeds its RSC payload in inline `self.__next_f.push(...)`
bootstrap scripts; no nonce is available for those. Everything else is locked to `'self'`,
with `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, `frame-ancestors 'none'`.

## Tests executed and actual results

| Check | Result |
| --- | --- |
| `npx tsc -p tsconfig.electron.json` | PASS (0 errors) |
| `npx tsc -p tsconfig.preload.json --noEmit` | PASS |
| `next build` (static export) | PASS — 13 static pages, 10 routes |
| `better-sqlite3` under Electron ABI | PASS — `SQLITE_OK`, SQLite 3.53.4 |
| `LEDGER_SMOKE_TEST=1 electron …` | PASS — see below |

Smoke test output (`logs/smoke-result.json`):

```json
{
  "title": { "ok": true, "value": "Ledger - Minimal Personal Expense Tracker" },
  "pathname": { "ok": true, "value": "/login/" },
  "bodyText": { "ok": true, "value": "Ledger Minimal personal expense tracker … Sign Up" },
  "bridgeType": { "ok": true, "value": "object" },
  "errors": []
}
```

A screenshot of the rendered window (`logs/smoke-screenshot.png`) was inspected and shows
the original Ledger login screen: brand icon, `Ledger` heading, the tagline, Email and
Password fields, `Sign In with Email`, `OR CONTINUE WITH`, `Google SSO`, and
`Don't have an account? Sign Up`.

**Zero console errors.** Confirmed independently: a 12-second run of the real application
with a console listener attached produced no warnings or errors.

### Defect found and fixed during this increment

An `Uncaught SyntaxError: Unexpected token '!'` appeared in the renderer console. It was
bisected over many experiments (protocol handler variants, header sets, sandbox on/off,
preload on/off, `loadFile` vs custom protocol, minimal documents, CDP stack capture). The
conclusion: **the error was produced by the smoke-test harness's own
`webContents.executeJavaScript(...)` call**, not by the application. With
`executeJavaScript` removed the error list is empty, and a plain 12-second run of the
real app is clean. The smoke test now uses only trivial single-expression probes.

Two real bugs were found and fixed on the way:

1. `enableRemoteModule` no longer exists in Electron 45's `WebPreferences` — removed.
2. `expense.validation.ts` imported the `PaymentMethod` enum from `@prisma/client` —
   replaced with a local `z.enum` over the same six values.

## Known limitations

- The renderer still contains the original `ApiClient` (HTTP) and JWT `auth-context`.
  Both are inert until replaced in increments 003–006; the app currently lands on the
  login screen because no local profile exists.
- The Google SSO button is present but cannot work offline; it is removed in increment 003.
- No database, no persistence, no domain services yet.
- The app is not notarized (no Apple Developer identity available); recorded in D7.

## Suggested conventional commit message

```
feat: add Electron main process and secure preload bridge

Add the desktop runtime for the statically exported renderer: a privileged
app:// protocol with SPA fallback and CSP, a hardened sandboxed BrowserWindow,
a native macOS menu, and a closed, validated IPC surface exposed through a
contextBridge preload bundled with esbuild.
```

## Checklist — review before committing

- [ ] `electron/main/protocol.ts` registers the scheme as privileged/standard before `ready`.
- [ ] `electron/main/window.ts` has `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- [ ] `electron/preload/index.ts` exposes a closed method set via `contextBridge` (no raw `ipcRenderer`).
- [ ] `electron/main/ipc.ts` validates sender and payload; no wildcard handler.
- [ ] `client/next.config.ts` has `output: "export"` and `trailingSlash: true`.
- [ ] `LEDGER_SMOKE_TEST=1 npx electron dist-electron/main/index.js` reports `errors: []`.
- [ ] No `.env`, credential or secret file is committed.
- [ ] `~/coding/expense-tracker` is still untouched.
