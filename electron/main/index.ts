import { app, BrowserWindow, session } from "electron";
import { buildMenu } from "./menu";
import { bindMainWindow, registerIpcHandlers } from "./ipc";
import { registerRendererProtocol, rendererEntryPoint, registerPrivilegedSchemes } from "./protocol";
import { createMainWindow, denyUnhandledPermissions, WINDOW_DEFAULTS } from "./window";
import { resolveRendererDir } from "./paths";
import { runSmokeTest } from "./smoke";

// Must run before the app is ready so the scheme has a real origin.
registerPrivilegedSchemes();

const isDev = process.env.LEDGER_DEV === "1";
const DEV_RENDERER_URL = process.env.LEDGER_RENDERER_URL || "http://localhost:3001";

let mainWindow: BrowserWindow | null = null;

function loadRenderer(window: BrowserWindow): void {
  if (isDev) {
    void window.loadURL(DEV_RENDERER_URL);
    return;
  }
  void window.loadURL(rendererEntryPoint());
}

async function bootstrap(): Promise<void> {
  // The renderer protocol must be registered before any window loads it.
  registerRendererProtocol(resolveRendererDir());

  registerIpcHandlers();

  mainWindow = createMainWindow();
  bindMainWindow(mainWindow);
  denyUnhandledPermissions(mainWindow.webContents);

  // In development the renderer is served by the Next dev server, which sends no
  // CSP of its own, so one is injected here. In production the protocol handler
  // attaches the policy to every response.
  if (isDev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
              "font-src 'self' data:; connect-src 'self' http://localhost:3001; " +
              "object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
          ],
        },
      });
    });
  }

  buildMenu(() => mainWindow);

  loadRenderer(mainWindow);

  if (process.env.LEDGER_SMOKE_TEST === "1") {
    runSmokeTest(mainWindow);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    bindMainWindow(null);
  });
}

app.on("ready", () => {
  void bootstrap();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void bootstrap();
  }
});

// Never open a second instance: focus the existing window instead.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

export { WINDOW_DEFAULTS };
