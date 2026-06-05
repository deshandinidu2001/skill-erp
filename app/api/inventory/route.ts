import { errorResponse, ok, requireSession } from "@/app/api/_utils";
import { getInventory, getStockItems, getSuppliers } from "@/services/api/inventory.service";

export async function GET() {
  try {
    await requireSession();
    const [inventory, items, suppliers] = await Promise.all([getInventory(), getStockItems(), getSuppliers()]);
    return ok({ inventory, items, suppliers });
  } catch (error) {
    return errorResponse(error);
  }
}
