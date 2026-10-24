/**
 * Shared contracts between the Electron main process, the preload bridge and the
 * renderer. This module is imported by both sides; it must stay free of any
 * Node.js or Electron runtime import so it can be loaded in every context.
 *
 * The DTO shapes intentionally mirror the original `client/src/types/index.ts`
 * so the existing UI keeps working without changes.
 */

export type PaymentMethod =
  | "CASH"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "BANK_TRANSFER"
  | "UPI"
  | "OTHER";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "BANK_TRANSFER",
  "UPI",
  "OTHER",
];

export type TransactionType = "EXPENSE" | "INCOME";

export interface CategoryDto {
  id: string;
  name: string;
  color: string;
  icon: string;
  expenseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseDto {
  id: string;
  title: string;
  /** Stored as a decimal-safe number, rounded to 2 decimal places on read. */
  amount: number;
  type: TransactionType;
  expenseDate: string;
  notes: string | null;
  paymentMethod: PaymentMethod;
  categoryId: string;
  category: CategoryDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListResult {
  expenses: ExpenseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface PaymentMethodBreakdownItem {
  method: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrendItem {
  month: string;
  amount: number;
}

export interface TopCategoryItem {
  id: string;
  name: string;
  color: string;
  amount: number;
}

export interface MonthOverMonth {
  currentMonth: number;
  previousMonth: number;
  changePercentage: number;
}

export interface HighestSpendingDay {
  date: string;
  amount: number;
}

export interface AnalyticsSummary {
  totalExpenses: number;
  totalIncome: number;
  remainingBalance: number;
  todaySpending: number;
  categoryBreakdown: CategoryBreakdownItem[];
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  monthlyTrend: MonthlyTrendItem[];
  topCategories: TopCategoryItem[];
  highestExpense: ExpenseDto | null;
  highestSpendingDay: HighestSpendingDay;
  averageDailySpending: number;
  monthOverMonth: MonthOverMonth;
  budgetHealthScore: number;
}

export interface ProfileDto {
  id: string;
  name: string;
  email: string;
  currency: string;
  theme: string;
  image: string | null;
  hasPasscode: boolean;
  createdAt: string;
}

export interface AppPreferences {
  currency: string;
  theme: string;
  accentColor: string;
  secondaryColor: string;
  useGradient: boolean;
}

export interface AppInfo {
  name: string;
  version: string;
  platform: string;
  arch: string;
  isPackaged: boolean;
  isDev: boolean;
  dataPath: string;
  rendererPath: string;
  chromeVersion: string;
  electronVersion: string;
  nodeVersion: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

/** Uniform result envelope, matching the original `ApiResponse<T>` shape. */
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ExpenseListQuery {
  search?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethod | "ALL";
  startDate?: string;
  endDate?: string;
  sortBy?: "expenseDate" | "amount" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ExportResult {
  filePath: string;
  recordCount: number;
  format: "csv" | "json";
}

export interface ImportPreview {
  valid: boolean;
  errors: ValidationError[];
  summary: {
    categories: number;
    expenses: number;
    dateFrom: string | null;
    dateTo: string | null;
  };
}

export interface ImportResult {
  importedCategories: number;
  importedExpenses: number;
  skipped: number;
  mode: "merge" | "replace";
}

export interface ImportPayload {
  mode: "merge" | "replace";
  categories: Array<{ name: string; color: string; icon: string }>;
  expenses: Array<{
    title: string;
    amount: number;
    type: TransactionType;
    expenseDate: string;
    notes?: string | null;
    paymentMethod: PaymentMethod;
    categoryName: string;
  }>;
}

export type RendererCommand = "quick-add" | "export-csv" | "import-data";

export interface StorageStatus {
  path: string;
  sizeBytes: number;
  expenseCount: number;
  categoryCount: number;
  profileCount: number;
}
