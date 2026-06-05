import { StockRequestDetailPage } from "@/components/stock/StockPages";

export default function StockRequestDetailRoute({ params }: { params: { id: string } }) {
  return <StockRequestDetailPage id={params.id} />;
}
