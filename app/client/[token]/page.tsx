import { ClientPortalPage as ClientPortalScreen } from "@/components/client/ClientPortalPage";

export default function ClientPortalPage({ params }: { params: { token: string } }) {
  return <ClientPortalScreen token={params.token} />;
}
