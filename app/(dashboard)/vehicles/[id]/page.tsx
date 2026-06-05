import { VehicleDetailPage } from "@/components/vehicles/VehiclePages";

export default function VehicleDetailRoute({ params }: { params: { id: string } }) {
  return <VehicleDetailPage id={params.id} />;
}
