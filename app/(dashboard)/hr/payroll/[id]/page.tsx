import { PayrollDetailPage } from "@/components/hr/HrPages";

export default function PayrollDetailRoute({ params }: { params: { id: string } }) {
  return <PayrollDetailPage id={params.id} />;
}
