import { DetailPage } from "@/components/shared/DetailPage";

export default function EstimationDetailPage({ params }: { params: { id: string } }) {
  return <DetailPage title="Estimation Detail" id={params.id} />;
}
