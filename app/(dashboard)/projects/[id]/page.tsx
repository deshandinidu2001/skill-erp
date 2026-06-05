import { ProjectDetailPage as ProjectDetailScreen } from "@/components/projects/ProjectDetailPage";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectDetailScreen id={params.id} />;
}
