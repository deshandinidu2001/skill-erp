import { ClientQuotationPage } from "@/components/client/ClientQuotationPage";

export default function ClientQuotationPortalPage({ params }: { params: { token: string } }) {
  return <ClientQuotationPage token={params.token} />;
}
