import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("sf_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 → clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("sf_token");
      localStorage.removeItem("sf_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data: any) => api.put("/auth/profile", data),
  changePassword: (data: any) => api.put("/auth/change-password", data),
  uploadAvatar: (formData: FormData) => 
    api.post("/auth/upload-avatar", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  logout: () => api.post("/auth/logout"),
};

// ─── Projects ───
export const projectAPI = {
  getAll: () => api.get("/projects"),
  getOne: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post("/projects", data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  invite: (id: string, data: { email: string; role: string }) =>
    api.post(`/projects/${id}/invite`, data),
  removeMember: (projectId: string, userId: string) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
  
  // Invitations
  getPendingInvites: (projectId: string) => api.get(`/projects/${projectId}/invites`),
  getInviteInfo: (token: string) => api.get(`/projects/invites/${token}`),
  acceptInvite: (token: string) => api.post(`/projects/invites/${token}/accept`),
  
  // Join Codes & Roles
  generateJoinCode: (projectId: string) => api.post(`/projects/${projectId}/generate-code`),
  disableJoinCode: (projectId: string) => api.post(`/projects/${projectId}/disable-code`),
  joinWithCode: (code: string) => api.post(`/projects/join-with-code`, { code }),
  updateMemberRole: (projectId: string, userId: string, data: any) =>
    api.patch(`/projects/${projectId}/members/${userId}/role`, data),
};

// ─── Tasks ───
export const taskAPI = {
  getAll: (params?: any) => api.get("/tasks", { params }),
  getOne: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post("/tasks", data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  updateStatus: (id: string, data: any) => api.put(`/tasks/${id}/status`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  addComment: (id: string, data: { content: string }) =>
    api.post(`/tasks/${id}/comments`, data),
  getBacklog: (projectId: string) => api.get(`/tasks/backlog/${projectId}`),
};

// ─── Sprints ───
export const sprintAPI = {
  getAll: (project: string) => api.get("/sprints", { params: { project } }),
  getOne: (id: string) => api.get(`/sprints/${id}`),
  create: (data: any) => api.post("/sprints", data),
  update: (id: string, data: any) => api.put(`/sprints/${id}`, data),
  start: (id: string) => api.put(`/sprints/${id}/start`),
  complete: (id: string) => api.put(`/sprints/${id}/complete`),
  addTask: (id: string, taskId: string) => api.post(`/sprints/${id}/tasks`, { taskId }),
  removeTask: (id: string, taskId: string) => api.delete(`/sprints/${id}/tasks/${taskId}`),
  getBurndown: (id: string) => api.get(`/sprints/${id}/burndown`),
  delete: (id: string) => api.delete(`/sprints/${id}`),
};

// ─── Notifications ───
export const notificationAPI = {
  getAll: () => api.get("/notifications"),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// ─── Wiki ───
export const wikiAPI = {
  getAll: (project: string) => api.get("/wiki", { params: { project } }),
  getOne: (id: string) => api.get(`/wiki/${id}`),
  create: (data: any) => api.post("/wiki", data),
  update: (id: string, data: any) => api.put(`/wiki/${id}`, data),
  delete: (id: string) => api.delete(`/wiki/${id}`),
};

// ─── Analytics ───
export const analyticsAPI = {
  getProject: (projectId: string) => api.get(`/analytics/project/${projectId}`),
  getTeam: (projectId: string) => api.get(`/analytics/project/${projectId}/team`),
};

// ─── Teams ───
export const teamsAPI = {
  search: (q: string) => api.get("/teams/search", { params: { q } }),
};

// ─── Chat ───
export const chatAPI = {
  getMessages: (projectId: string) => api.get(`/messages/${projectId}`),
};

// ─── Issues ───
export const issueAPI = {
  getAll: (project: string) => api.get("/issues", { params: { project } }),
  create: (data: any) => api.post("/issues", data),
};

export default api;
