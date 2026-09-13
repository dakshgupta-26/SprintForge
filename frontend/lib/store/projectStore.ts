import { create } from "zustand";
import { projectAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export interface ProjectMember {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: "owner" | "admin" | "member" | "viewer" | string;
  permissions: Array<"view" | "create" | "edit" | "delete" | "manage">;
  joinedAt: string;
}

export interface ProjectSettings {
  allowAdminMemberManagement?: boolean;
  allowAdminProjectEdit?: boolean;
}

export interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  color: string;
  icon?: string;
  imageUrl?: string;
  type: "scrum" | "kanban";
  status: string;
  isPrivate: boolean;
  owner: { _id: string; name: string; avatar?: string; email?: string };
  members: ProjectMember[];
  settings?: ProjectSettings;
  sprints: any[];
  joinCode?: string;
  joinCodeEnabled?: boolean;
  githubRepo?: string;
  isOwner?: boolean;
  userRole?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  socketInitialized: boolean;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  addProject: (project: Project) => void;
  createProject: (data: any) => Promise<Project>;
  joinWithCode: (code: string) => Promise<{ message: string; projectId: string; project?: Project }>;
  acceptInvite: (token: string) => Promise<{ message: string; projectId: string; project?: Project }>;
  acceptInviteByCode: (code: string) => Promise<{ message: string; projectId: string; project?: Project }>;
  updateProject: (id: string, data: any) => Promise<void>;
  uploadImage: (id: string, file: File) => Promise<{ imageUrl: string; project: Project }>;
  removeImage: (id: string) => Promise<void>;
  transferOwnership: (id: string, newOwnerId: string, confirmProjectName: string) => Promise<void>;
  deleteProject: (id: string, confirmProjectName?: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  initSocketListeners: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  socketInitialized: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const { data } = await projectAPI.getAll();
      set({ projects: data || [], isLoading: false });
      get().initSocketListeners();
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
      get().initSocketListeners();
    } catch (err) {
      set({ isLoading: false });
      throw err;
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
        currentProject: state.currentProject?._id === project._id ? { ...state.currentProject, ...project } : state.currentProject,
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
      projects: state.projects.map((p) => (p._id === id ? { ...p, ...data } : p)),
      currentProject:
        state.currentProject?._id === id ? { ...state.currentProject, ...data } : state.currentProject,
    }));
  },

  uploadImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await projectAPI.uploadImage(id, formData);
    set((state) => ({
      projects: state.projects.map((p) => (p._id === id ? { ...p, ...data.project } : p)),
      currentProject:
        state.currentProject?._id === id ? { ...state.currentProject, ...data.project } : state.currentProject,
    }));
    return data;
  },

  removeImage: async (id: string) => {
    const { data } = await projectAPI.removeImage(id);
    set((state) => ({
      projects: state.projects.map((p) => (p._id === id ? { ...p, ...data.project, imageUrl: undefined } : p)),
      currentProject:
        state.currentProject?._id === id ? { ...state.currentProject, ...data.project, imageUrl: undefined } : state.currentProject,
    }));
  },

  transferOwnership: async (id: string, newOwnerId: string, confirmProjectName: string) => {
    const { data } = await projectAPI.transferOwnership(id, { newOwnerId, confirmProjectName });
    set((state) => ({
      projects: state.projects.map((p) => (p._id === id ? { ...p, ...data.project } : p)),
      currentProject:
        state.currentProject?._id === id ? { ...state.currentProject, ...data.project } : state.currentProject,
    }));
  },

  deleteProject: async (id, confirmProjectName) => {
    await projectAPI.delete(id, confirmProjectName);
    set((state) => ({
      projects: state.projects.filter((p) => p._id !== id),
      currentProject: state.currentProject?._id === id ? null : state.currentProject,
    }));
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  initSocketListeners: () => {
    if (get().socketInitialized) return;
    const socket = getSocket();
    if (!socket) return;

    // Real-time project update listener
    socket.on("project:updated", (updatedProject: Project) => {
      if (!updatedProject?._id) return;
      set((state) => ({
        projects: state.projects.map((p) =>
          p._id === updatedProject._id ? { ...p, ...updatedProject } : p
        ),
        currentProject:
          state.currentProject?._id === updatedProject._id
            ? { ...state.currentProject, ...updatedProject }
            : state.currentProject,
      }));
    });

    // Real-time project deletion listener
    socket.on("project:deleted", ({ projectId }: { projectId: string }) => {
      if (!projectId) return;
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== projectId),
        currentProject: state.currentProject?._id === projectId ? null : state.currentProject,
      }));
    });

    set({ socketInitialized: true });
  },
}));
