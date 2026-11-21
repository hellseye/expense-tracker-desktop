# Expense Tracker — Desktop

A personal expense tracker rebuilt as a desktop app while learning Electron.
Stack: **Electron + React + Vite, plain JavaScript only** (no TypeScript).

The original project sits in `01_reference/` (git-ignored). It is a read-only
reference — we look at it for ideas, never modify it, and don't copy its code.
It used Next.js + TypeScript + a server; this version is intentionally much
simpler.

## Current progress

Step 1 — Electron initialization (done):

- Electron opens a window and loads the React app.
- In development it loads the Vite dev server; the built `dist/` is loaded
  from disk once the app is packaged (later step).
- A small preload script exposes runtime info to the page as `window.desktop`.
- The React page is just a placeholder shell — no features yet.

## Files

```
expense-tracker-desktop/
├── 01_reference/        original project (read-only, git-ignored)
├── electron/
│   ├── main.js        creates the window, loads the app
│   └── preload.js     bridge: exposes window.desktop to the page
├── src/
│   ├── main.jsx       React entry point
│   ├── App.jsx        placeholder page
│   └── index.css      basic styles
├── scripts/
│   └── dev.js         starts Vite, then starts Electron
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Setup and run

Needs Node.js 22.12+ and npm (tested on Node 25).

```bash
npm install
npm run dev      # starts Vite + Electron, opens the app window
```

Stop with Ctrl+C (on macOS you can also Cmd+Q the app).

```bash
npm run build    # builds the React app into dist/
```

## How it works

- `npm run dev` runs `scripts/dev.js`: it starts the Vite dev server on
  http://localhost:5173, then launches Electron.
- `electron/main.js` creates the window. While developing (`app.isPackaged`
  is false) it loads the Vite URL; a packaged app loads `dist/index.html`.
- `electron/preload.js` runs before the page and uses `contextBridge` to
  expose `window.desktop` (platform + Electron/Chrome/Node versions).
  `src/App.jsx` displays it.

Security basics kept on purpose: `contextIsolation: true` and
`nodeIntegration: false`, so the web page cannot use Node.js directly.
Anything the page needs from Electron goes through the preload bridge.

## Next steps

1. Build the actual UI (dashboard, transactions, categories, ...).
2. Store data locally (SQLite in the main process).
3. Connect page ↔ main process with IPC for real features.
4. Package the app for macOS.

## Ground rules

- JavaScript only, never TypeScript.
- Keep the code simple and beginner-friendly: only what the current step
  needs, no extra tools, tests or abstractions ahead of time. Everything
  should be easy to explain in a viva.
- Simple does not mean insecure: keep the essential Electron security
  settings above.
- Never modify `01_reference/`.
