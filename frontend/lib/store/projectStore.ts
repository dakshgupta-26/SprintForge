import { create } from "zustand";
import { projectAPI } from "@/lib/api";

interface Member {
  user: { _id: string; name: string; email: string; avatar?: string };
  role: string;
  joinedAt: string;
}

export interface Project {
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
  addProject: (project: Project) => void;
  createProject: (data: any) => Promise<Project>;
  joinWithCode: (code: string) => Promise<{ message: string; projectId: string; project?: Project }>;
  acceptInvite: (token: string) => Promise<{ message: string; projectId: string; project?: Project }>;
  acceptInviteByCode: (code: string) => Promise<{ message: string; projectId: string; project?: Project }>;
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
    try {
      const { data } = await projectAPI.getAll();
      set({ projects: data || [], isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
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

  addProject: (project: Project) => {
    set((state) => {
      const existingIdx = state.projects.findIndex((p) => p._id === project._id);
      let updatedList: Project[];
      if (existingIdx !== -1) {
        updatedList = state.projects.map((p) => (p._id === project._id ? { ...p, ...project } : p));
      } else {
        updatedList = [project, ...state.projects];
      }
      return {
        projects: updatedList,
        currentProject: project,
      };
    });
  },

  createProject: async (projectData) => {
    const { data } = await projectAPI.create(projectData);
    get().addProject(data);
    return data;
  },

  joinWithCode: async (code: string) => {
    const { data } = await projectAPI.joinWithCode(code);
    if (data.project) {
      get().addProject(data.project);
    } else {
      await get().fetchProjects();
    }
    return data;
  },

  acceptInvite: async (token: string) => {
    const { data } = await projectAPI.acceptInvite(token);
    if (data.project) {
      get().addProject(data.project);
    } else {
      await get().fetchProjects();
    }
    return data;
  },

  acceptInviteByCode: async (code: string) => {
    const { data } = await projectAPI.acceptInviteByCode(code);
    if (data.project) {
      get().addProject(data.project);
    } else {
      await get().fetchProjects();
    }
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
