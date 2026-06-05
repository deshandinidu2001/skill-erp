import { LeadDetailPage as LeadDetailScreen } from "@/components/marketing/LeadDetailPage";

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  return <LeadDetailScreen id={params.id} />;
}
