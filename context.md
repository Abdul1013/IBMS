# IBMS — Agent Context File
> **Interactive Bulletin Management System**
> Lead City University, Ibadan · Final Year Project
> Lawal Iretomiwa Emmanuel · LCU/UG/22/22140 · Supervisor: Dr. Akolade, M.T.

---

## 1. What This Project Is

IBMS is a full-stack web application that replaces LCU's fragmented memo/WhatsApp communication with a single, role-aware bulletin platform. One URL — different interfaces rendered based on the authenticated user's role. No separate mobile app. No microservices. One backend, one frontend, one database.

**The three problems it solves:**
1. Students miss critical announcements scattered across WhatsApp groups and email
2. Staff have no centralised, access-controlled way to publish and track notices
3. There is no feedback loop — memos are one-way with no acknowledgement or engagement

---

## 2. Academic Context

| Item | Detail |
|---|---|
| Institution | Lead City University, Ibadan, Oyo State, Nigeria |
| Student | Lawal Iretomiwa Emmanuel (LCU/UG/22/22140) |
| Supervisor | Dr. Akolade, M.T. |
| Department | Computer Science, Faculty of Natural and Applied Sciences |
| Degree | B.Sc. Computer Science |
| Compliance | Nigeria Data Protection Act (NDPA) 2023 |

**Research Hypotheses (must be validated in Chapter 4 of the report):**
- **H1** — Centralised RBAC dissemination reduces missed-announcement rate by ≥ 40% vs WhatsApp baseline (validated via Google Forms survey of 30+ students)
- **H2** — Real-time WebSocket updates deliver notices in ≤ 2.0 s P99 @ 500 concurrent sessions (validated via k6 load test)
- **H3** — Interactive features yield avg ≥ 3 engagement interactions per announcement within 24 hours (validated via production analytics)

---

## 3. Technology Stack (Non-Negotiable)

| Layer | Technology |
|---|---|
| Backend | Node.js 20 + Express 5 + TypeScript |
| Database | MongoDB Atlas (free M0 cluster, eu-west-1) |
| ODM | Mongoose |
| Cache / Sessions | Redis 7 via Upstash (free tier) |
| Real-Time | Socket.IO 4 (WebSocket + long-poll fallback) |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS v3 |
| UI Components | shadcn/ui (Radix UI + Tailwind) |
| Rich Text | TipTap (ProseMirror) |
| Charts | Recharts |
| Auth | JWT access token (15 min) + refresh token (7 days, HTTP-only cookie, stored in Redis) |
| File Storage | Cloudinary (free tier) |
| Email | Resend (free tier) |
| Deployment | Railway (backend) + Vercel (frontend) |
| Testing | Vitest (unit) + Supertest (integration) + k6 (load) |
| CI/CD | GitHub Actions |

---

## 4. User Roles & What They See

All roles access the **same URL**. The role encoded in the JWT determines which view is rendered.

| Role | Interface | Can Do |
|---|---|---|
| `SYSTEM_ADMIN` | Admin Console | Full CRUD, user management, analytics, system settings, category management |
| `DEPT_ADMIN` | Staff Portal + Approval Queue | Post and publish announcements, approve/reject STAFF submissions, view dept analytics |
| `STAFF` | Staff Portal | Create drafts, submit for review, view own post engagement |
| `STUDENT` | Bulletin Feed | Browse, search, filter, react, comment, acknowledge announcements |
| Guest (unauth) | Public Landing | View latest global public notices only; no interaction |

---

## 5. Database Collections (MongoDB / Mongoose)

Eight collections. All use MongoDB ObjectId PKs. All have `createdAt` / `updatedAt` via `timestamps: true`. Soft deletes via `deletedAt` field.

| Collection | Purpose | Key Fields |
|---|---|---|
| `users` | All accounts across all roles | name, email, passwordHash, role, department, matricNo, isVerified, isActive, deletedAt |
| `announcements` | Core bulletin entity | title, body (rich HTML), authorId, category, status (DRAFT/PENDING/PUBLISHED/ARCHIVED), priority (NORMAL/HIGH/URGENT), attachments[], targetRoles[], targetDepts[], views, publishedAt, expiresAt, deletedAt |
| `categories` | Announcement taxonomy | name, slug, color, icon, department, isGlobal |
| `comments` | Threaded discussion | announcementId, authorId, body, parentId, isEdited |
| `reactions` | Emoji reactions | announcementId, userId, type (LIKE/HELPFUL/URGENT/NOTED) — unique per user+type+announcement |
| `acknowledgements` | Read receipts | announcementId, userId, acknowledgedAt, ipAddress |
| `notifications` | In-app alert log | recipientId, announcementId, type, isRead, deliveryChannel |
| `audit_logs` | Immutable action trail | actorId, action, targetType, targetId, metadata, ip |

---

## 6. Backend Module Structure

```
apps/api/src/
├── config/            # env.ts (Zod validation), db.ts, redis.ts, logger.ts
├── modules/
│   ├── auth/          # routes.ts, controller.ts, service.ts, dto.ts
│   ├── announcements/ # routes.ts, controller.ts, service.ts, dto.ts
│   ├── comments/      # routes.ts, controller.ts, service.ts
│   ├── reactions/     # routes.ts, controller.ts, service.ts
│   ├── notifications/ # routes.ts, controller.ts, service.ts
│   └── admin/         # routes.ts, controller.ts, service.ts
├── middleware/
│   ├── auth.ts        # verifyToken, requireRole
│   ├── validate.ts    # Zod schema validator wrapper
│   ├── rateLimiter.ts # per-route rate limit configs
│   └── errorHandler.ts
├── models/            # Mongoose schemas (one file per collection)
├── sockets/           # Socket.IO event handlers + room management
├── jobs/              # Cron jobs (expiry archiver) + email queue
├── utils/             # asyncHandler, pagination, emailTemplates
└── app.ts             # Express app factory (imported by server.ts)
```

---

## 7. Frontend Structure

```
apps/web/src/
├── components/
│   ├── ui/            # shadcn/ui primitives
│   ├── layout/        # Sidebar, Navbar, RoleSwitchGuard
│   └── bulletin/      # AnnouncementCard, AnnouncementDetail, CommentThread
├── pages/
│   ├── auth/          # Login.tsx, Register.tsx, ForgotPassword.tsx
│   ├── student/       # Feed.tsx, Detail.tsx, Notifications.tsx, Profile.tsx
│   ├── staff/         # PostAnnouncement.tsx, MyPosts.tsx, AckReport.tsx
│   └── admin/         # Dashboard.tsx, Users.tsx, Categories.tsx, Analytics.tsx
├── hooks/             # useAuth, useAnnouncements, useSocket, useNotifications
├── stores/            # Zustand stores: authStore, notificationStore
├── lib/               # axios instance (with interceptors), socket.ts, queryClient.ts
├── router/            # React Router v6 routes + ProtectedRoute wrapper
└── types/             # Frontend-specific TypeScript types
```

---

## 8. Key Patterns (Follow These Exactly)

### asyncHandler — no try/catch in controllers
```typescript
// utils/asyncHandler.ts
export const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```

### Central error middleware
```typescript
// middleware/errorHandler.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = err.statusCode ?? 500;
  const code   = err.code ?? 'INTERNAL_ERROR';
  res.status(status).json({ success: false, error: { code, message: err.message } });
};
```

### requireRole guard
```typescript
// middleware/auth.ts
export const requireRole = (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role))
      throw new AppError('Forbidden', 403, 'INSUFFICIENT_ROLE');
    next();
  };
```

### Zod env validation (app fails fast on missing vars)
```typescript
// config/env.ts
const envSchema = z.object({
  NODE_ENV:           z.enum(['development', 'production', 'test']),
  MONGO_URI:          z.string().url(),
  REDIS_URL:          z.string().url(),
  JWT_SECRET:         z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CLOUDINARY_URL:     z.string().url(),
  RESEND_API_KEY:     z.string().startsWith('re_'),
  CLIENT_URL:         z.string().url(),
});
export const env = envSchema.parse(process.env);
```

### Standard API response envelope
```typescript
// Success
{ "success": true, "data": { ...payload }, "meta": { "page": 1, "total": 120, "limit": 20 } }

// Error
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Token expired" } }
```

---

## 9. Security Requirements

- **Passwords**: bcrypt, 12 salt rounds, never stored plain
- **JWT**: access token 15 min TTL; refresh token 7 days in HTTP-only cookie; refresh tokens stored in Redis (revocable)
- **Input validation**: Zod on all endpoints before any controller logic
- **Rate limiting**: express-rate-limit — 100 req/15 min public; 20 req/min auth; 10 req/min posting
- **NoSQL injection**: express-mongo-sanitize strips `$` and `.` from req.body
- **XSS**: DOMPurify sanitises announcement HTML body before storage
- **CORS**: strict allowlist — Vercel production URL + localhost only
- **HTTPS**: enforced by Railway + Vercel; HSTS header set
- **NDPA 2023**: privacy notice at registration; no unnecessary PII; data retention policy (inactive accounts archived after 2 years)

---

## 10. Real-Time WebSocket Events (Socket.IO)

| Event | Direction | Payload |
|---|---|---|
| `announcement:new` | Server → Client | `{ id, title, category, priority, author }` |
| `announcement:updated` | Server → Client | `{ id, title, status }` |
| `reaction:update` | Server → Client | `{ announcementId, reactionCounts }` |
| `comment:new` | Server → Client | `{ announcementId, comment }` |
| `notification:new` | Server → Client | `{ notificationId, message, type }` |
| `join:room` | Client → Server | `{ room: "category:academic" }` |

Clients join rooms by category/department slug. Server emits targeted events only to relevant rooms.

---

## 11. Sprint Plan Summary

| Week | Goal | Key Deliverables |
|---|---|---|
| **Week 1** | Foundation & Auth | Repo, schemas, auth API, React SPA shell, role-based redirect, CI deployed |
| **Week 2** | Announcements & Feed | Announcement CRUD, student bulletin feed, Socket.IO real-time push, Cloudinary attachments |
| **Week 3** | Interactions & Admin | Reactions, comments, acknowledgements, approval workflow, admin analytics dashboard |
| **Week 4** | Testing & Submission | H1/H2/H3 validation, Swagger docs, UI polish, production deployment, report data |

---

## 12. Code Style Rules

- **KISS**: each function does one thing — if it needs a comment explaining what it does, split it
- **DRY**: shared types in `packages/types`, shared Zod schemas in `packages/validators` — never duplicate between frontend and backend
- **No magic numbers**: all constants in config files
- **File size**: no file exceeds 200 lines — extract to helpers if it grows beyond that
- **TypeScript**: `strict: true`, no `any`, use `unknown` + type guards
- **Naming**: camelCase variables/functions, PascalCase types/components, SCREAMING_SNAKE_CASE constants, kebab-case filenames
- **Git**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`); all merges via PR; never push directly to `main`

---

## 13. Completed Tasks Log

| # | Task | Status | Output |
|---|---|---|---|
| 1 | Literature Review (50 sources, Chapter 2, ~16,400 words) | ✅ Done | `Chapter2_FINAL_LCU_Iretomiwa_v2.docx` |
| 2 | Development Blueprint (EventFlow-style, 14 sections) | ✅ Done | `IBMS_Blueprint_v1.0.docx` |
| 3 | Repo scaffolding + Week 1 foundation | ✅ Done | `TASK_001_COMPLETE.md` in repo root |
| 4 | Auth module (backend API + frontend UI + tests) | ✅ Done | `TASK_002_COMPLETE.md` in repo root |
| 5 | Announcements, Categories & Bulletin Feed | ✅ Done | `TASK_003_COMPLETE.md` in repo root |
| 6 | Interactions, Engagement & Admin Console | ✅ Done | `TASK_004_COMPLETE.md` in repo root |
| 7 | Testing, Swagger Docs & Production Deploy | ⏳ Next | See `TASK_005_testing_deploy.md` |

---

## 14. Environment Variables Required

```
NODE_ENV=
MONGO_URI=
REDIS_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_URL=
RESEND_API_KEY=
CLIENT_URL=
PORT=5000
```

All must be validated by Zod on startup (see Section 8). App must refuse to start if any are missing.

---

## 15. Deployment Targets

| Service | Platform | Notes |
|---|---|---|
| Backend API | Railway | Auto-deploy from `main` branch; env vars set in Railway dashboard |
| Frontend SPA | Vercel | Auto-deploy from `main` branch; env vars set in Vercel dashboard |
| MongoDB | MongoDB Atlas | Free M0 cluster; eu-west-1 region preferred |
| Redis | Upstash | Free tier; REST API mode |
| Files | Cloudinary | Free tier; 25 GB/month bandwidth |
| Email | Resend | Free tier; sandbox or verified domain |

---

*This file is the ground truth for all agents working on this project. When in doubt, refer back here. Do not deviate from the stack, patterns, or naming conventions defined above.*