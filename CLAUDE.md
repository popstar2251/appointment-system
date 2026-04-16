# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is
Appointment booking system with a web interface and voice agent.

## Running the stack

### 1. Database + n8n (Docker)
```bash
docker compose up -d        # starts PostgreSQL (:5432) and n8n (:5678)
docker compose down         # stop
```
n8n UI: http://localhost:5678 — click **Publish** to activate a workflow (saves + activates the production webhook).

### 2. ngrok (required for Retell)
```bash
ngrok http 3000             # exposes localhost:3000 publicly; copy the https URL into the Retell tool config
```
The ngrok URL changes on every restart (free plan) — update it in the Retell `book_appointment` tool settings each session.

### 3. Backend
```bash
cd backend
cp .env.example .env        # first-time setup — fill in JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev                 # tsx watch on Node 24, port 3000
npm run build               # compile TypeScript → dist/
npm start                   # run compiled output
npm run seed                # (re-)create admin user from ADMIN_EMAIL / ADMIN_PASSWORD in .env
npm test                    # Vitest unit tests
```
> Node 24 notes: Express 4 (not 5) + `tsx watch` is the working combination. ts-node is incompatible with Node 24. Express 5 silently drops requests under tsx on Node 24.

**First-time setup:** the admin user is created automatically on first `npm run dev` from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`. Generate `JWT_SECRET` with `openssl rand -base64 32`.

### 4. Frontend
```bash
cd frontend
npm run dev                 # Vite dev server with HMR, port 5174
npm run build               # type-check + Vite build
npm run lint                # ESLint
npm run preview             # preview production build
npm run test:e2e            # Playwright E2E tests (requires full stack running)
```

### Prisma (run from `/backend`)
```bash
npx prisma migrate dev      # apply migrations + regenerate client
npx prisma generate         # regenerate client only
npx prisma studio           # visual DB browser
```

## Architecture

Two independent apps (not a monorepo) connected via HTTP:

```
Browser → Frontend (React/Vite :5174)
               ↓ axios HTTP (withCredentials: true)
          Backend (Express :3000)
               ↓ Prisma ORM
          PostgreSQL (:5432, Docker)

          Backend ──fire-and-forget──→ n8n (:5678, Docker) → Gmail SMTP
          Retell AI ──tool calls──→ Backend (via ngrok HTTPS URL)
```

### Backend layered structure
```
routes/appointments.ts      → express Router; per-route requireAuth guards
controllers/appointments.ts → HTTP handlers (req/res), error codes
services/appointments.ts    → business logic, all Prisma calls, SlotTakenError
schemas/appointment.ts      → Zod schemas (single source of truth for types + past-date refine)
middleware/validate.ts      → HOF that validates req.body against a Zod schema
middleware/requireAuth.ts   → reads JWT from httpOnly cookie, returns 401 if invalid
lib/prisma.ts               → PrismaClient singleton
lib/auth.ts                 → hashPassword, verifyPassword, signToken, verifyToken
lib/n8n.ts                  → notifyAppointmentCreated() and notifyStatusChanged() — fire-and-forget
services/auth.ts            → login(), bootstrapAdmin() (idempotent upsert on boot)
controllers/auth.ts         → loginHandler, logoutHandler, meHandler
routes/auth.ts              → POST /auth/login, POST /auth/logout, GET /auth/me
routes/retell.ts            → POST /retell/tool
controllers/retell.ts       → receives book_appointment tool args, calls createAppointment service
seed.ts                     → one-shot script: calls bootstrapAdmin() manually (`npm run seed`)
```

### Frontend data flow
```
BookingPage (public: /book)
  ↓ react-hook-form + Zod (client-side validation including past-date refine)
  ↓ api/appointments.ts → POST /appointments

LoginPage (/login)
  ↓ AuthContext.login() → POST /auth/login → JWT set as httpOnly cookie

AppointmentsPage (admin: /admin, wrapped by ProtectedRoute)
  ↓ checks AuthContext — redirects to /login if not authenticated
  ↓ api/appointments.ts (axios, withCredentials: true) → GET, PATCH, DELETE /appointments
```

**Auth flow:** `AuthContext` hydrates on mount via `GET /auth/me`. `ProtectedRoute` shows nothing while hydrating (prevents flash of login page), then redirects if no session. A global axios 401 interceptor redirects to `/login` on expired sessions (skips `/auth/*` to avoid redirect loops).

- Path alias `@/` resolves to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)
- Add Shadcn components with: `npx shadcn@latest add <component>` (run from `/frontend`)

## Validation strategy
Zod is used on **both sides**:
- **Backend:** `schemas/appointment.ts` defines schemas with an object-level `refine` for past-date checking; `middleware/validate.ts` rejects bad requests with 400
- **Frontend:** same rules in `BookingPage.tsx` and `AppointmentForm.tsx` via `@hookform/resolvers/zod` for UX feedback before the request is sent

Types on the backend are derived with `z.infer<typeof schema>` — no separate type declarations needed for validated data.

## Double-booking prevention
`services/appointments.ts` queries for an existing non-cancelled appointment at the same date + time before creating. Returns `SlotTakenError` which the controller maps to HTTP 409. Frontend shows the server error message via sonner toast.

## n8n workflows (current state)

**appointment-created**
```
Webhook (POST /webhook/appointment-created)
  → Code node (formats HTML email from $input.first().json.body)
  → Send Email (Gmail SMTP, HTML format)
```

**appointment-status-changed**
```
Webhook (POST /webhook/appointment-status-changed)
  → Code node → Send Email
```

**Key n8n facts:**
- Webhook data arrives at `$input.first().json.body` (not `.json` directly) in n8n 1.x
- Test URL (`/webhook-test/`) only works while clicking "Listen" — use Production URL + Publish for persistent workflows
- Send Email node must be set to **HTML** format for `<b>` tags to render
- **Publish** button = save + activate

## REST API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/appointments` | Admin cookie | List all (sorted by createdAt desc) |
| GET | `/appointments/:id` | Admin cookie | Get single appointment |
| POST | `/appointments` | Public | Create — validates with Zod, fires n8n webhook (fire-and-forget) |
| PATCH | `/appointments/:id/status` | Admin cookie | Update status (pending → confirmed → cancelled) |
| DELETE | `/appointments/:id` | Admin cookie | Delete |
| POST | `/auth/login` | — | Set JWT cookie |
| POST | `/auth/logout` | — | Clear JWT cookie |
| GET | `/auth/me` | Cookie | Returns current user or 401 |
| POST | `/retell/tool` | — | Retell tool call handler |
| GET | `/ping` | — | Diagnostic health check, bypasses all middleware |
| GET | `/health` | — | DB connectivity check via Prisma |

## Database schema (Prisma models)
```
Appointment { id, clientName, clientPhone, clientEmail, date, time, service, status, createdAt }
AdminUser   { id, email, passwordHash, createdAt }
```
- `id`: UUID, auto-generated
- `status`: String defaulting to `"pending"`
- `date`/`time`: stored as String (not DateTime)

## Backend conventions
- Layered architecture: `routes` → `controllers` → `services` → Prisma
- File and folder names in English, camelCase
- Correct HTTP status codes: 200, 201, 400, 401, 404, 409, 500, 503
- Prisma error code `P2025` used to detect not-found cases (results in 404)
- `SlotTakenError` thrown by services, mapped to 409 in controllers
- n8n webhook calls are fire-and-forget — errors are caught and logged, never bubble up

## Notes for Claude
- Update this file automatically as the project evolves
- This version of Shadcn (`@base-ui/react`) does NOT have `asChild` — use `render={}` prop or controlled dialog state
- ESLint rule `react-refresh/only-export-components` fires on context files; suppress with file-level `/* eslint-disable react-refresh/only-export-components */` and a comment explaining why
