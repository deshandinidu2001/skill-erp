import { apiGet, apiPost } from "@/services/api/client/http";
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

export function getAccounts() {
  return apiGet<Account[]>("/api/accounting?view=accounts");
}

export function getProjectLedger(project_id: string) {
  return apiGet<LedgerRow[]>(`/api/accounting?view=project-ledger&project_id=${encodeURIComponent(project_id)}`);
}

export function getGeneralLedger(accountCode?: string) {
  return apiGet<LedgerRow[]>(`/api/accounting${accountCode ? `?accountCode=${encodeURIComponent(accountCode)}` : ""}`);
}

export function getCashBook(kind: "cash" | "bank" | "all" = "all") {
  return apiGet<CashBookRow[]>(`/api/accounting?view=cash-book&kind=${kind}`);
}

export function getCustomerPayments() {
  return apiGet<Array<ClientPayment & { project?: string }>>("/api/accounting?view=payments");
}

export function getPnl(project_id?: string) {
  return apiGet<{ income: Array<{ account: string; amount: number }>; expenses: Array<{ account: string; amount: number }>; net: number; chart: Array<{ month: string; income: number; expense: number }> }>(`/api/accounting?view=pnl${project_id ? `&project_id=${encodeURIComponent(project_id)}` : ""}`);
}

export function getDebtorAging() {
  return apiGet<DebtorAgingRow[]>("/api/accounting?view=debtors");
}

export function getFinancePaymentsAndExpenses() {
  return apiGet<{ payments: ClientPayment[]; expenses: ProjectExpense[] }>("/api/accounting?view=finance");
}
