import { NextRequest } from "next/server";
import { errorResponse, ok, queryParams, requireSession } from "@/app/api/_utils";
import { getAccounts, getCashBook, getCustomerPayments, getDebtorAging, getFinancePaymentsAndExpenses, getGeneralLedger, getPnl, getProjectLedger } from "@/services/api/accounting.service";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["super_admin", "accountant", "finance_manager", "viewer"]);
    const params = queryParams(req.url);
    if (params.view === "accounts") return ok(await getAccounts());
    if (params.view === "project-ledger") return ok(await getProjectLedger(params.project_id));
    if (params.view === "cash-book") return ok(await getCashBook((params.kind as "cash" | "bank" | "all") ?? "all"));
    if (params.view === "payments") return ok(await getCustomerPayments());
    if (params.view === "pnl") return ok(await getPnl(params.project_id));
    if (params.view === "debtors") return ok(await getDebtorAging());
    if (params.view === "finance") return ok(await getFinancePaymentsAndExpenses());
    return ok(await getGeneralLedger(params.accountCode));
  } catch (error) {
    return errorResponse(error);
  }
}
