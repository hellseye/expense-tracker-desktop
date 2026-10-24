import {
  app,
  dialog,
  ipcMain,
  shell,
  type BrowserWindow,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  type WebContents,
} from "electron";
import { z } from "zod";
import { IPC } from "../shared/channels";
import type { ApiResult, AppInfo, RendererCommand } from "../shared/types";
import { describeDataDir, resolveRendererDir } from "./paths";

/**
 * IPC registration entry point.
 *
 * Every handler is registered explicitly and every payload is validated before
 * it reaches application code. There is deliberately no generic
 * `ipcMain.handle("*")` fallback: an unregistered channel simply never resolves
 * on the renderer side, because the preload never exposes a raw `invoke`.
 */

let mainWindowRef: BrowserWindow | null = null;

export function bindMainWindow(window: BrowserWindow | null): void {
  mainWindowRef = window;
}

export function registerIpcHandlers(): void {
  registerApplicationHandlers();
  registerProfileHandlers();
  registerCategoryHandlers();
  registerExpenseHandlers();
  registerAnalyticsHandlers();
  registerBackupHandlers();
  registerDiagnosticsHandlers();
}

/** Guards that a message originates from our own renderer. */
export function isTrustedSender(sender: WebContents | undefined): boolean {
  if (!sender || sender.isDestroyed()) return false;
  if (!mainWindowRef || mainWindowRef.isDestroyed()) return false;
  return sender.id === mainWindowRef.webContents.id;
}

function trusted(event: IpcMainInvokeEvent): boolean {
  return isTrustedSender(event.sender);
}

/**
 * Wraps a handler with sender validation, payload validation and a uniform
 * `ApiResult` envelope so the renderer always sees the same shape the original
 * HTTP API produced.
 */
export function handle<TSchema extends z.ZodTypeAny, TResult>(
  channel: string,
  schema: TSchema | null,
  fn: (payload: z.infer<TSchema>, event: IpcMainInvokeEvent) => Promise<TResult> | TResult,
): void {
  ipcMain.handle(channel, async (event, payload) => {
    if (!trusted(event)) {
      return envelopeError("Untrusted sender");
    }

    let parsed: z.infer<TSchema> = payload as z.infer<TSchema>;

    if (schema) {
      const result = schema.safeParse(payload);
      if (!result.success) {
        return {
          success: false,
          error: "Validation failed",
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        } satisfies ApiResult<never>;
      }
      parsed = result.data;
    }

    try {
      const data = await fn(parsed, event);
      return { success: true, data } satisfies ApiResult<TResult>;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return envelopeError(message);
    }
  });
}

function envelopeError(message: string): ApiResult<never> {
  return { success: false, error: message };
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

function registerApplicationHandlers(): void {
  handle(IPC.APP_INFO, null, (): AppInfo => {
    const rendererPath = resolveRendererDir();
    return {
      name: app.name,
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      isPackaged: app.isPackaged,
      isDev: process.env.LEDGER_DEV === "1",
      dataPath: describeDataDir(),
      rendererPath,
      chromeVersion: process.versions.chrome ?? "unknown",
      electronVersion: process.versions.electron ?? "unknown",
      nodeVersion: process.versions.node ?? "unknown",
    };
  });

  const openExternalSchema = z.object({
    url: z.string().url(),
  });

  handle(IPC.APP_OPEN_EXTERNAL, openExternalSchema, ({ url }) => {
    void shell.openExternal(url);
    return { opened: true };
  });

  // Renderer -> main command channel used by the native menu.
  ipcMain.on("ledger:app.command", (event: IpcMainEvent, command: RendererCommand) => {
    if (!isTrustedSender(event.sender)) return;
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send("ledger:app.command", command);
    }
  });
}

// ---------------------------------------------------------------------------
// Feature handlers live in their own modules and are registered here so the
// channel list stays the single source of truth.
// ---------------------------------------------------------------------------

function registerProfileHandlers(): void {
  // Implemented in increment 003.
}

function registerCategoryHandlers(): void {
  // Implemented in increment 004.
}

function registerExpenseHandlers(): void {
  // Implemented in increment 004.
}

function registerAnalyticsHandlers(): void {
  // Implemented in increment 004.
}

function registerBackupHandlers(): void {
  // Implemented in increment 005.
}

function registerDiagnosticsHandlers(): void {
  // Implemented in increment 004.
}

/**
 * Native save dialog helper shared by the export handlers.
 */
export function showSaveDialog(
  defaultFileName: string,
  extensions: string[],
): Promise<string | null> {
  return new Promise((resolve) => {
    const window = mainWindowRef;
    if (!window || window.isDestroyed()) {
      resolve(null);
      return;
    }

    void dialog
      .showSaveDialog(window, {
        defaultPath: defaultFileName,
        filters: [{ name: "Files", extensions }],
        properties: ["createDirectory", "showOverwriteConfirmation"],
      })
      .then((result) => {
        resolve(result.canceled ? null : (result.filePath ?? null));
      })
      .catch(() => resolve(null));
  });
}

export function showOpenDialog(extensions: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    const window = mainWindowRef;
    if (!window || window.isDestroyed()) {
      resolve(null);
      return;
    }

    void dialog
      .showOpenDialog(window, {
        filters: [{ name: "Files", extensions }],
        properties: ["openFile"],
      })
      .then((result) => {
        resolve(result.canceled ? null : (result.filePaths[0] ?? null));
      })
      .catch(() => resolve(null));
  });
}
