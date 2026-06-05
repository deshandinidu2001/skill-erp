import type { Role } from "@/constants/roles";
import { canPerform } from "@/lib/permissions";
import { mockDelay } from "@/services/mock/utils";

const ledger = [
  { code: "LED-7001", account: "Project revenue", debit: 0, credit: 19300000, journal_entry: "JE-9001" },
  { code: "LED-7002", account: "Material purchases", debit: 2450000, credit: 0, journal_entry: "JE-9002" },
];

export async function getLedger(role: Role) {
  await mockDelay();
  return ledger.map(({ journal_entry, ...entry }) =>
    canPerform(role, "viewFinancials") ? { ...entry, journal_entry } : entry,
  );
}

export async function getCashBook(role: Role) {
  await mockDelay();
  const rows = [
    { code: "CB-8001", description: "Supplier payment", amount: 520000, journal_entry: "JE-9010" },
    { code: "CB-8002", description: "Client advance", amount: 3500000, journal_entry: "JE-9011" },
  ];
  return rows.map(({ journal_entry, ...row }) =>
    canPerform(role, "viewFinancials") ? { ...row, journal_entry } : row,
  );
}
