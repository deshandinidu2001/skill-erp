import { PO_APPROVAL_THRESHOLD } from "@/constants/stock";
import {
  goodsReceipts,
  inventoryBalances,
  projects,
  purchaseOrders,
  stockItems,
  stockRequests,
  suppliers,
} from "@/services/mock/seed";
import { mockDelay } from "@/services/mock/utils";
import type { GoodsReceipt, PurchaseOrder, StockRequest, StockRequestLine } from "@/types";

export async function getStockItems() {
  await mockDelay();
  return stockItems;
}

export async function getSuppliers() {
  await mockDelay();
  return suppliers;
}

export async function getStockRequests() {
  await mockDelay();
  return stockRequests;
}

export async function getStockRequestById(id: string) {
  await mockDelay();
  return stockRequests.find((item) => item.id === id || item.code === id);
}

export async function createStockRequest(input: {
  project_id: string;
  site: string;
  requestDate: string;
  requiredByDate: string;
  requestedBy: string;
  remarks?: string;
  lines: StockRequestLine[];
}) {
  await mockDelay();
  const project = projects.find((item) => item.project_id === input.project_id);
  if (!project) throw new Error("Project is required.");
  if (!input.site) throw new Error("Site is required.");
  if (!input.lines.length) throw new Error("At least one line is required.");
  if (input.lines.some((line) => line.quantity <= 0)) throw new Error("Quantity must be greater than 0.");
  if (new Date(input.requiredByDate) < new Date(input.requestDate)) throw new Error("Required by date cannot be before request date.");

  const row: StockRequest = {
    id: `sr_${Date.now()}`,
    project_id: input.project_id,
    code: `SR-${5000 + stockRequests.length + 1}`,
    project: project.name,
    site: input.site,
    requestDate: input.requestDate,
    requiredByDate: input.requiredByDate,
    requester: input.requestedBy,
    requestedBy: input.requestedBy,
    remarks: input.remarks,
    status: "draft",
    lines: input.lines,
  };
  stockRequests.unshift(row);
  return row;
}

export async function updateStockRequestStatus(id: string, status: StockRequest["status"], reason?: string) {
  await mockDelay();
  const request = stockRequests.find((item) => item.id === id || item.code === id);
  if (!request) throw new Error("Stock request not found.");
  request.status = status;
  if (reason) request.rejectReason = reason;
  return request;
}

export async function getPurchaseOrders() {
  await mockDelay();
  return purchaseOrders;
}

export async function createPurchaseOrder(input: Omit<PurchaseOrder, "id" | "code" | "grandTotal" | "status">) {
  await mockDelay();
  const grandTotal = input.lines.reduce((total, line) => total + line.orderedQty * line.unitPrice + line.tax, 0);
  const row: PurchaseOrder = {
    id: `po_${Date.now()}`,
    code: `PO-${6000 + purchaseOrders.length + 1}`,
    status: "draft",
    grandTotal,
    ...input,
  };
  purchaseOrders.unshift(row);
  return row;
}

export async function approvePurchaseOrder(id: string, role: string) {
  await mockDelay();
  const po = purchaseOrders.find((item) => item.id === id || item.code === id);
  if (!po) throw new Error("Purchase order not found.");
  if (po.grandTotal > PO_APPROVAL_THRESHOLD && role !== "finance_manager" && role !== "super_admin") {
    throw new Error("Finance manager approval required above threshold.");
  }
  po.status = "approved";
  return po;
}

export async function getGoodsReceipts() {
  await mockDelay();
  return goodsReceipts;
}

export async function createGoodsReceipt(input: Omit<GoodsReceipt, "id" | "code">) {
  await mockDelay();
  const receipt: GoodsReceipt = {
    id: `gr_${Date.now()}`,
    code: `GR-${7000 + goodsReceipts.length + 1}`,
    ...input,
  };
  goodsReceipts.unshift(receipt);
  const po = purchaseOrders.find((item) => item.id === input.poId);
  input.lines.forEach((line) => {
    const poLine = po?.lines.find((item) => item.itemId === line.itemId);
    if (poLine) poLine.receivedQuantity += line.receivedQty;
    const inventory = inventoryBalances.find((item) => item.itemId === line.itemId && item.project_id === input.project_id);
    if (inventory) inventory.currentBalance += line.receivedQty - line.damagedQty;
  });
  return receipt;
}

export async function getInventory() {
  await mockDelay();
  return inventoryBalances;
}
