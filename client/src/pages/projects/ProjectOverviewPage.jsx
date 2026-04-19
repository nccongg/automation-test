import { useOutletContext } from "react-router-dom";
import ProjectHeader from "@/features/projects/components/ProjectHeader";
import ProjectStats from "@/features/projects/components/ProjectStats";
import GenerateTestCasesSection from "@/features/projects/components/GenerateTestCasesSection";

export default function ProjectOverviewPage() {
  const { project, onProjectUpdated } = useOutletContext();

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} onProjectUpdated={onProjectUpdated} />
      <GenerateTestCasesSection project={project} />
      <ProjectStats project={project} />
    </div>
  );
}
