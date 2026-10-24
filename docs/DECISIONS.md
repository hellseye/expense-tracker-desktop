# Architecture Decisions

Each decision records the options considered, the choice, and why. Decisions are
append-only: when one is revisited, add a new entry rather than rewriting history.

---

## D1 — Renderer is a static export, not a bundled Next.js server

**Status:** accepted (2026-10-24)

**Context.** The original `client/` is a Next.js 15 App Router application whose data
access goes through server-side route handlers (`client/src/app/api/**`) backed by
Prisma/PostgreSQL. The desktop application must launch from an installed `.app` with
no dev server, no manually started backend and no hosted service.

**Options considered.**

1. **Bundle a Next.js server inside Electron** and spawn it at runtime.
   - Pros: route handlers keep working unchanged.
   - Cons: requires shipping a Node runtime plus the full Next server in the app bundle;
     port allocation, lifecycle management, startup latency and crash recovery all become
     the app's problem; effectively shipping a dev-server-shaped process. Rejected.
2. **Static export (`output: "export"`) + Electron-owned persistence over IPC.**
   - Pros: the renderer is plain HTML/CSS/JS served from disk; no server process; fast,
     deterministic startup; offline by construction; Electron main process is the only
     privileged boundary.
   - Cons: route handlers cannot run, so their logic must be re-homed.

**Decision.** Option 2. The renderer is built with `output: "export"` into `client/out/`,
and Electron serves it through a custom protocol with SPA fallback. All persistence and
domain logic moves into the Electron main process.

**Consequences.** The route handlers and `client/src/server/**` services are removed from
the renderer build path (preserved verbatim in `reference/`). Their business logic —
expense/category/analytics rules — is re-implemented as main-process services, not deleted.
The Prisma schema is translated into an equivalent SQLite schema.

---

## D2 — SQLite via better-sqlite3, owned exclusively by the main process

**Status:** accepted (2026-10-24)

**Context.** Expenses are structured, transactional, queried with filters, sorting,
pagination and aggregations. The task explicitly prefers SQLite for this shape.

**Options considered.**

1. `localStorage` / `IndexedDB` in the renderer.
   - Rejected: the task calls this out as insufficient for financial records; no reliable
     migration/export story; renderer-side storage is not a privileged boundary.
2. JSON file store (e.g. lowdb-style).
   - Rejected: no transactional guarantees, no query capability, whole-file rewrites.
3. `better-sqlite3` (synchronous, embedded).
   - Chosen: real SQL, transactions, indexes, single-file portability, mature Electron
     support via native rebuild.
4. Node's built-in `node:sqlite`.
   - Considered: avoids a native dependency. Rejected because it is still an experimental
     built-in whose availability depends on the Node version bundled with Electron, which
     makes the build less predictable. Revisit if better-sqlite3 rebuild becomes a problem.

**Decision.** `better-sqlite3`, opened only from `electron/main/services/db.ts`. The
renderer never touches the database file.

**Data location.** `app.getPath('userData')/ledger/data.db` — i.e.
`~/Library/Application Support/Ledger/ledger/data.db`. Never inside `Contents/Resources`
of the app bundle, so reinstalling or upgrading the app preserves user data.

**Safety rules encoded in the service.** Schema versioning with forward-only migrations;
the database is never dropped or reset on launch; seeding runs only when the categories
table is empty.

---

## D3 — Cloud authentication is replaced by a local profile

**Status:** accepted (2026-10-24)

**Context.** The original app gates the dashboard behind JWT session cookies, with
email/password (bcrypt) and Google OAuth via better-auth. Every API call resolves the
user from that token.

**What the feature actually accomplishes.** It identifies *whose* records to read and
write, and protects access to them. In a single-user desktop application the "whose" part
collapses to one local identity.

**Options considered.**

1. Keep JWT + better-auth against a local database.
   - Rejected: carries the whole OAuth/session machinery for no benefit offline.
2. Local profile with optional local passcode.
   - Chosen: preserves the identity separation and the "protect my data" intent without
     any network dependency.

**Decision.** First launch shows an onboarding screen that creates a local profile
(name, optional email, currency, optional passcode). The profile is stored in SQLite.
An optional passcode is hashed with bcryptjs (already a project dependency) and gates
launch; if no passcode is set the app opens directly. No passwords or tokens leave the
machine. The `/login` and `/register` screens are repurposed as the onboarding screens,
keeping their visual design.

**Consequences.** `auth-context.tsx` is replaced by a local profile context backed by IPC.
The Google SSO button is removed (it cannot work offline and its credentials must not be
copied into the app).

---

## D4 — Field-level encryption is preserved

**Status:** accepted (2026-10-24)

**Context.** The original encrypts expense `title` and `notes` with AES-256-GCM before
writing them, keyed off `JWT_SECRET`/`NEXTAUTH_SECRET`, and decrypts on read. This is a
genuine privacy property the Settings → Privacy tab advertises.

**Decision.** Keep the behaviour. The key is derived from a per-install secret stored
alongside the database (generated once, `0600`), instead of from an environment variable.
Encryption/decryption runs in the main process only.

**Consequences.** The Privacy tab copy stays accurate. Existing plaintext rows written by
the original app remain readable because decryption falls back to the original value.

---

## D5 — UI is preserved, not redesigned

**Status:** accepted (2026-10-24)

**Decision.** All routes, components, styling, charts, toasts, modals, empty states and
keyboard shortcuts are carried over unchanged. Changes are limited to:
swapping the HTTP client for the desktop bridge, replacing auth, and routing export/import
through native dialogs.

---

## D6 — No remote publication, ever

**Status:** accepted (2026-10-24)

**Decision.** All git activity is local. No `git push`, no remote creation, no releases,
no PRs. The original repository's remote configuration is left exactly as found. Each
increment ships with a suggested conventional commit message and a review checklist so the
user can publish on their own terms.

---

## D7 — electron-builder for packaging

**Status:** accepted (2026-10-24)

**Decision.** `electron-builder` 26 targeting macOS `arm64` `.dmg` first. `identity: null`
and `hardenedRuntime: false` because the app is not notarized (no Apple Developer account
available without the user's credentials); this is recorded as a known limitation rather
than hidden. Universal builds are evaluated after the Apple Silicon build works.
