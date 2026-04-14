"use client";
import { useRouter } from "next/navigation";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { useProjectStore } from "@/lib/store/projectStore";

/**
 * /dashboard/projects/new
 * Renders the CreateProjectModal on top of a transparent background.
 * On success → navigate to the new project's board.
 */
export default function NewProjectPage() {
  const router = useRouter();
  const { setCurrentProject } = useProjectStore();

  const handleClose = () => router.push("/dashboard/projects");
  const handleCreate = (project: any) => {
    setCurrentProject(project);
    router.push(`/dashboard/projects/${project._id}/board`);
  };

  return (
    <CreateProjectModal
      onClose={handleClose}
      onCreate={handleCreate}
    />
  );
}
