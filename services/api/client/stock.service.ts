import { apiGet, apiPatch, apiPost, asArray } from "@/services/api/client/http";
import type { GoodsReceipt, InventoryBalance, PurchaseOrder, StockItem, StockRequest, Supplier } from "@/types";

export async function getStockItems(): Promise<StockItem[]> {
  return asArray<StockItem>((await apiGet<{ items: StockItem[] }>("/api/inventory")).items);
}

export async function getSuppliers(): Promise<Supplier[]> {
  return asArray<Supplier>((await apiGet<{ suppliers: Supplier[] }>("/api/inventory")).suppliers);
}

export async function getStockRequests(): Promise<StockRequest[]> {
  return asArray<StockRequest>(await apiGet("/api/stock-requests"));
}

export function getStockRequestById(id: string): Promise<StockRequest | undefined> {
  return apiGet(`/api/stock-requests/${id}`);
}

export function createStockRequest(input: unknown): Promise<StockRequest> {
  return apiPost("/api/stock-requests", input);
}

export function updateStockRequestStatus(id: string, status: StockRequest["status"], reason?: string) {
  return apiPatch(`/api/stock-requests/${id}`, { status, reason });
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return asArray<PurchaseOrder>(await apiGet("/api/purchase-orders"));
}

export function createPurchaseOrder(input: unknown): Promise<PurchaseOrder> {
  return apiPost("/api/purchase-orders", input);
}

export function approvePurchaseOrder(id: string, _role?: string) {
  return apiPatch("/api/purchase-orders", { id });
}

export async function getGoodsReceipts(): Promise<GoodsReceipt[]> {
  return asArray<GoodsReceipt>(await apiGet("/api/goods-receipts"));
}

export function createGoodsReceipt(input: unknown): Promise<GoodsReceipt[]> {
  return apiPost("/api/goods-receipts", input);
}

export async function getInventory(): Promise<InventoryBalance[]> {
  return asArray<InventoryBalance>((await apiGet<{ inventory: InventoryBalance[] }>("/api/inventory")).inventory);
}
