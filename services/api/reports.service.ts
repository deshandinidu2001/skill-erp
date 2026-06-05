import "server-only";

import { getDebtorAging, getFinancePaymentsAndExpenses, getPnl } from "@/services/api/accounting.service";
import { getAttendance, getAttendanceSummary, getEmployees, getPayrollBatches, getPayrollSummary } from "@/services/api/hr.service";
import { getInventory, getStockItems, getSuppliers } from "@/services/api/inventory.service";
import { getLeads } from "@/services/api/leads.service";
import { getProjects } from "@/services/api/projects.service";
import { getPurchaseOrders } from "@/services/api/purchase-orders.service";
import { getQuotations } from "@/services/api/quotations.service";
import { getStockRequests } from "@/services/api/stock-requests.service";
import { getVehicles } from "@/services/api/vehicles.service";

export async function getReportsSummary() {
  const [leads, quotations, projects, finance, attendance, payroll, inventory, purchaseOrders, pnl, employees, payrollBatches, attendanceRecords, stockItems, stockRequests, suppliers, vehicles, debtorAgingRows] = await Promise.all([
    getLeads(),
    getQuotations(),
    getProjects(),
    getFinancePaymentsAndExpenses(),
    getAttendanceSummary(),
    getPayrollSummary(),
    getInventory(),
    getPurchaseOrders(),
    getPnl(),
    getEmployees(),
    getPayrollBatches(),
    getAttendance(),
    getStockItems(),
    getStockRequests(),
    getSuppliers(),
    getVehicles(),
    getDebtorAging(),
  ]);
  return { leads, quotations, projects, finance, attendance, payroll, inventory, purchaseOrders, pnl, employees, payrollBatches, attendanceRecords, stockItems, stockRequests, suppliers, vehicles, debtorAgingRows, maintenanceLogs: [], fuelLogs: [] };
}
