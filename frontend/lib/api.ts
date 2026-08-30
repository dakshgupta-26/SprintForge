import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest", // CSRF custom header verification
  },
  withCredentials: true, // Send and receive HttpOnly cookies
});

// Mutex flag to prevent simultaneous multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Silent Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth entry routes (login, register, refresh itself)
    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/verify-email-otp") ||
      originalRequest.url?.includes("/auth/forgot-password") ||
      originalRequest.url?.includes("/auth/reset-password");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: { "X-Requested-With": "XMLHttpRequest" },
          }
        );
        processQueue(null);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          // Cleanly redirect to login on expired refresh token
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      }
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
  googleLogin: (data: { credential?: string; token?: string }) =>
    api.post("/auth/google", data),
  getMe: () => api.get("/auth/me"),
  refreshSession: () => api.post("/auth/refresh"),
  updateProfile: (data: any) => api.put("/auth/profile", data),
  changePassword: (data: any) => api.put("/auth/change-password", data),
  setPassword: (data: { newPassword: string }) => api.post("/auth/set-password", data),
  forgotPassword: (data: { email: string }) => api.post("/auth/forgot-password", data),
  resetPassword: (data: { token: string; email: string; newPassword: string }) =>
    api.post("/auth/reset-password", data),
  getSessions: () => api.get("/auth/sessions"),
  revokeSession: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),
  revokeOtherSessions: () => api.post("/auth/sessions/revoke-others"),
  getSecurityActivity: () => api.get("/auth/activity"),
  uploadAvatar: (formData: FormData) =>
    api.post("/auth/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  removeAvatar: () => api.delete("/auth/avatar"),
  verifyEmailOtp: (data: { tempToken?: string; email?: string; otp: string }) =>
    api.post("/auth/verify-email-otp", data),
  resendEmailOtp: (data: { tempToken?: string; email?: string }) =>
    api.post("/auth/resend-email-otp", data),
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
  acceptByCode: (code: string) => api.post(`/projects/invites/accept-by-code`, { code }),
  acceptInviteByCode: (code: string) => api.post(`/projects/invites/accept-by-code`, { code }),

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
  getUnreadCounts: () => api.get("/messages/unread"),
  markAsRead: (projectId: string, lastReadMessageId?: string) =>
    api.post(`/messages/${projectId}/read`, { lastReadMessageId }),
  markAllAsRead: () => api.post("/messages/read-all"),
  uploadAttachment: (
    projectId: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/messages/upload/${projectId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
  },
  getAttachmentBlob: (attachmentId: string) => {
    return api.get(`/messages/attachments/${attachmentId}?preview=true`, {
      responseType: "blob",
    });
  },
  getAttachmentUrl: (attachmentId: string, preview = false) => {
    return `${API_BASE}/messages/attachments/${attachmentId}${preview ? "?preview=true" : ""}`;
  },
};

// ─── Issues ───
export const issueAPI = {
  getAll: (project: string) => api.get("/issues", { params: { project } }),
  create: (data: any) => api.post("/issues", data),
};

export default api;
