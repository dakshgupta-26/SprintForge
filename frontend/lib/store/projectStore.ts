import { create } from "zustand";
import { projectAPI } from "@/lib/api";

interface Member {
  user: { _id: string; name: string; email: string; avatar?: string };
  role: string;
  joinedAt: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  color: string;
  icon?: string;
  type: "scrum" | "kanban";
  status: string;
  isPrivate: boolean;
  owner: { _id: string; name: string; avatar?: string };
  members: Member[];
  sprints: any[];
  joinCode?: string;
  joinCodeEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: any) => Promise<Project>;
  updateProject: (id: string, data: any) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    const { data } = await projectAPI.getAll();
    set({ projects: data, isLoading: false });
  },

  fetchProject: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await projectAPI.getOne(id);
      set({ currentProject: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err; // Re-throw so callers (layout, pages) can handle 404/403
    }
  },

  createProject: async (projectData) => {
    const { data } = await projectAPI.create(projectData);
    set((state) => ({ projects: [data, ...state.projects] }));
    return data;
  },

  updateProject: async (id, projectData) => {
    const { data } = await projectAPI.update(id, projectData);
    set((state) => ({
      projects: state.projects.map((p) => (p._id === id ? data : p)),
      currentProject: state.currentProject?._id === id ? data : state.currentProject,
    }));
  },

  deleteProject: async (id) => {
    await projectAPI.delete(id);
    set((state) => ({
      projects: state.projects.filter((p) => p._id !== id),
      currentProject: state.currentProject?._id === id ? null : state.currentProject,
    }));
  },

  setCurrentProject: (project) => set({ currentProject: project }),
}));
