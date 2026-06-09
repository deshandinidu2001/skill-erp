import "server-only";

import type { Role } from "@/constants/roles";
import { canPerform } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/server";
import { mapAccount, mapClientPayment, mapProjectExpense } from "@/services/api/mappers";

export async function getAccounts() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("accounts").select("*").order("code");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapAccount(row));
}

export async function getGeneralLedger(accountCode?: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("journal_lines")
    .select("*, accounts(*), journal_entries(*)")
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  let balance = 0;
  return ((data ?? []) as any[])
    .filter((line) => !accountCode || line.accounts?.code === accountCode)
    .map((line) => {
      balance += Number(line.debit ?? 0) - Number(line.credit ?? 0);
      return {
        date: String(line.journal_entries?.entry_date ?? ""),
        entryCode: String(line.journal_entries?.entry_no ?? ""),
        description: String(line.description ?? line.journal_entries?.memo ?? ""),
        category: String(line.accounts?.type ?? ""),
        debit: Number(line.debit ?? 0),
        credit: Number(line.credit ?? 0),
        balance,
        sourceReference: String(line.journal_entries?.id ?? ""),
        sourceModule: String(line.journal_entries?.source ?? ""),
        accountCode: String(line.accounts?.code ?? ""),
        accountName: String(line.accounts?.name ?? ""),
      };
    });
}

export async function getProjectLedger(project_id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("journal_lines")
    .select("*, accounts(*), journal_entries(*)")
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  let balance = 0;
  return ((data ?? []) as any[]).map((line) => {
    balance += Number(line.debit ?? 0) - Number(line.credit ?? 0);
    return {
      date: String(line.journal_entries?.entry_date ?? ""),
      entryCode: String(line.journal_entries?.entry_no ?? ""),
      description: String(line.description ?? line.journal_entries?.memo ?? ""),
      category: String(line.accounts?.type ?? ""),
      debit: Number(line.debit ?? 0),
      credit: Number(line.credit ?? 0),
      balance,
      sourceReference: String(line.journal_entries?.id ?? ""),
      sourceModule: String(line.journal_entries?.source ?? ""),
      accountCode: String(line.accounts?.code ?? ""),
      accountName: String(line.accounts?.name ?? ""),
    };
  });
}

export async function getCashBook(kind: "cash" | "bank" | "all" | Role = "all") {
  if (kind && !["cash", "bank", "all"].includes(kind)) kind = "all";
  const rows = await getGeneralLedger();
  return rows.filter((row) => {
    if (kind === "cash") return row.accountCode === "1100" || row.accountCode === "1400";
    if (kind === "bank") return row.accountCode === "1200";
    return ["1100", "1200", "1400"].includes(row.accountCode);
  });
}

export async function getLedger(role: Role) {
  const rows = await getGeneralLedger();
  return rows.map((row) => (canPerform(role, "viewFinancials") ? row : { ...row, entryCode: undefined }));
}

export async function getCustomerPayments() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("client_payments").select("*, customers(*)").order("payment_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapClientPayment(row));
}

export async function getPnl(project_id?: string) {
  const rows = project_id ? await getProjectLedger(project_id) : await getGeneralLedger();
  const income = rows.filter((row) => row.category === "income").map((row) => ({ account: row.accountName, amount: row.credit - row.debit }));
  const expenses = rows.filter((row) => row.category === "expense").map((row) => ({ account: row.accountName, amount: row.debit - row.credit }));
  return {
    income,
    expenses,
    net: income.reduce((sum, row) => sum + row.amount, 0) - expenses.reduce((sum, row) => sum + row.amount, 0),
    chart: [],
  };
}

export async function getDebtorAging() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("project_milestones").select("*, projects(*, customers(*))").is("completed_at", null);
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((row) => ({
    project: row.projects?.name ?? "",
    customer: row.projects?.customers?.name ?? "",
    milestone: row.title,
    dueDate: row.due_date,
    dueAmount: Number(row.amount_due ?? 0),
    paid: 0,
    outstanding: Number(row.amount_due ?? 0),
    overdueDays: row.due_date ? Math.max(0, Math.floor((Date.now() - new Date(row.due_date).getTime()) / 86_400_000)) : 0,
  }));
}

export async function getFinancePaymentsAndExpenses() {
  const supabase = createAdminClient();
  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("client_payments").select("*, customers(*)"),
    supabase.from("project_expenses").select("*, expense_categories(*)"),
  ]);
  return {
    payments: (payments ?? []).map((row) => mapClientPayment(row)),
    expenses: (expenses ?? []).map((row) => mapProjectExpense(row)),
  };
}
