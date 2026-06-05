import {
  accounts,
  clientPayments,
  debtorAgingRows,
  postedJournalEntries,
  projectExpenses,
  projects,
} from "@/services/mock/seed";
import { mockDelay } from "@/services/mock/utils";
import type { PostedJournalEntry } from "@/types";

function assertBalanced(entry: PostedJournalEntry) {
  const debit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
  const credit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
  if (Math.round(debit * 100) !== Math.round(credit * 100)) {
    throw new Error("Unbalanced journal entry. Transaction failed.");
  }
}

export async function postJournalEntry(entry: PostedJournalEntry) {
  await mockDelay();
  assertBalanced(entry);
  postedJournalEntries.unshift(entry);
  return entry;
}

export async function getAccounts() {
  await mockDelay();
  return accounts;
}

export async function getProjectLedger(project_id: string) {
  await mockDelay();
  return flattenLedger(postedJournalEntries.filter((entry) => entry.project_id === project_id));
}

export async function getGeneralLedger(accountCode?: string) {
  await mockDelay();
  const entries = accountCode
    ? postedJournalEntries.filter((entry) => entry.lines.some((line) => line.accountCode === accountCode))
    : postedJournalEntries;
  return flattenLedger(entries, accountCode);
}

export async function getCashBook(kind: "cash" | "bank" | "all" = "all") {
  await mockDelay();
  const cashCodes = accounts.filter((account) => account.is_cash || account.is_bank).map((account) => account.code);
  let balance = 0;
  return postedJournalEntries
    .flatMap((entry) =>
      entry.lines
        .filter((line) => cashCodes.includes(line.accountCode))
        .filter((line) => kind === "all" || (kind === "cash" ? line.accountCode === "1010" : line.accountCode === "1020"))
        .map((line) => {
          const amount = line.debit - line.credit;
          balance += amount;
          const project = projects.find((item) => item.project_id === entry.project_id);
          return {
            date: entry.date,
            txnCode: entry.code,
            type: line.debit > 0 ? "Receipt" : "Payment",
            amount: Math.abs(amount),
            projectRef: project?.code ?? "-",
            siteRef: project?.site ?? "-",
            notes: entry.description,
            balance,
          };
        }),
    );
}

export async function getCustomerPayments() {
  await mockDelay();
  return clientPayments.map((payment) => ({
    ...payment,
    project: projects.find((item) => item.project_id === payment.project_id)?.name ?? payment.project_id,
  }));
}

export async function getPnl(project_id?: string) {
  await mockDelay();
  const entries = project_id ? postedJournalEntries.filter((entry) => entry.project_id === project_id) : postedJournalEntries;
  const income = sumByAccount(entries, "income");
  const expenses = sumByAccount(entries, "expense");
  return {
    income,
    expenses,
    net: income.reduce((sum, row) => sum + row.amount, 0) - expenses.reduce((sum, row) => sum + row.amount, 0),
    chart: [
      { month: "Apr", income: 5800000, expense: 2500000 },
      { month: "May", income: 9600000, expense: 4200000 },
      { month: "Jun", income: 7720000, expense: 2500000 },
    ],
  };
}

export async function getDebtorAging() {
  await mockDelay();
  return debtorAgingRows;
}

export async function getFinancePaymentsAndExpenses() {
  await mockDelay();
  return { payments: clientPayments, expenses: projectExpenses };
}

function flattenLedger(entries: PostedJournalEntry[], accountCode?: string) {
  let balance = 0;
  return entries.flatMap((entry) =>
    entry.lines
      .filter((line) => !accountCode || line.accountCode === accountCode)
      .map((line) => {
        balance += line.debit - line.credit;
        return {
          date: entry.date,
          entryCode: entry.code,
          description: entry.description,
          category: line.category,
          debit: line.debit,
          credit: line.credit,
          balance,
          sourceReference: entry.sourceReference,
          sourceModule: entry.sourceModule,
          accountCode: line.accountCode,
          accountName: line.accountName,
        };
      }),
  );
}

function sumByAccount(entries: PostedJournalEntry[], type: string) {
  const map = new Map<string, number>();
  entries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const account = accounts.find((item) => item.code === line.accountCode);
      if (account?.type === type) {
        const amount = type === "income" ? line.credit - line.debit : line.debit - line.credit;
        map.set(line.accountName, (map.get(line.accountName) ?? 0) + amount);
      }
    });
  });
  return Array.from(map.entries()).map(([account, amount]) => ({ account, amount }));
}
