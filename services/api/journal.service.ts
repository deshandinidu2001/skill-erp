import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { auditLog } from "@/services/api/common";

type SourceModule = Database["public"]["Enums"]["source_module"];

const journalLineSchema = z.object({
  accountCode: z.string().min(1),
  debit: z.number().nonnegative(),
  credit: z.number().nonnegative(),
  description: z.string().optional(),
});

const journalSchema = z.object({
  sourceModule: z.enum(["project_expense", "petty_cash", "client_payment", "system"]),
  projectId: z.number().int().positive().optional(),
  description: z.string().min(1),
  transactionDate: z.string().min(1),
  lines: z.array(journalLineSchema).min(2),
  createdBy: z.string().uuid().or(z.string().min(1)),
});

export type JournalLineInput = z.infer<typeof journalLineSchema>;

export async function postJournalEntry(input: {
  sourceModule: SourceModule;
  projectId?: number;
  description: string;
  transactionDate: string;
  lines: JournalLineInput[];
  createdBy: string;
}): Promise<number> {
  const parsed = journalSchema.parse(input);
  const totalDebit = parsed.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = parsed.lines.reduce((sum, line) => sum + line.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.001) throw new Error(`Unbalanced journal: debit=${totalDebit} credit=${totalCredit}`);
  if (totalDebit === 0) throw new Error("Journal entry has no lines");
  if (parsed.lines.some((line) => (line.debit > 0 && line.credit > 0) || (line.debit === 0 && line.credit === 0))) throw new Error("Each journal line must have either debit or credit.");

  const supabase = createAdminClient();
  const { count } = await supabase.from("journal_entries").select("*", { count: "exact", head: true });
  const refNo = `JE-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(6, "0")}`;
  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({
      reference_no: refNo,
      source_module: parsed.sourceModule,
      project_id: parsed.projectId ?? null,
      description: parsed.description,
      transaction_date: parsed.transactionDate,
      status: "draft",
      created_by: parsed.createdBy,
    })
    .select("id")
    .single();
  if (entryError) throw new Error(entryError.message);

  const codes = Array.from(new Set(parsed.lines.map((line) => line.accountCode)));
  const { data: accounts, error: accountError } = await supabase.from("accounts").select("id, code").in("code", codes);
  if (accountError) throw new Error(accountError.message);
  const accountMap = new Map((accounts ?? []).map((account) => [String(account.code), Number(account.id)]));
  const missing = codes.filter((code) => !accountMap.has(code));
  if (missing.length) {
    await supabase.from("journal_entries").delete().eq("id", entry.id);
    throw new Error(`Missing account code(s): ${missing.join(", ")}`);
  }

  const lineInserts = parsed.lines.map((line) => ({
    journal_entry_id: entry.id,
    account_id: accountMap.get(line.accountCode)!,
    debit: line.debit,
    credit: line.credit,
    description: line.description,
  }));
  const { error: lineError } = await supabase.from("journal_lines").insert(lineInserts);
  if (lineError) {
    await supabase.from("journal_entries").delete().eq("id", entry.id);
    throw new Error(lineError.message);
  }

  const { error: postError } = await supabase.from("journal_entries").update({ status: "posted" }).eq("id", entry.id);
  if (postError) throw new Error(postError.message);
  await auditLog({ userId: parsed.createdBy, action: "create", module: "journal_entries", recordId: entry.id, newValues: { ...parsed, reference_no: refNo } });
  return Number(entry.id);
}

export async function journalForExpense(expense: { id: number; amount: number; category_code: string; project_id: number; expense_date: string }, userId: string): Promise<void> {
  const accountMap: Record<string, string> = {
    "EXP-001": "5100",
    "EXP-002": "5200",
    "EXP-003": "5300",
    "EXP-004": "5400",
    "EXP-005": "5500",
  };
  const journalId = await postJournalEntry({
    sourceModule: "project_expense",
    projectId: expense.project_id,
    description: `Project Expense #${expense.id}`,
    transactionDate: expense.expense_date,
    lines: [
      { accountCode: accountMap[expense.category_code] ?? "5500", debit: expense.amount, credit: 0 },
      { accountCode: "1100", debit: 0, credit: expense.amount },
    ],
    createdBy: userId,
  });
  const supabase = createAdminClient();
  await supabase.from("project_expenses").update({ journal_entry_id: journalId }).eq("id", expense.id);
}

export async function journalForClientPayment(payment: { id: number; amount: number; project_id: number; payment_date: string }, userId: string): Promise<void> {
  const journalId = await postJournalEntry({
    sourceModule: "client_payment",
    projectId: payment.project_id,
    description: `Client Payment #${payment.id}`,
    transactionDate: payment.payment_date,
    lines: [
      { accountCode: "1200", debit: payment.amount, credit: 0 },
      { accountCode: "1300", debit: 0, credit: payment.amount },
    ],
    createdBy: userId,
  });
  const supabase = createAdminClient();
  await supabase.from("client_payments").update({ journal_entry_id: journalId }).eq("id", payment.id);
}
