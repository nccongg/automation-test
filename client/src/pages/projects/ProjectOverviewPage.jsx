import { useOutletContext } from "react-router-dom";
import ProjectHeader from "@/features/projects/components/ProjectHeader";
import ProjectStats from "@/features/projects/components/ProjectStats";

export default function ProjectOverviewPage() {
  const { project, onProjectUpdated } = useOutletContext();

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} onProjectUpdated={onProjectUpdated} />
      <ProjectStats project={project} />
    </div>
  );
}
