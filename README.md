# 🚀 SprintForge — Agile Project Management Platform

> **Where Agile Teams Build Faster, Smarter, Better**

SprintForge is a full-stack SaaS Agile project management platform built for software development teams using Scrum and Kanban methodologies. A modern, production-ready alternative to Jira and Trello.

![SprintForge](https://img.shields.io/badge/SprintForge-v1.0.0-6366f1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Express](https://img.shields.io/badge/Express-4-green?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?style=for-the-badge&logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-black?style=for-the-badge)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Authentication | JWT auth, signup/login, OAuth-ready (Google/GitHub) |
| 📁 Projects | Create Scrum or Kanban projects, public/private |
| 📋 Kanban Board | Drag-and-drop tasks across 5 columns |
| 🏃 Sprint Management | Create, start, complete sprints with progress tracking |
| 📊 Burndown Charts | Real-time burndown, velocity, cumulative flow |
| 🤖 AI Estimation | Smart story point suggestions |
| 📝 Backlog | Manage unassigned tasks, move to sprints |
| 🐛 Bug Tracker | Issue reporting with severity levels |
| 👥 Team | Invite members, role-based access (Admin/Member/Viewer) |
| 🔔 Notifications | Real-time Socket.IO alerts + in-app panel |
| 📚 Wiki | Markdown editor for project documentation |
| ⚡ Real-time | Live board updates via Socket.IO |

---

## 🧱 Tech Stack

### Frontend
- **Next.js 14** (App Router + TypeScript)
- **TailwindCSS** — Custom design system with dark/light mode
- **Framer Motion** — Smooth animations
- **@hello-pangea/dnd** — Drag and drop
- **Recharts** — Analytics charts
- **Zustand** — Global state management
- **Socket.IO Client** — Real-time updates

### Backend
- **Node.js + Express.js** (TypeScript)
- **MongoDB + Mongoose** — Database
- **Socket.IO** — Real-time events
- **JWT + bcryptjs** — Authentication
- **express-rate-limit** — Security

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm
- MongoDB (locally or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/sprintforge.git
cd sprintforge
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

The API will start at **http://localhost:5000**

### 3. Setup Frontend
```bash
cd frontend
# .env.local is already configured for local dev
npm install
npm run dev
```

The app will open at **http://localhost:3000**

---

## 🐳 Docker Deployment

Run everything with one command:

```bash
# From the root directory
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- Backend API on port 5000
- Frontend on port 3000

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sprintforge
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Optional OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🗂 Project Structure

```
sprintforge/
├── frontend/                   # Next.js 14 App
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Auth pages
│   │   ├── signup/
│   │   └── dashboard/         # Protected app
│   │       ├── layout.tsx     # Dashboard layout (sidebar+navbar)
│   │       ├── page.tsx       # Home dashboard
│   │       ├── projects/      # Project management
│   │       ├── notifications/ # Notifications
│   │       └── projects/[id]/ # Per-project pages
│   │           ├── board/     # Kanban board
│   │           ├── backlog/   # Backlog
│   │           ├── sprints/   # Sprint management
│   │           ├── analytics/ # Charts & metrics
│   │           ├── team/      # Team management
│   │           ├── wiki/      # Documentation
│   │           └── issues/    # Bug tracker
│   ├── components/
│   │   ├── board/             # Kanban + modals
│   │   ├── projects/          # Project modals
│   │   └── shared/            # Layout, Sidebar, Navbar
│   └── lib/
│       ├── api.ts             # Axios API client
│       ├── socket.ts          # Socket.IO client
│       ├── utils.ts           # Utilities
│       └── store/             # Zustand stores
│
├── backend/                    # Express.js API
│   └── src/
│       ├── server.ts          # App entry point
│       ├── models/            # Mongoose schemas
│       ├── controllers/       # Business logic
│       ├── routes/            # API routes
│       ├── middleware/        # Auth, rate limiting
│       └── socket/            # Socket.IO events
│
├── docker-compose.yml
└── README.md
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| POST | `/api/projects/:id/invite` | Invite member |
| GET | `/api/tasks` | List tasks (with filters) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id/status` | Update task status (drag-drop) |
| GET | `/api/sprints` | List sprints |
| PUT | `/api/sprints/:id/start` | Start sprint |
| GET | `/api/sprints/:id/burndown` | Get burndown data |
| GET | `/api/analytics/project/:id` | Get project analytics |
| GET | `/api/notifications` | Get notifications |
| GET | `/api/wiki` | Get wiki pages |

---

## 🔌 Real-time Events (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `join:user` | Client → Server | Join personal notification room |
| `join:project` | Client → Server | Join project room for board updates |
| `task:moved` | Server → Client | Task moved on kanban board |
| `task:updated` | Server → Client | Task details updated |
| `comment:added` | Server → Client | New comment on task |
| `notification` | Server → Client | New notification |
| `typing:start/stop` | Bidirectional | Typing indicator in comments |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ by the SprintForge team. **Ship faster, together.**
