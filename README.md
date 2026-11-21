# Expense Tracker — Desktop

A personal expense tracker rebuilt as a desktop app while learning Electron.
Stack: **Electron + React + Vite + SQLite, plain JavaScript only** (no
TypeScript, no ORM).

The original project sits in `01_reference/` (git-ignored). It is a read-only
reference — we look at it for ideas, never modify it, and don't copy its code.
It used Next.js + TypeScript + a server; this version is intentionally much
simpler and runs fully offline on one laptop.

## Current progress

Step 1 — Electron initialization (done):

- Electron opens a window and loads the React app.
- In development it loads the Vite dev server; the built `dist/` is loaded
  from disk once the app is packaged (later step).
- A small preload script exposes runtime info to the page as `window.desktop`.

Step 03 — React project structure (done):

- `src/` organized into `pages/`, `styles/` and `assets/`.
- The placeholder screen moved to `src/pages/Home.jsx`; `App.jsx` is the root
  component that renders it.
- App icon (from the original design) added in `src/assets/` and used as the
  favicon.

Step — SQLite database layer (done):

- `better-sqlite3` installed and rebuilt for Electron.
- Database created automatically on startup in the user-data folder.
- Three tables (`categories`, `transactions`, `settings`), foreign keys and
  indexes in place, six default categories seeded once.

Step — IPC communication layer (done):

- React can now read from SQLite through a safe IPC bridge.
- `Home.jsx` displays categories and transactions live from the database.

Step — Transaction CRUD (done):

- Add, edit and delete income/expense transactions from a simple form in
  `Home.jsx` (temporary test UI, not the final design).
- All queries are parameterized and stay in the main process.
- Missing/invalid ids and bad category ids are rejected with clear errors.
- Verified: changes persist across an Electron restart.

## Files

```
expense-tracker-desktop/
├── 01_reference/        original project (read-only, git-ignored)
├── electron/
│   ├── main.js          app entry: DB init, IPC handlers, window
│   ├── preload.js       bridge: window.desktop + window.api (no raw IPC)
│   ├── database/
│   │   ├── connection.js  opens the SQLite file, sets WAL + foreign keys
│   │   ├── schema.js      creates tables and indexes (IF NOT EXISTS)
│   │   └── seed.js        inserts the 6 default categories when empty
│   └── handlers/
│       └── databaseHandlers.js  ipcMain.handle: category reads + transaction CRUD
├── src/
│   ├── assets/          images and icons (icon.svg = app icon / favicon)
│   ├── pages/           one file per screen
│   │   └── Home.jsx     placeholder screen + transaction CRUD test form
│   ├── styles/
│   │   └── index.css    global styles
│   ├── App.jsx          root component, renders the current page
│   └── main.jsx         React entry point
├── scripts/
│   └── dev.js           starts Vite, then starts Electron
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Setup and run

Needs Node.js 22.12+ and npm (tested on Node 25).

```bash
npm install
# better-sqlite3 is a native module: rebuild it for Electron's Node version
npx @electron/rebuild -f -w better-sqlite3

npm run dev      # starts Vite + Electron, opens the app window
```

Stop with Ctrl+C (on macOS you can also Cmd+Q the app).

```bash
npm run build    # builds the React app into dist/
```

## Database

- **Library:** `better-sqlite3` — small, synchronous SQLite driver. No ORM.
- **Location:** `~/Library/Application Support/ExpenseTracker/expense-tracker.db`
  (Electron's `app.getPath('userData')`). User data lives outside the project
  and survives app updates and packaging. The app name is set with
  `app.setName('ExpenseTracker')` in `electron/main.js`.
- **Initialization:** when Electron is ready, `main.js` calls `createTables()`,
  `seedCategories()`, `registerDatabaseHandlers()`, then opens the window.
  Every statement uses `IF NOT EXISTS` / count checks, so restarting never
  duplicates anything.
- **Rules:** all SQLite queries run in the Electron main process only. React
  never touches SQLite, and the connection is never exposed through preload.

Tables:

| Table          | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `categories`   | id, name (unique), color, icon, created_at                     |
| `transactions` | id, title, amount (> 0), type ('expense'/'income'), category_id → categories(id) ON DELETE RESTRICT, payment_method, date, notes, created_at |
| `settings`     | key/value pairs (currency, theme — used in a later step)       |

Indexes: `transactions(date)` and `transactions(category_id)` for fast
filtering and dashboard totals. Foreign key enforcement is ON
(`PRAGMA foreign_keys = ON`), so a transaction must reference a real
category, and a category that has transactions cannot be deleted.

## IPC communication

Data flows one way at a time, request → response:

```
React (Home.jsx)
  → window.api.getCategories()            preload: contextBridge
  → ipcRenderer.invoke('get-categories')  preload: the only place IPC is used
  → ipcMain.handle('get-categories')      main: databaseHandlers.js
  → db.prepare('SELECT ...').all()        main: better-sqlite3
  → rows returned as a Promise result, React renders them
```

Channels:

| Channel              | Preload function                      | What it does                     |
| -------------------- | ------------------------------------- | -------------------------------- |
| `get-categories`     | `window.api.getCategories()`          | all categories, by id            |
| `get-transactions`   | `window.api.getTransactions()`        | all transactions, newest first   |
| `add-transaction`    | `window.api.addTransaction(data)`     | INSERT, returns the new id       |
| `update-transaction` | `window.api.updateTransaction(data)`  | UPDATE by id, errors if missing  |
| `delete-transaction` | `window.api.deleteTransaction(id)`    | DELETE by id, errors if missing  |

Transaction data uses camelCase in JavaScript (`categoryId`, `paymentMethod`)
and maps to the snake_case columns in SQL. The form's "Description" field is
the `title` column. There is no account id in the schema — `payment_method`
(CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, UPI, OTHER) covers it.

Safety rules:

- `contextBridge` exposes only these named functions — never `ipcRenderer`
  itself and never the database connection.
- The renderer cannot call arbitrary channels; it can only use what preload
  exposes.
- All SQL stays in `electron/handlers/databaseHandlers.js` (main process).
- Errors (e.g. "Transaction not found", foreign-key violations) are thrown
  in the handler; `invoke` rejects and React shows the message.

## How it works

- `npm run dev` runs `scripts/dev.js`: it starts the Vite dev server on
  http://localhost:5173, then launches Electron.
- `electron/main.js` initializes the database, registers IPC handlers, then
  creates the window. While developing (`app.isPackaged` is false) it loads
  the Vite URL; a packaged app loads `dist/index.html`.
- `electron/preload.js` runs before the page and uses `contextBridge` to
  expose `window.desktop` (runtime info) and `window.api` (database reads +
  transaction CRUD). `src/pages/Home.jsx` uses both.

Security basics kept on purpose: `contextIsolation: true` and
`nodeIntegration: false`, so the web page cannot use Node.js directly.
Anything the page needs from Electron goes through the preload bridge.

## What the original app has (to recreate, simplified)

Screens: Dashboard, Transactions, Categories, Analytics, Profile, Settings
(plus Login/Register — auth is skipped in this local-first rebuild).

Layout: a narrow icon sidebar on the left (Dashboard, Transactions,
Categories, Analytics, Add Expense, Settings at the bottom, profile avatar on
top), a top navbar (greeting + date, "New Expense" button), and the page
content in a rounded card. Dark theme with a purple/indigo accent. A global
"quick add expense" modal opens from the sidebar, navbar or Cmd+N.

We will rebuild this with plain CSS and simple state-based navigation — no
router, Tailwind, icon or chart libraries until a step genuinely needs them.

## Next steps

1. Category CRUD (add/edit/delete categories) over the same IPC pattern.
2. UI: layout (sidebar + navbar), then the screens one by one
   (Categories, Transactions, Dashboard, Analytics, Settings), replacing
   the temporary Home.jsx test form.
3. CSV export.
4. Package the app for macOS.

## Ground rules

- JavaScript only, never TypeScript.
- Keep the code simple and beginner-friendly: only what the current step
  needs, no extra tools, tests or abstractions ahead of time. Everything
  should be easy to explain in a viva.
- Simple does not mean insecure: keep the essential Electron security
  settings above.
- Never modify `01_reference/`.
