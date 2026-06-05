import { EmployeeProfilePage } from "@/components/hr/HrPages";

export default function EmployeeProfileRoute({ params }: { params: { id: string } }) {
  return <EmployeeProfilePage id={params.id} />;
}
