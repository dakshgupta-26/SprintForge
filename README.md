<div align="center">

<img src="https://img.shields.io/badge/SprintForge-v1.0.0-6366f1?style=for-the-badge&labelColor=0f0f0f" alt="SprintForge" />

# ⚡ SprintForge

### *The Modern Agile Project Management Platform*

> Where agile teams build faster, smarter, and together.

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express.js-4x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

**SprintForge** is a full-stack, production-ready Agile project management SaaS platform — a modern alternative to Jira and Linear. Built for software teams working with **Scrum** and **Kanban**, it provides real-time collaboration, encrypted messaging, role-based access control, and powerful project analytics — all in a beautiful, responsive UI.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🧱 Tech Stack](#-tech-stack)
- [🗂 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [🐳 Docker Deployment](#-docker-deployment)
- [⚙️ Environment Variables](#️-environment-variables)
- [📡 API Reference](#-api-reference)
- [🔌 Socket.IO Events](#-socketio-events)
- [🔐 Security](#-security)
- [🤝 Contributing](#-contributing)

---

## ✨ Features

### 🏗️ Project Management
- **Scrum & Kanban Projects** — Create projects in either methodology with custom colors, icons, and descriptions
- **Public & Private Projects** — Control visibility with fine-grained access
- **Project Join Codes** — Share a 6-character alphanumeric code for instant access (like Google Classroom)
- **Email Invitations** — Invite team members by email with customized invite links (3-day expiry)

### 📋 Kanban Board
- **Drag-and-Drop Board** — Move tasks across **5 columns**: `To Do → In Progress → In Review → Blocked → Done`
- **Live Board Sync** — Changes reflect instantly across all connected users via Socket.IO
- **Task Cards** — Rich task cards with priority flags, assignees, labels, and story points
- **Cursor Presence** — See live cursors of collaborators on the board

### 📅 Sprint Management
- **Sprint Lifecycle** — Create → Start → Complete sprints with date ranges and goals
- **Backlog Management** — Drag tasks from backlog into active sprints
- **Velocity Tracking** — Track completed vs total story points per sprint

### 📊 Analytics & Reporting
- **Burndown Charts** — Real-time sprint burndown visualization with Recharts
- **Velocity Charts** — Sprint-over-sprint velocity comparison
- **Cumulative Flow Diagram** — See work distribution across stages over time
- **Project Statistics** — Task completion rates, open issues, member activity

### 💬 Project Chat (Encrypted)
- **Real-time Messaging** — Instant messaging within each project room via Socket.IO
- **AES-256-CBC Encryption** — All messages are encrypted at rest before storing in MongoDB
- **Typing Indicators** — Live "Daksh is typing..." animation
- **Message Grouping** — Consecutive messages from the same sender are visually grouped

### 🐛 Issue Tracker
- **Bug Reporting** — Log issues with severity levels (Critical, High, Medium, Low)
- **Issue Assignment** — Assign bugs to team members for resolution tracking

### 📚 Wiki / Docs
- **Markdown Editor** — Rich `@uiw/react-md-editor` for writing project documentation
- **Hierarchical Pages** — Support for parent/child wiki pages
- **Slug-based Routing** — Clean, readable URLs per wiki page
- **Publish/Draft Toggle** — Control which pages are live

### 👥 Team & RBAC
- **Role-Based Access Control** — Three tiers: `Admin`, `Member`, `Viewer`
- **Granular Permissions** — `view`, `create`, `edit`, `delete`, `manage` per member
- **Role Management** — Admins can update any member's role and permissions in real-time
- **Member Removal** — Remove members from projects instantly

### 🔔 Notifications
- **Real-time Alerts** — Socket.IO powered in-app notifications
- **Notification Types** — Task assignments, comments, invites, sprint start/end
- **In-App Panel** — Browse and manage all notifications in a dedicated page

### 🔐 Authentication
- **JWT Authentication** — Secure, stateless auth with configurable expiry
- **bcryptjs Password Hashing** — Industry-standard password security
- **Protected Routes** — All dashboard routes server-guarded via middleware

---

## 🧱 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router + TypeScript) | Full-stack React framework |
| **TailwindCSS v4** | Utility-first styling with custom design system |
| **Framer Motion** | Smooth page and component animations |
| **@hello-pangea/dnd** | Accessible drag-and-drop for Kanban |
| **Recharts** | Burndown, velocity, and flow charts |
| **Zustand** | Lightweight global state management |
| **Socket.IO Client** | Real-time bidirectional events |
| **Radix UI** | Accessible headless UI primitives |
| **Lucide React** | Icon library |
| **date-fns** | Date formatting and manipulation |
| **Axios** | HTTP client for API calls |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express.js** (TypeScript) | REST API server |
| **MongoDB + Mongoose** | NoSQL database with schema validation |
| **Socket.IO** | WebSocket server for real-time features |
| **JWT + bcryptjs** | Authentication and password security |
| **Multer** | File/image upload handling |
| **Mailjet API (`node-mailjet`)** | Transactional email delivery (OTP, Password Reset, Invitations) |
| **AES-256-CBC (crypto)** | End-to-end message encryption |
| **express-rate-limit** | DDoS and brute-force protection |
| **Helmet** | HTTP security headers |
| **Morgan** | HTTP request logging |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Containerized deployment |
| **MongoDB Atlas** | Cloud-hosted database (production) |

---

## 🗂 Project Structure

```
sprintforge/
│
├── 📁 frontend/                        # Next.js 16 App (TypeScript)
│   ├── app/
│   │   ├── page.tsx                   # Landing page
│   │   ├── login/                     # Login page
│   │   ├── signup/                    # Signup page
│   │   ├── invite/[token]/            # Email invitation accept page
│   │   ├── privacy/                   # Privacy policy page
│   │   ├── terms/                     # Terms of service page
│   │   └── dashboard/                 # 🔒 Protected app area
│   │       ├── layout.tsx             # Sidebar + Navbar layout
│   │       ├── page.tsx               # Main dashboard with quick stats
│   │       ├── analytics/             # Global analytics view
│   │       ├── notifications/         # Notification center
│   │       ├── profile/               # User profile settings
│   │       ├── settings/              # App settings
│   │       ├── tasks/                 # All-tasks view (cross-project)
│   │       ├── team/                  # Global team management
│   │       └── projects/
│   │           └── [id]/              # Per-project pages
│   │               ├── board/         # 🗂 Kanban board
│   │               ├── backlog/       # 📑 Backlog management
│   │               ├── sprints/       # 🏃 Sprint management
│   │               ├── analytics/     # 📊 Burndown & velocity charts
│   │               ├── chat/          # 💬 Encrypted project chat
│   │               ├── team/          # 👥 Member management & roles
│   │               ├── wiki/          # 📚 Documentation
│   │               └── issues/        # 🐛 Bug tracker
│   │
│   ├── components/
│   │   ├── board/                     # Kanban board + Task Detail Modal
│   │   ├── chat/                      # ChatRoom component
│   │   ├── projects/                  # Project creation/join modals
│   │   └── shared/                    # Sidebar, Navbar, layout wrappers
│   │
│   └── lib/
│       ├── api.ts                     # Typed Axios API client
│       ├── socket.ts                  # Socket.IO singleton client
│       ├── utils.ts                   # Utility functions & avatar generator
│       └── store/                     # Zustand stores (auth, etc.)
│
├── 📁 backend/                         # Node.js + Express API (TypeScript)
│   └── src/
│       ├── server.ts                  # App entry point & Express setup
│       ├── models/
│       │   ├── User.ts               # User schema (roles, OAuth)
│       │   ├── Project.ts            # Project schema (members, RBAC)
│       │   ├── Task.ts               # Task schema (board, sprints)
│       │   ├── Sprint.ts             # Sprint schema (lifecycle)
│       │   ├── Message.ts            # Encrypted chat message schema
│       │   ├── Comment.ts            # Task comment schema
│       │   ├── Notification.ts       # Notification schema
│       │   ├── Invitation.ts         # Email invite schema (tokens)
│       │   └── Wiki.ts               # Wiki/docs page schema
│       ├── controllers/              # Business logic handlers
│       ├── routes/                   # Express route definitions
│       ├── middleware/
│       │   ├── auth.ts               # JWT verification middleware
│       │   ├── rbac.ts               # Role-based permission middleware
│       │   ├── upload.ts             # Multer file upload config
│       │   ├── rateLimiter.ts        # Rate limiting
│       │   └── errorHandler.ts       # Global error handler
│       ├── socket/
│       │   └── index.ts              # Socket.IO event handlers
│       ├── services/
│       │   └── emailService.ts       # Mailjet email delivery & templates
│       └── utils/
│           └── crypto.ts             # AES-256-CBC encrypt/decrypt
│
├── docker-compose.yml                  # Full stack Docker setup
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **MongoDB** (locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/dakshgupta-26/SprintForge.git
cd SprintForge
```

### 2. Setup the Backend
```bash
cd backend

# Copy and configure environment variables
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET at minimum

# Install dependencies
npm install

# Start development server
npm run dev
# ✅ API running at http://localhost:5000
```

### 3. Setup the Frontend
```bash
cd frontend

# .env.local is pre-configured for local development
# Verify NEXT_PUBLIC_API_URL=http://localhost:5000/api

npm install
npm run dev
# ✅ App running at http://localhost:3000
```

---

## 🐳 Docker Deployment

The entire stack (MongoDB + Backend + Frontend) can be started with a single command:

```bash
# From the root directory
docker-compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| MongoDB | localhost:27017 |

To stop everything:
```bash
docker-compose down
```

---

## ⚙️ Environment Variables

### Backend — `backend/.env`
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/sprintforge

# Auth
JWT_SECRET=your_super_secret_32_char_jwt_key_here
JWT_EXPIRES_IN=7d

# Chat Encryption (AES-256-CBC — must be exactly 32 chars in production)
ENCRYPTION_KEY=vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3

# Frontend (for CORS)
CLIENT_URL=http://localhost:3000

# Email (Mailjet API)
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
MAILJET_FROM_EMAIL=your_verified_email@domain.com
MAILJET_FROM_NAME=SprintForge

# Optional OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Frontend — `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

> [!WARNING]
> **Production**: Always use a strong, random 32-character `ENCRYPTION_KEY` and `JWT_SECRET`. Never commit `.env` files to version control.

---

## 📡 API Reference

### 🔐 Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and get JWT |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `PUT` | `/api/auth/profile` | Update user profile |

### 📁 Projects
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List all user projects |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/:id` | Get project details |
| `PUT` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project (owner only) |
| `POST` | `/api/projects/:id/invite` | Invite member by email |
| `POST` | `/api/projects/:id/join-code/generate` | Generate a 6-char join code |
| `POST` | `/api/projects/:id/join-code/disable` | Disable the join code |
| `POST` | `/api/projects/join` | Join project via code |
| `PUT` | `/api/projects/:id/members/:userId` | Update member role/permissions |
| `DELETE` | `/api/projects/:id/members/:userId` | Remove member from project |

### ✅ Tasks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks?project=:id` | Get tasks for a project |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/:id` | Get task details |
| `PUT` | `/api/tasks/:id` | Update task |
| `PUT` | `/api/tasks/:id/status` | Move task (Kanban drag-drop) |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `POST` | `/api/tasks/:id/comments` | Add a comment to a task |

### 🏃 Sprints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sprints?project=:id` | Get sprints for a project |
| `POST` | `/api/sprints` | Create a sprint |
| `PUT` | `/api/sprints/:id/start` | Start a sprint |
| `PUT` | `/api/sprints/:id/complete` | Complete a sprint |
| `GET` | `/api/sprints/:id/burndown` | Get burndown chart data |

### 📊 Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/project/:id` | Full project analytics |
| `GET` | `/api/analytics/project/:id/velocity` | Sprint velocity data |

### 💬 Messages
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/messages/:projectId` | Get last 100 messages (decrypted) |
| `POST` | `/api/messages/upload` | Upload a file/image for chat |

### 📚 Wiki
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wiki?project=:id` | Get all wiki pages |
| `POST` | `/api/wiki` | Create a wiki page |
| `GET` | `/api/wiki/:id` | Get a single page |
| `PUT` | `/api/wiki/:id` | Update a wiki page |
| `DELETE` | `/api/wiki/:id` | Delete a wiki page |

### 🔔 Notifications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get all notifications |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read |
| `PUT` | `/api/notifications/read-all` | Mark all as read |

---

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join:user` | `userId` | Join personal notification room |
| `join:project` | `projectId` | Join project room for live updates |
| `leave:project` | `projectId` | Leave project room |
| `join:task` | `taskId` | Join task room for live comments |
| `chat:message` | `{ projectId, sender, content }` | Send a chat message |
| `chat:typing:start` | `{ projectId, userId, userName }` | Broadcast typing start |
| `chat:typing:stop` | `{ projectId, userId }` | Broadcast typing stop |
| `typing:start` | `{ taskId, userId, userName }` | Typing in task comments |
| `typing:stop` | `{ taskId, userId }` | Stopped typing in task comments |
| `cursor:move` | `{ projectId, userId, position }` | Live cursor position |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `chat:message:receive` | `Message` | New chat message received |
| `chat:typing:start` | `{ userId, userName }` | Someone is typing |
| `chat:typing:stop` | `{ userId }` | Someone stopped typing |
| `presence:joined` | `{ userId, projectId }` | User came online in project |
| `presence:left` | `{ userId, projectId }` | User went offline |
| `task:moved` | `Task` | Task dragged to new status |
| `task:updated` | `Task` | Task details changed |
| `comment:added` | `Comment` | New comment on a task |
| `notification:new` | `Notification` | New in-app notification |
| `project:member_joined` | `{ userId, name, role }` | New member joined project |
| `project:member_updated` | `Member` | Member role/permissions changed |
| `typing:start` | `{ userId, userName }` | Someone typing in task |
| `typing:stop` | `{ userId }` | Stopped typing in task |

---

## 🔐 Security

- **JWT Authentication** — All API routes protected via `protect` middleware
- **Role-Based Access Control (RBAC)** — Granular 5-tier permission system (`view`, `create`, `edit`, `delete`, `manage`) enforced at route level via `requirePermission` middleware
- **AES-256-CBC Encryption** — All chat messages encrypted before storage in MongoDB; decrypted on fetch, never at rest as plaintext
- **Helmet.js** — Secure HTTP headers (XSS, CSP, HSTS, etc.)
- **express-rate-limit** — Auth routes rate-limited to prevent brute-force attacks
- **bcryptjs** — Passwords hashed with 12 salt rounds before storage
- **CORS** — Strict origin whitelisting via `CLIENT_URL` environment variable
- **HTTPS/WSS** — All communication secured via TLS in production (Docker deployment)

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-amazing-feature
   ```
3. Commit your changes
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. Push to your branch
   ```bash
   git push origin feature/your-amazing-feature
   ```
5. Open a **Pull Request** with a clear description

Please follow the existing code style (TypeScript strict, ESLint rules).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Daksh Gupta](https://github.com/dakshgupta-26)**

*Ship faster, together.* ⚡

[![GitHub](https://img.shields.io/badge/GitHub-dakshgupta--26-181717?style=for-the-badge&logo=github)](https://github.com/dakshgupta-26/SprintForge)

</div>
