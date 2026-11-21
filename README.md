# Ledger — Desktop

Ledger is a personal expense tracker rebuilt as a desktop app while learning
Electron. Stack: **Electron + React + Vite + SQLite, plain JavaScript only**
(no TypeScript, no ORM).

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

- Add, edit and delete income/expense transactions through IPC.
- All queries are parameterized and stay in the main process.
- Missing/invalid ids and bad category ids are rejected with clear errors.
- Verified: changes persist across an Electron restart.

Step — Transaction Management UI (done):

- `src/pages/Transactions.jsx` is the app's screen: heading, Add Transaction
  button, table (description, category, date, type, amount, edit/delete).
- Add/edit form in a modal (`components/Modal.jsx` +
  `components/TransactionForm.jsx`), categories loaded from SQLite.
- Dark rounded-card design with purple accent, recreated from the reference
  in plain CSS. Empty-state message when there are no transactions.
- The old placeholder `Home.jsx` was removed; `App.jsx` renders Transactions.

Step — Dashboard (done):

- `src/pages/Dashboard.jsx`: Total Balance / Total Income / Total Expenses
  stat cards, monthly income-vs-expense bar chart (last 6 months),
  spending-by-category breakdown with percentage bars, income vs expense
  ratio bar, and the 5 most recent transactions with a View All link.
- All figures are computed from real SQLite data fetched through the
  existing IPC reads — no new channels, no hardcoded numbers, no chart
  library (charts are plain CSS bars).
- Simple top navigation in `App.jsx` switches between Dashboard and
  Transactions; zero states when the database is empty.
- Verified: totals, add/edit/delete updates, zero states, and correctness
  after an Electron restart.

Step — Categories Management + Ledger rename (done):

- `src/pages/Categories.jsx`: card grid of all categories with emoji icon,
  name, type badge (income/expense) and transaction count; add/edit in a
  modal (`components/CategoryForm.jsx` with icon + color pickers); delete
  with confirmation. Success/error feedback after every operation.
- Categories gained a `type` column ('expense'/'income'); older databases
  are upgraded automatically with a one-line ALTER TABLE migration.
- Delete is disabled in the UI for categories used by transactions, and the
  main-process handler refuses it too (friendly error + FK RESTRICT).
- Duplicate category names are rejected with a clear message.
- The app is now named **Ledger** (window title, nav brand, productName).
  The data folder moved to `~/Library/Application Support/Ledger/`.
- Verified: add/display/edit/delete, in-use protection, duplicate names,
  and persistence across an Electron restart.

Step — Account Management (done):

- `src/pages/Accounts.jsx`: card grid of accounts (Cash 💵 / Bank 🏦 /
  Wallet 👛) showing the current balance, type badge, transaction count and
  initial balance; add/edit in a modal (`components/AccountForm.jsx`);
  delete with confirmation; success/error feedback and empty state.
- New `accounts` table (name, type, initial_balance). Balance is computed in
  SQL: initial balance + income − expenses of the linked transactions.
- Transactions gained an optional `account_id` foreign key (ON DELETE
  RESTRICT), added to older databases by the same PRAGMA + ALTER TABLE
  migration pattern. The transaction form has an optional Account selector.
- Deleting an account with linked transactions is blocked: disabled button
  in the UI, friendly error in the handler, FK RESTRICT underneath.
- Verified: create/display/edit/delete, balance math with linked income and
  expenses, in-use protection, duplicate names, persistence after restart.

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
│       └── databaseHandlers.js  ipcMain.handle: category, account + transaction CRUD
├── src/
│   ├── assets/          images and icons (icon.svg = app icon / favicon)
│   ├── components/      reusable UI pieces
│   │   ├── Modal.jsx    modal shell (backdrop + card + close)
│   │   ├── StatCard.jsx dashboard stat card (label, value, subtitle)
│   │   ├── CategoryForm.jsx     category add/edit form (name, type, icon, color)
│   │   ├── AccountForm.jsx      account add/edit form (name, type, initial balance)
│   │   └── TransactionForm.jsx  add/edit form (amount, type, category, account, ...)
│   ├── pages/           one file per screen
│   │   ├── Dashboard.jsx     totals, charts, breakdown, recent transactions
│   │   ├── Transactions.jsx  transaction table + add/edit/delete
│   │   ├── Categories.jsx    category cards + add/edit/delete
│   │   └── Accounts.jsx      account cards with balances + add/edit/delete
│   ├── styles/
│   │   └── index.css    global styles (dark theme, table, modal, form, charts)
│   ├── App.jsx          top nav + page switching (Dashboard / Transactions / Categories / Accounts)
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
- **Location:** `~/Library/Application Support/Ledger/expense-tracker.db`
  (Electron's `app.getPath('userData')`). User data lives outside the project
  and survives app updates and packaging. The app name is set with
  `app.setName('Ledger')` in `electron/main.js`.
- **Initialization:** when Electron is ready, `main.js` calls `createTables()`,
  `seedCategories()`, `registerDatabaseHandlers()`, then opens the window.
  Every statement uses `IF NOT EXISTS` / count checks, so restarting never
  duplicates anything. `schema.js` also upgrades older databases with
  PRAGMA table_info checks + ALTER TABLE: the categories `type` column and
  the transactions `account_id` column are added if missing.
- **Rules:** all SQLite queries run in the Electron main process only. React
  never touches SQLite, and the connection is never exposed through preload.

Tables:

| Table          | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `categories`   | id, name (unique), type ('expense'/'income'), color, icon, created_at |
| `accounts`     | id, name (unique), type ('cash'/'bank'/'wallet'), initial_balance (≥ 0), created_at |
| `transactions` | id, title, amount (> 0), type ('expense'/'income'), category_id → categories(id) ON DELETE RESTRICT, account_id → accounts(id) ON DELETE RESTRICT (optional), payment_method, date, notes, created_at |
| `settings`     | key/value pairs (currency, theme — used in a later step)       |

Indexes: `transactions(date)`, `transactions(category_id)` and
`transactions(account_id)` for fast filtering and totals. Foreign key
enforcement is ON (`PRAGMA foreign_keys = ON`): a transaction must reference
a real category, may optionally reference an account, and neither a category
nor an account that has transactions can be deleted. Account balance =
initial_balance + linked income − linked expenses (computed in the
`get-accounts` query).

## IPC communication

Data flows one way at a time, request → response:

```
React (Transactions.jsx)
  → window.api.getCategories()            preload: contextBridge
  → ipcRenderer.invoke('get-categories')  preload: the only place IPC is used
  → ipcMain.handle('get-categories')      main: databaseHandlers.js
  → db.prepare('SELECT ...').all()        main: better-sqlite3
  → rows returned as a Promise result, React renders them
```

Channels:

| Channel              | Preload function                      | What it does                     |
| -------------------- | ------------------------------------- | -------------------------------- |
| `get-categories`     | `window.api.getCategories()`          | categories + transaction_count each |
| `add-category`       | `window.api.addCategory(data)`        | INSERT, rejects duplicate names  |
| `update-category`    | `window.api.updateCategory(data)`     | UPDATE by id, errors if missing  |
| `delete-category`    | `window.api.deleteCategory(id)`       | DELETE, refuses if in use        |
| `get-accounts`       | `window.api.getAccounts()`            | accounts + balance + transaction_count |
| `add-account`        | `window.api.addAccount(data)`         | INSERT, rejects duplicate names  |
| `update-account`     | `window.api.updateAccount(data)`      | UPDATE by id, errors if missing  |
| `delete-account`     | `window.api.deleteAccount(id)`        | DELETE, refuses if in use        |
| `get-transactions`   | `window.api.getTransactions()`        | all transactions, newest first   |
| `add-transaction`    | `window.api.addTransaction(data)`     | INSERT, returns the new id       |
| `update-transaction` | `window.api.updateTransaction(data)`  | UPDATE by id, errors if missing  |
| `delete-transaction` | `window.api.deleteTransaction(id)`    | DELETE by id, errors if missing  |

Transaction data uses camelCase in JavaScript (`categoryId`, `accountId`,
`paymentMethod`) and maps to the snake_case columns in SQL. The form's
"Description" field is the `title` column. `accountId` is optional (null =
no account); `payment_method` (CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER,
UPI, OTHER) is kept for compatibility and defaults to CASH.

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
  expose `window.desktop` (runtime info) and `window.api` (category, account
  + transaction CRUD). The page components use it for all data access.

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

1. Full app layout (sidebar like the reference) replacing the simple top nav.
2. Remaining screens: Analytics, Settings.
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
