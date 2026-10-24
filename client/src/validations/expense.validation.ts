import { z } from "zod";
import type { PaymentMethod } from "@/types";

/**
 * Validation schemas for expense payloads.
 *
 * These mirror the original `client/src/validations/expense.validation.ts`
 * exactly, except that the `PaymentMethod` enum now comes from `@/types`
 * instead of `@prisma/client` — the desktop application has no Prisma
 * dependency. The accepted values are unchanged.
 */

const paymentMethodSchema = z.enum([
  "CASH",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "BANK_TRANSFER",
  "UPI",
  "OTHER",
]);

export const PAYMENT_METHOD_VALUES = paymentMethodSchema.options as PaymentMethod[];

export const createExpenseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long").max(100),
  amount: z.number().positive("Amount must be a positive number"),
  expenseDate: z.string().transform((str) => new Date(str)),
  paymentMethod: paymentMethodSchema.default("CREDIT_CARD"),
  categoryId: z.string().min(1, "Category is required"),
  notes: z.string().max(500).optional().nullable(),
  type: z.enum(["EXPENSE", "INCOME"]).optional().default("EXPENSE"),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const queryExpenseSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  sortBy: z.enum(["expenseDate", "amount", "title"]).default("expenseDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type QueryExpenseInput = z.infer<typeof queryExpenseSchema>;
