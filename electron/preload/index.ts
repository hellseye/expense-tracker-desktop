import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import { IPC } from "../shared/channels";
import type {
  AnalyticsSummary,
  ApiResult,
  AppInfo,
  AppPreferences,
  CategoryDto,
  ExportResult,
  ExpenseDto,
  ExpenseListQuery,
  ExpenseListResult,
  ImportPayload,
  ImportPreview,
  ImportResult,
  ProfileDto,
  RendererCommand,
  StorageStatus,
} from "../shared/types";

/**
 * Preload bridge.
 *
 * This is the *only* surface the renderer can use to reach the main process.
 * It is a closed set of typed methods — no `invoke(channel, ...)` escape hatch,
 * no `ipcRenderer` exposure, no Node globals. The main process additionally
 * validates the sender and the payload of every call.
 */

function invoke<T>(channel: string, payload?: unknown): Promise<ApiResult<T>> {
  return ipcRenderer.invoke(channel, payload) as Promise<ApiResult<T>>;
}

const ledgerBridge = {
  /** Application metadata and environment. */
  getAppInfo: (): Promise<ApiResult<AppInfo>> => invoke<AppInfo>(IPC.APP_INFO),

  openExternal: (url: string): Promise<ApiResult<{ opened: boolean }>> =>
    invoke(IPC.APP_OPEN_EXTERNAL, { url }),

  /** Local identity. */
  getProfile: (): Promise<ApiResult<ProfileDto | null>> =>
    invoke<ProfileDto | null>(IPC.PROFILE_GET),

  createProfile: (input: {
    name: string;
    email: string;
    currency: string;
    passcode?: string;
  }): Promise<ApiResult<ProfileDto>> => invoke(IPC.PROFILE_CREATE, input),

  updateProfile: (input: {
    name?: string;
    email?: string;
    currency?: string;
    theme?: string;
  }): Promise<ApiResult<ProfileDto>> => invoke(IPC.PROFILE_UPDATE, input),

  verifyPasscode: (passcode: string): Promise<ApiResult<{ valid: boolean }>> =>
    invoke(IPC.PROFILE_VERIFY_PASSCODE, { passcode }),

  changePasscode: (input: {
    currentPasscode?: string;
    newPasscode?: string;
  }): Promise<ApiResult<{ changed: boolean }>> =>
    invoke(IPC.PROFILE_CHANGE_PASSCODE, input),

  deleteProfile: (): Promise<ApiResult<{ deleted: boolean }>> =>
    invoke(IPC.PROFILE_DELETE),

  /** Preferences. */
  getPreferences: (): Promise<ApiResult<AppPreferences>> =>
    invoke<AppPreferences>(IPC.PREFERENCES_GET),

  setPreferences: (input: Partial<AppPreferences>): Promise<ApiResult<AppPreferences>> =>
    invoke(IPC.PREFERENCES_SET, input),

  /** Categories. */
  listCategories: (): Promise<ApiResult<CategoryDto[]>> =>
    invoke<CategoryDto[]>(IPC.CATEGORY_LIST),

  createCategory: (input: {
    name: string;
    color: string;
    icon: string;
  }): Promise<ApiResult<CategoryDto>> => invoke(IPC.CATEGORY_CREATE, input),

  updateCategory: (input: {
    id: string;
    name?: string;
    color?: string;
    icon?: string;
  }): Promise<ApiResult<CategoryDto>> => invoke(IPC.CATEGORY_UPDATE, input),

  deleteCategory: (id: string): Promise<ApiResult<{ deleted: boolean }>> =>
    invoke(IPC.CATEGORY_DELETE, { id }),

  /** Expenses. */
  listExpenses: (query: ExpenseListQuery): Promise<ApiResult<ExpenseListResult>> =>
    invoke<ExpenseListResult>(IPC.EXPENSE_LIST, query),

  getExpense: (id: string): Promise<ApiResult<ExpenseDto>> =>
    invoke<ExpenseDto>(IPC.EXPENSE_GET, { id }),

  createExpense: (input: {
    title: string;
    amount: number;
    type: "EXPENSE" | "INCOME";
    expenseDate: string;
    paymentMethod: ExpenseDto["paymentMethod"];
    categoryId: string;
    notes?: string | null;
  }): Promise<ApiResult<ExpenseDto>> => invoke(IPC.EXPENSE_CREATE, input),

  updateExpense: (input: {
    id: string;
    title?: string;
    amount?: number;
    type?: "EXPENSE" | "INCOME";
    expenseDate?: string;
    paymentMethod?: ExpenseDto["paymentMethod"];
    categoryId?: string;
    notes?: string | null;
  }): Promise<ApiResult<ExpenseDto>> => invoke(IPC.EXPENSE_UPDATE, input),

  deleteExpense: (id: string): Promise<ApiResult<{ deleted: boolean }>> =>
    invoke(IPC.EXPENSE_DELETE, { id }),

  /** Analytics. */
  getAnalyticsSummary: (): Promise<ApiResult<AnalyticsSummary>> =>
    invoke<AnalyticsSummary>(IPC.ANALYTICS_SUMMARY),

  /** Backup and restore. */
  exportCsv: (): Promise<ApiResult<ExportResult>> => invoke<ExportResult>(IPC.EXPORT_CSV),

  exportJson: (): Promise<ApiResult<ExportResult>> => invoke<ExportResult>(IPC.EXPORT_JSON),

  validateImport: (payload: ImportPayload): Promise<ApiResult<ImportPreview>> =>
    invoke<ImportPreview>(IPC.IMPORT_VALIDATE, payload),

  applyImport: (payload: ImportPayload): Promise<ApiResult<ImportResult>> =>
    invoke<ImportResult>(IPC.IMPORT_APPLY, payload),

  /** Diagnostics. */
  getStorageStatus: (): Promise<ApiResult<StorageStatus>> =>
    invoke<StorageStatus>(IPC.STORAGE_STATUS),

  resetDatabase: (): Promise<ApiResult<{ reset: boolean }>> =>
    invoke(IPC.DB_RESET),

  /**
   * Subscribe to commands pushed from the main process (native menu actions).
   * Returns an unsubscribe function.
   */
  onCommand: (listener: (command: RendererCommand) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, command: RendererCommand): void =>
      listener(command);
    ipcRenderer.on("ledger:app.command", handler);
    return () => {
      ipcRenderer.removeListener("ledger:app.command", handler);
    };
  },
};

contextBridge.exposeInMainWorld("ledger", ledgerBridge);

export type LedgerBridge = typeof ledgerBridge;
