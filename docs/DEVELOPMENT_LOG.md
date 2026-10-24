# Development Log

Dated work sessions. Newest session last.

---

## Session 1 — 2026-10-24

**Goal:** Isolate the original repository, audit it completely, and lay the desktop foundation.

### Environment verified

| Tool | Version / state |
| --- | --- |
| macOS | 27.0 (Build 26A428), Apple Silicon (`arm64`) |
| git | 2.50.1 (Apple Git-155) |
| node | v25.9.0 |
| npm | 11.12.1 |
| pnpm | 11.5.2 (available, unused) |
| sqlite3 CLI | 3.54.0 |
| python3 | 3.14.3 (needed by node-gyp) |
| Xcode CLT | `/Library/Developer/CommandLineTools` |
| iconutil / sips | present (icon generation) |
| Disk free | ~145 GiB |
| Load average | 2.80 / 3.04 / 3.06 |

No `electron-builder` or `yarn` present globally — both installed as project dev dependencies.

### Original repository state (read-only, verified untouched)

- Path: `~/coding/expense-tracker`
- Remote: `https://github.com/hellseye/expense-tracker.git`
- HEAD: `727eb851a0be1c7ebd8c0c346e5417ab65bfe6bc` (`Remove temporary debug logs from authentication route handlers`)
- Working tree: clean except a pre-existing untracked `.vscode/` directory (was there before this work started)
- No commits, checkouts, resets or remote operations were performed against it.

### Source audit — what the original application actually is

The repository is a monorepo named `ledger-monorepo` containing:

- `client/` — Next.js 15 App Router frontend (React 19, TypeScript, Tailwind 3, react-query, react-hook-form + zod, recharts, framer-motion, lucide-react).
- `client/src/server/**` — server-side controllers/services/repositories that the App Router route handlers call.
- `client/src/app/api/**` — Next.js route handlers (expenses, categories, analytics, dashboard, user profile, auth, better-auth, CSV export, bug report).
- `client/prisma/schema.prisma` — PostgreSQL schema (User, Session, Account, Verification, Category, Expense + `PaymentMethod` enum).
- `server/` — a separate Express + Prisma HTTP backend (`/api/v1/*`) that duplicates the same domain logic.
- `prisma/seed.ts` — seeds one user (`mayank@ledger.dev`) plus six default categories and expenses.

**Data model (Expense)**: `id`, `userId`, `categoryId`, `title`, `amount` (Decimal 12,2), `paymentMethod` (CASH | CREDIT_CARD | DEBIT_CARD | BANK_TRANSFER | UPI | OTHER), `expenseDate`, `notes`, timestamps.
**Category**: `id`, `userId`, `name` (unique per user, case-insensitive), `icon`, `color`.
**User**: `id`, `name`, `email` (unique), `emailVerified`, `image`, `passwordHash`, `currency` (default INR), `theme` (default dark).

**Cloud / server-only dependencies identified (must be replaced):**

1. PostgreSQL via Prisma (`DATABASE_URL`) — including the user's own local Postgres, which must not be touched.
2. Next.js route handlers + Node server runtime (`next build` / `next start`).
3. JWT session cookies (`ledger_session`) and `auth_token` in `localStorage`.
4. better-auth with Google OAuth (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`).
5. bcrypt password hashing for the credential login flow.
6. AES-256-GCM field encryption keyed off `JWT_SECRET` / `NEXTAUTH_SECRET`.
7. Express backend in `server/` (redundant with the route handlers).
8. Bug-report endpoint that emails the developer.
9. Vercel deployment config (`vercel.json`).

**Feature inventory (renderer):**

| Area | Features |
| --- | --- |
| Routes | `/` → `/dashboard`, `/login`, `/register`, `/dashboard`, `/transactions`, `/categories`, `/analytics`, `/settings`, `/profile` |
| Shell | 80px dock sidebar + mobile bottom dock, navbar with greeting/date, ambient radial glow, quick-add modal provider |
| Dashboard | Total Expenses + Today's Spending stat cards, 6-month monthly spending area chart, recent transactions list (5), delete |
| Transactions | Search (debounced 300 ms), category filter, payment-method filter, sort by title/date/amount, pagination (10/page), edit, delete with confirmation modal, CSV export |
| Categories | Grid of category cards with icon/colour, create/edit modal, delete with confirmation, expense-count guard |
| Analytics | Highest expense, daily average, top category, category distribution pie, monthly trend, payment-method breakdown, financial health score, month-over-month comparison, top spending categories list |
| Expense form | Expense/Income segmented switch, calculator-style amount with +100/+500/+1000 presets and clear, title, on-the-spot category creator, category grid, payment-method grid, date, notes |
| Settings | General (currency), Appearance (theme + accent colour/gradient), Backup & Export (CSV), Privacy & Security, About |
| Profile | Name/email/currency, export profile JSON, download expenses CSV, change password, sign out |
| Student audit modal | Survival calculator, food/outings breakdown, AI money hacks, copy/download report |
| Shared | Modal, toast, empty state, dropdown, table, badge, skeleton, keyboard shortcut (⌘N) |

### Work completed this session

1. Created `~/coding/expense-tracker-desktop` and copied the source in (157 files, excluding `node_modules`, `.next`, `.git`, build caches).
2. Snapshotted the pristine original to `reference/` for audit and diffing.
3. Removed server-only code from the renderer build path (preserved in `reference/`): `client/src/server/`, `client/src/app/api/`, `client/src/middleware.ts`, `client/src/lib/db/`, `client/src/lib/logger/`, `client/src/lib/store/`, `client/src/lib/env.ts`, the JWT/crypto/auth-helper modules, `server/`, `prisma/`, `vercel.json`.
4. Created the new module layout: `electron/main/`, `electron/preload/`, `electron/shared/`, `docs/`, `assets/`, `scripts/`.
5. Wrote root `package.json` (Electron 45, electron-builder 26, better-sqlite3 13, TypeScript 5.7), `tsconfig.electron.json`, and `.gitignore`.
6. Configured `client/next.config.ts` for static export and trimmed `client/package.json` (dropped Prisma, better-auth, tsx).
7. Wrote `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/commits/001-project-initialization.md`.
8. Initialised a local git repository (no remote).

### Tests executed

- `git -C ~/coding/expense-tracker status --porcelain` → only `?? .vscode/` (pre-existing). Original untouched.
- `git -C ~/coding/expense-tracker rev-parse HEAD` → `727eb851a0be1c7ebd8c0c346e5417ab65bfe6bc`.
- File counts: source copy 157 files; `reference/` snapshot 157 files.
- Network reachability: `registry.npmjs.org` 200, `github.com` 200.

### Known limitations at this stage

- No application code has been written yet; the renderer still contains the old `ApiClient` HTTP layer and JWT auth context, which will not work in a static export.
- No database, no IPC bridge, no Electron main process yet.
- Nothing has been built or run.

### Next step

Increment 002 — Electron foundation: main process, preload bridge, secure window, static-export protocol handler, dev runner script. Verify the real UI shell renders in an Electron window before migrating any feature.
