# Ledger Desktop — Roadmap

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

Source of truth: `https://github.com/hellseye/expense-tracker` (original, read-only reference).
Pristine snapshot of that repository: `reference/` in this project.

---

## Milestone 0 — Audit & isolation

- [x] Verify toolchain (git, node, npm, sqlite3, iconutil, sips, Xcode CLT).
- [x] Confirm original repo untouched (HEAD `727eb85`, remote `origin` intact).
- [x] Copy source into `~/coding/expense-tracker-desktop` without `node_modules`/`.next`/`.git`.
- [x] Snapshot pristine original to `reference/` (157 files).
- [x] Inventory every page, route, component, API and data model.
- [x] Identify cloud/server-only dependencies.
- [x] Write architecture proposal + migration plan.

## Milestone 1 — Project initialization (increment 001)

- [x] Restructure: `client/` (renderer) + `electron/` (runtime) + `docs/` + `assets/`.
- [x] Remove server-only code from the renderer build path (preserved in `reference/`).
- [x] Root `package.json`, `.gitignore`, local git init.
- [x] Docs: ROADMAP, DEVELOPMENT_LOG, DECISIONS, `commits/001-*.md`.

## Milestone 2 — Desktop foundation (increments 002–003)

- [ ] Next.js configured for fully static export (`output: "export"`).
- [ ] Electron main process: app lifecycle, window, menus, secure defaults.
- [ ] Preload script with `contextBridge` typed bridge.
- [ ] Custom protocol / file loading with SPA fallback for client routing.
- [ ] Minimal window renders the real UI shell before feature migration.
- [ ] Dev + production build scripts.

## Milestone 3 — Local persistence (increment 004)

- [ ] SQLite schema mirroring the Prisma data model (users, categories, expenses, settings).
- [ ] Database service in the Electron main process only.
- [ ] Data directory under `app.getPath('userData')` — never inside the app bundle.
- [ ] Schema versioning + safe migrations; no automatic data reset on launch.
- [ ] Field-level AES-256-GCM encryption for expense title/notes (ported behaviour).
- [ ] Default category seeding on first run only.

## Milestone 4 — Domain services in main (increment 005)

- [ ] Port expense service: list/create/update/delete, filters, search, sort, pagination.
- [ ] Port category service: CRUD, duplicate guard, delete-with-expenses guard.
- [ ] Port analytics service: totals, breakdowns, monthly trend, MoM, health score.
- [ ] CSV export/import with validation.
- [ ] Validated IPC handlers for every operation.

## Milestone 5 — Renderer wiring (increment 006)

- [ ] Replace `ApiClient` HTTP calls with the typed desktop bridge.
- [ ] Replace cloud auth with a local profile (onboarding on first launch).
- [ ] Preserve every view: dashboard, transactions, categories, analytics, settings, profile.
- [ ] Preserve business logic, calculations, filters, charts, toasts, empty states.

## Milestone 6 — Desktop UX & metadata (increment 007)

- [ ] Native menus, About panel, keyboard shortcuts.
- [ ] Native open/save dialogs for import/export.
- [ ] Application icon (Dock + bundle) generated from the existing brand SVG.
- [ ] About section rewritten to describe the real desktop app.
- [ ] Window sizing, persistence of window state, correct quit behaviour.

## Milestone 7 — Tests & hardening (increment 008)

- [ ] Typecheck + lint clean.
- [ ] Unit tests for analytics maths and persistence round-trips.
- [ ] Empty-state, invalid-input, duplicate-submission and storage-error handling.
- [ ] Restart persistence check; offline check; security-config audit.

## Milestone 8 — Packaging & delivery (increment 009)

- [ ] electron-builder config for macOS Apple Silicon `.dmg`.
- [ ] `.dmg` produced at a reported path.
- [ ] Installed app launched and smoke-tested.
- [ ] Data confirmed outside the bundle; no dev server required.
- [ ] Final report.

---

## Explicitly out of scope

- Any GitHub push, release, PR or repository creation (user-owned).
- Modifying the original repository or any other project in `~/coding`.
- Connecting to, migrating or deleting any existing PostgreSQL database.
- Shipping a Next.js server, dev server or remote backend inside the app.
