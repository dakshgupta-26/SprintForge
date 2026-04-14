import { redirect } from 'next/navigation';

export default function ProjectRootPage({ params }: { params: { id: string } }) {
  // Gracefully redirect the root project route to its Kanban board
  redirect(`/dashboard/projects/${params.id}/board`);
}
