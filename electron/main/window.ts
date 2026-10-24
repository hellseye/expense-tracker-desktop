import {
  app,
  BrowserWindow,
  shell,
  type WebContents,
} from "electron";
import path from "node:path";

export const WINDOW_DEFAULTS = {
  width: 1440,
  height: 900,
  minWidth: 1120,
  minHeight: 720,
} as const;

/**
 * Creates the main application window with hardened defaults:
 * `contextIsolation` on, `nodeIntegration` off, renderer sandbox on, and no
 * direct Node access from the page. Navigation is restricted to the app's own
 * protocol and external links are handed to the OS browser.
 */
export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    ...WINDOW_DEFAULTS,
    show: false,
    backgroundColor: "#0d0d12",
    title: "Ledger",
    // Native macOS window controls, inset so content does not collide with them.
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      allowRunningInsecureContent: false,
    },
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  // Restrict navigation: only our own protocol and the dev server.
  window.webContents.on("will-navigate", (event, url) => {
    const allowed = url.startsWith("app://") || url.startsWith("http://localhost:3001");
    if (!allowed) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  // Never allow the renderer to spawn arbitrary new windows.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("app://")) {
      return { action: "allow" };
    }
    void shell.openExternal(url);
    return { action: "deny" };
  });

  // Webviews have no place in a local expense tracker.
  window.webContents.on("did-attach-webview", (event) => {
    event.preventDefault();
  });

  return window;
}

/**
 * Denies permission requests that a local expense tracker has no reason to make
 * (camera, microphone, geolocation, notifications, MIDI, ...).
 */
export function denyUnhandledPermissions(contents: WebContents): void {
  contents.session.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });

  contents.session.setPermissionCheckHandler(() => false);
}

export { app };
