import {
  app,
  BrowserWindow,
  Menu,
  shell,
  type MenuItemConstructorOptions,
} from "electron";

const isDev = process.env.LEDGER_DEV === "1";

/**
 * Builds the native macOS application menu.
 *
 * Beyond making the app behave like a real desktop application, the File menu is
 * the natural home for the desktop-only backup features (native save/open
 * dialogs), and the Ledger menu carries the quick-add shortcut so it works from
 * any focused control.
 */
export function buildMenu(getWindow: () => BrowserWindow | null): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        {
          label: `About ${app.name}`,
          click: () => {
            const window = getWindow();
            if (!window || window.isDestroyed()) return;
            window.webContents.send("ledger:app.command", "about");
          },
        },
        { type: "separator" },
        {
          label: "Settings…",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            const window = getWindow();
            if (!window || window.isDestroyed()) return;
            window.webContents.send("ledger:app.command", "open-settings");
          },
        },
        { type: "separator" },
        { role: "services", label: "Services" },
        { type: "separator" },
        { role: "hide", label: `Hide ${app.name}` },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit", label: `Quit ${app.name}` },
      ],
    },
    {
      label: "File",
      submenu: [
        {
          label: "New Expense",
          accelerator: "CmdOrCtrl+N",
          click: () => sendCommand(getWindow, "quick-add"),
        },
        { type: "separator" },
        {
          label: "Export CSV…",
          accelerator: "CmdOrCtrl+E",
          click: () => sendCommand(getWindow, "export-csv"),
        },
        {
          label: "Import Data…",
          accelerator: "CmdOrCtrl+I",
          click: () => sendCommand(getWindow, "import-data"),
        },
        { type: "separator" },
        {
          label: "Close Window",
          accelerator: "CmdOrCtrl+W",
          role: "close",
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo", label: "Undo" },
        { role: "redo", label: "Redo" },
        { type: "separator" },
        { role: "cut", label: "Cut" },
        { role: "copy", label: "Copy" },
        { role: "paste", label: "Paste" },
        { role: "selectAll", label: "Select All" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload", label: "Reload" },
        { role: "forceReload", label: "Force Reload" },
        { role: "toggleDevTools", label: "Toggle Developer Tools" },
        { type: "separator" },
        { role: "resetZoom", label: "Actual Size" },
        { role: "zoomIn", label: "Zoom In" },
        { role: "zoomOut", label: "Zoom Out" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Toggle Full Screen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize", label: "Minimize" },
        { role: "zoom", label: "Zoom" },
        { type: "separator" },
        { role: "front", label: "Bring All to Front" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: `${app.name} Help`,
          click: () => {
            void shell.openExternal(
              "https://github.com/hellseye/expense-tracker#readme",
            );
          },
        },
      ],
    },
  ];

  if (isDev) {
    template.push({
      label: "Developer",
      submenu: [
        {
          label: "Open Dev Tools",
          click: () => {
            const window = getWindow();
            if (window && !window.isDestroyed()) window.webContents.openDevTools();
          },
        },
      ],
    } as MenuItemConstructorOptions);
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

function sendCommand(getWindow: () => BrowserWindow | null, command: string): void {
  const window = getWindow();
  if (!window || window.isDestroyed()) return;
  window.webContents.send("ledger:app.command", command);
}
