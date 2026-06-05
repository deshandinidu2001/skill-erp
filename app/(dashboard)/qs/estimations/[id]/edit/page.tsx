import { EstimationFormPage } from "@/components/qs/EstimationFormPage";

export default function EditEstimationPage({ params }: { params: { id: string } }) {
  return <EstimationFormPage id={params.id} />;
}
