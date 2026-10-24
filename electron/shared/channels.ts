/**
 * Canonical IPC channel names.
 *
 * Every channel is namespaced with `ledger:` and every handler is registered
 * explicitly in `electron/main/ipc.ts`. The preload never exposes a generic
 * `invoke(channel, ...)` escape hatch, so the renderer cannot reach a channel
 * that the main process has not deliberately implemented.
 */

export const IPC = {
  // Application
  APP_INFO: "ledger:app.info",
  APP_COMMAND: "ledger:app.command",
  APP_OPEN_EXTERNAL: "ledger:app.openExternal",

  // Profile / local identity
  PROFILE_GET: "ledger:profile.get",
  PROFILE_CREATE: "ledger:profile.create",
  PROFILE_UPDATE: "ledger:profile.update",
  PROFILE_VERIFY_PASSCODE: "ledger:profile.verifyPasscode",
  PROFILE_CHANGE_PASSCODE: "ledger:profile.changePasscode",
  PROFILE_DELETE: "ledger:profile.delete",

  // Preferences
  PREFERENCES_GET: "ledger:preferences.get",
  PREFERENCES_SET: "ledger:preferences.set",

  // Categories
  CATEGORY_LIST: "ledger:category.list",
  CATEGORY_CREATE: "ledger:category.create",
  CATEGORY_UPDATE: "ledger:category.update",
  CATEGORY_DELETE: "ledger:category.delete",

  // Expenses
  EXPENSE_LIST: "ledger:expense.list",
  EXPENSE_GET: "ledger:expense.get",
  EXPENSE_CREATE: "ledger:expense.create",
  EXPENSE_UPDATE: "ledger:expense.update",
  EXPENSE_DELETE: "ledger:expense.delete",

  // Analytics
  ANALYTICS_SUMMARY: "ledger:analytics.summary",

  // Backup / restore
  EXPORT_CSV: "ledger:export.csv",
  EXPORT_JSON: "ledger:export.json",
  IMPORT_VALIDATE: "ledger:import.validate",
  IMPORT_APPLY: "ledger:import.apply",
  DIALOG_SAVE: "ledger:dialog.save",
  DIALOG_OPEN: "ledger:dialog.open",

  // Diagnostics
  STORAGE_STATUS: "ledger:storage.status",
  DB_RESET: "ledger:db.reset",
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];
