"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store/projectStore";
import { useAuthStore } from "@/lib/store/authStore";
import { FolderKanban, Plus, Lock, Globe, Users, ArrowRight, Layout, Zap, MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import { formatDate, PROJECT_COLORS } from "@/lib/utils";
import toast from "react-hot-toast";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { EditProjectModal } from "@/components/projects/EditProjectModal";

export default function ProjectsPage() {
  const { projects, fetchProjects, isLoading, deleteProject, setCurrentProject } = useProjectStore();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { 
    fetchProjects(); 
    const handleClick = () => setDropdownOpen(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    if (!confirm("Delete this project? All tasks and sprints will be lost.")) return;
    try {
      await deleteProject(projectId);
      toast.success("Project deleted");
    } catch { toast.error("Failed to delete project"); }
  };

  const goToProject = (project: any) => {
    setCurrentProject(project);
    router.push(`/dashboard/projects/${project._id}/board`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">All your projects in one place</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all active:scale-95">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-2xl">
          <FolderKanban className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h2 className="text-lg font-bold mb-2">No projects yet</h2>
          <p className="text-muted-foreground text-sm mb-6">Create your first project to start managing your team's work</p>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <motion.div key={project._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div onClick={() => goToProject(project)}
                className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/5 relative">
                {/* Project color accent */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: project.color }} />

                {/* Header */}
                <div className="flex items-start justify-between mb-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: project.color }}>
                      {project.key.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{project.name}</h3>
                      <span className="text-xs text-muted-foreground font-mono">{project.key}</span>
                    </div>
                  </div>
                  <div className="relative flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === project._id ? null : project._id); }}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {dropdownOpen === project._id && (
                      <div className="absolute right-0 top-8 w-32 bg-card border border-border rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); setDropdownOpen(null); }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-muted text-foreground transition-colors">
                          <Edit2 className="w-3.5 h-3.5" /> Rename
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDropdownOpen(null); handleDelete(e, project._id); }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{project.description}</p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 capitalize">
                    {project.type === "kanban" ? <Layout className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                    {project.type}
                  </span>
                  <span className="flex items-center gap-1">
                    {project.isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    {project.isPrivate ? "Private" : "Public"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {project.members?.length || 1}
                  </span>
                </div>

                {/* Avatars */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 4).map((m: any) => (
                      <div key={m.user?._id || Math.random()}
                        className="w-6 h-6 rounded-full border-2 border-card bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                        {m.user?.name?.charAt(0) || "?"}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* New project card */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: projects.length * 0.06 }}>
            <button onClick={() => setShowCreate(true)}
              className="w-full h-full min-h-[180px] flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors font-medium">
                Create new project
              </span>
            </button>
          </motion.div>
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={(project) => {
            setShowCreate(false);
            setCurrentProject(project);
            router.push(`/dashboard/projects/${project._id}/board`);
          }}
        />
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onUpdate={(updated) => {
            setEditingProject(null);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
