import { apiGet, apiPost, asArray } from "@/services/api/client/http";
import type { Account, ClientPayment, DebtorAgingRow, PostedJournalEntry, ProjectExpense } from "@/types";

export type LedgerRow = {
  date: string;
  entryCode: string;
  description: string;
  category: string;
  debit: number;
  credit: number;
  balance: number;
  sourceReference: string;
  sourceModule: string;
  accountCode: string;
  accountName: string;
};

export type CashBookRow = {
  date: string;
  txnCode?: string;
  entryCode?: string;
  type?: string;
  amount: number;
  projectRef?: string;
  siteRef?: string;
  notes?: string;
  balance: number;
};

export function postJournalEntry(entry: PostedJournalEntry) {
  return apiPost("/api/journal", entry);
}

export async function getAccounts() {
  return asArray<Account>(await apiGet("/api/accounting?view=accounts"));
}

export async function getProjectLedger(project_id: string) {
  return asArray<LedgerRow>(await apiGet(`/api/accounting?view=project-ledger&project_id=${encodeURIComponent(project_id)}`));
}

export async function getGeneralLedger(accountCode?: string) {
  return asArray<LedgerRow>(await apiGet(`/api/accounting${accountCode ? `?accountCode=${encodeURIComponent(accountCode)}` : ""}`));
}

export async function getCashBook(kind: "cash" | "bank" | "all" = "all") {
  return asArray<CashBookRow>(await apiGet(`/api/accounting?view=cash-book&kind=${kind}`));
}

export async function getCustomerPayments() {
  return asArray<ClientPayment & { project?: string }>(await apiGet("/api/accounting?view=payments"));
}

export function getPnl(project_id?: string) {
  return apiGet<{ income: Array<{ account: string; amount: number }>; expenses: Array<{ account: string; amount: number }>; net: number; chart: Array<{ month: string; income: number; expense: number }> }>(`/api/accounting?view=pnl${project_id ? `&project_id=${encodeURIComponent(project_id)}` : ""}`);
}

export async function getDebtorAging() {
  return asArray<DebtorAgingRow>(await apiGet("/api/accounting?view=debtors"));
}

export function getFinancePaymentsAndExpenses() {
  return apiGet<{ payments: ClientPayment[]; expenses: ProjectExpense[] }>("/api/accounting?view=finance");
}
