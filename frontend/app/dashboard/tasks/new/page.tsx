"use client";
import { useRouter } from "next/navigation";
import { CreateTaskModal } from "@/components/shared/CreateTaskModal";

/**
 * /dashboard/tasks/new
 * Renders the task creation modal on top of the tasks list.
 * When the modal is closed or a task is created, we navigate back.
 */
export default function NewTaskPage() {
  const router = useRouter();

  const handleClose = () => router.push("/dashboard/tasks");
  const handleCreated = (task: any) => {
    if (task?.project) {
      const projectId = typeof task.project === "string" ? task.project : task.project._id;
      router.push(`/dashboard/projects/${projectId}/board`);
    } else {
      router.push("/dashboard/tasks");
    }
  };

  return <CreateTaskModal onClose={handleClose} onCreated={handleCreated} />;
}
