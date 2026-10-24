# Increment 001 — Project initialization

- **Date:** 2026-10-24
- **Feature / task:** Isolate the original repository, audit it, and scaffold the desktop project.
- **Status:** complete

## Reason for the change

The task requires a separate desktop project at `~/coding/expense-tracker-desktop` with the
original repository preserved untouched. Nothing can be built or verified before the source
is isolated and the target architecture is recorded.

## Files created or modified

**Created**

- `docs/ROADMAP.md` — milestones and live status.
- `docs/DEVELOPMENT_LOG.md` — dated session log.
- `docs/DECISIONS.md` — architecture decisions D1–D7.
- `docs/commits/001-project-initialization.md` — this file.
- `reference/**` — pristine 157-file snapshot of the original repository.
- `tsconfig.electron.json` — TypeScript config for the Electron main/preload sources.
- `.gitignore` — ignores build output, `node_modules`, and runtime database files.

**Modified**

- `package.json` — replaced the `ledger-monorepo` scripts with desktop scripts
  (`dev`, `build`, `build:renderer`, `build:electron`, `dist`, `typecheck`, `test`) and
  added the electron-builder configuration block.
- `client/package.json` — dropped `@prisma/client`, `better-auth`, `prisma`, `tsx`;
  renamed the package to `ledger-renderer`; `build` is now a plain `next build`.
- `client/next.config.ts` — `output: "export"`, `trailingSlash: true`, `images.unoptimized`.

**Deleted from the build path (preserved in `reference/`)**

- `client/src/server/**` (Next.js server-side controllers/services/repositories)
- `client/src/app/api/**` (route handlers)
- `client/src/middleware.ts`
- `client/src/lib/db/**`, `client/src/lib/logger/**`, `client/src/lib/store/**`, `client/src/lib/env.ts`
- `client/src/lib/auth/device-detector.ts`, `permissions.ts`, `session-service.ts`,
  `token-service.ts`, `get-authenticated-user.ts`
- `client/src/utils/crypto.ts`, `client/src/utils/jwt.ts`
- `server/**`, `prisma/**`, `vercel.json`, `next-env.d.ts`, `package-lock.json`,
  `client/prisma/**`, `client/vercel.json`, `client/tsconfig.tsbuildinfo`

## Implementation details

- The copy excluded `node_modules`, `.next`, `.git`, `.vscode`, `dist` and TypeScript
  build caches, so no build artefacts or secrets were carried over.
- The original `.env` files were **not** copied — they contain `DATABASE_URL`,
  `JWT_SECRET`, `BETTER_AUTH_SECRET` and Google OAuth credentials. The desktop application
  has no use for them and must not ship them.
- `reference/` is a byte-for-byte snapshot taken before any modification, so every later
  increment can be diffed against the true original.
- Local git was initialised with no remote.

## Tests executed and actual results

| Check | Command | Result |
| --- | --- | --- |
| Original untouched | `git -C ~/coding/expense-tracker status --porcelain` | Only `?? .vscode/` (pre-existing). PASS |
| Original HEAD unchanged | `git -C ~/coding/expense-tracker rev-parse HEAD` | `727eb851a0be1c7ebd8c0c346e5417ab65bfe6bc`. PASS |
| Original remote intact | `git -C ~/coding/expense-tracker remote -v` | `origin https://github.com/hellseye/expense-tracker.git`. PASS |
| Copy completeness | `find . -type f \| wc -l` | 157 files. PASS |
| Reference snapshot | `find reference -type f \| wc -l` | 157 files. PASS |
| Toolchain | `node`, `npm`, `sqlite3`, `python3`, `iconutil`, `xcode-select -p` | All present. PASS |
| Registry reachable | `curl -o /dev/null -w '%{http_code}' https://registry.npmjs.org/electron-builder` | 200. PASS |

No application build or run has happened yet — there is no application code in this increment.

## Known limitations

- The renderer still contains the old `ApiClient` (HTTP) and JWT `auth-context`; neither can
  work in a static export. They are replaced in increments 004–006.
- No Electron process, no database, no IPC bridge yet.

## Suggested conventional commit message

```
chore: initialize desktop project

Isolate the original expense-tracker source into a separate desktop
project, snapshot it under reference/, and scaffold the Next.js +
Electron structure with a static-export renderer configuration.
```

## Checklist — review before committing

- [ ] `reference/` matches the original repository exactly (157 files, no `.env`).
- [ ] No `.env`, credential or secret file exists anywhere in the project.
- [ ] `~/coding/expense-tracker` is unchanged: `cd ~/coding/expense-tracker && git status`.
- [ ] `client/next.config.ts` sets `output: "export"` and `trailingSlash: true`.
- [ ] `client/package.json` no longer references Prisma or better-auth.
- [ ] `docs/ROADMAP.md`, `docs/DEVELOPMENT_LOG.md`, `docs/DECISIONS.md` are present and accurate.
- [ ] `git status` shows only intended files; no build artefacts staged.
