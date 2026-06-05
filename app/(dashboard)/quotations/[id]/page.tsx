import { QuotationDetailPage as QuotationDetailScreen } from "@/components/quotations/QuotationDetailPage";

export default function QuotationDetailPage({ params }: { params: { id: string } }) {
  return <QuotationDetailScreen id={params.id} />;
}
