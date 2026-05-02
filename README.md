# IBMS — Interactive Bulletin Management System

> Final Year Project · Lead City University, Ibadan · Lawal Iretomiwa Emmanuel (LCU/UG/22/22140)

A full-stack web application that replaces fragmented memo/WhatsApp communication at Lead City University with a single, role-aware bulletin platform. One URL — different interfaces rendered based on the authenticated user's role.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20 + Express 5 + TypeScript |
| Database | MongoDB Atlas (Mongoose) |
| Cache / Real-time | Redis (Upstash) + Socket.IO 4 |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS v3 |
| UI | shadcn/ui (Radix UI) + TipTap rich text + Recharts |
| Auth | JWT (15 min access) + HTTP-only refresh cookie (7 days, Redis-backed) |
| File Storage | Cloudinary |
| Email | Resend |
| Deployment | Render (API) + Vercel (Frontend) |

## User Roles

| Role | Interface |
|---|---|
| `SYSTEM_ADMIN` | Full admin console — users, categories, analytics |
| `DEPT_ADMIN` | Approval queue + department analytics |
| `STAFF` | Create drafts, submit for review, track engagement |
| `STUDENT` | Bulletin feed — browse, react, comment, acknowledge |
| Guest | Public landing — read-only global notices |

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for local MongoDB + Redis)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd IBMS
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and fill in all values

# 3. Start backing services
docker compose up -d

# 4. Seed admin user and categories
npx ts-node -P apps/api/tsconfig.json apps/api/src/scripts/createAdmin.ts

# 5. Start both servers (in separate terminals)
npm run dev:api        # API  → http://localhost:5000
npm run dev:web        # Web  → http://localhost:3000
```

### Useful Commands

```bash
npm run build          # Build API + Web
npm run lint           # ESLint across all workspaces
npm run format         # Prettier

npm test --workspace=apps/api   # Run API test suite
```

### Health Check

```
GET http://localhost:5000/health
```

## Project Structure

```
ibms/
├── apps/
│   ├── api/                   # Express + TypeScript backend
│   │   └── src/
│   │       ├── config/        # env, db, redis, logger
│   │       ├── middleware/    # auth, validate, rateLimiter, errorHandler
│   │       ├── models/        # Mongoose schemas
│   │       ├── modules/       # auth, announcements, comments, reactions, notifications, admin
│   │       ├── sockets/       # Socket.IO room handlers + emitter
│   │       ├── jobs/          # Cron archiver job
│   │       └── scripts/       # createAdmin seed script
│   └── web/                   # React + Vite frontend
│       └── src/
│           ├── components/    # ui, layout, bulletin
│           ├── pages/         # auth, student, staff, admin
│           ├── hooks/         # useAuth, useAnnouncements, useNotifications
│           ├── stores/        # Zustand (authStore, notificationStore)
│           └── lib/           # axios, socket.ts, queryClient.ts
├── packages/
│   ├── types/                 # Shared TypeScript types
│   └── validators/            # Shared Zod schemas
├── render.yaml                # Render backend deployment config
├── vercel.json                # Vercel frontend deployment config
└── docker-compose.yml         # Local dev: MongoDB + Redis
```

## API Overview

All endpoints are prefixed `/api/v1/`.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `/login` · `/refresh` · `/logout` · `/verify-email` · `/forgot-password` · `/reset-password` |
| Announcements | `GET/POST /announcements` · `PATCH/DELETE /announcements/:id` · `/status` · `/attachments` · `/reactions` · `/acknowledge` · `/comments` |
| Categories | `GET/POST /categories` · `PATCH/DELETE /categories/:id` |
| Comments | `PATCH/DELETE /comments/:id` |
| Notifications | `GET/PATCH /notifications` · `/notifications/read-all` |
| Admin | `GET/PATCH /admin/users` · `/admin/pending` · `/admin/analytics` |

## Deployment

### Backend → Render

1. New project → **Blueprint** → connect this repo (auto-detects `render.yaml`)
2. Set environment variables in the Render dashboard (see `.env.example`)

### Frontend → Vercel

1. Import repo → Vercel auto-detects `vercel.json`
2. Add environment variable: `VITE_API_URL=https://<your-app>.onrender.com`

### Required Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions.

## CI/CD

GitHub Actions runs on every push:
- **lint-and-build** — ESLint (zero warnings) + TypeScript build for both workspaces
- **test** — Vitest integration suite against real MongoDB + Redis containers

Build Command:


npm install && npm run build:api
Start Command:


npm start --workspace=apps/api


upstash - redis 
mongodb - database 
render - backend 
vercel - frontend 

SUS survey — create a quick Google Form with the 10 standard SUS questions, send it to 15–20 coursemates and a few staff. You'll have real scores within a day.

Engagement data — post 3–5 test announcements on the live system, ask your coursemates to interact. Screenshot the analytics after 24 hours.

