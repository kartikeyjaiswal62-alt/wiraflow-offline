# Wiraflow Backend (Supabase‑like) — Implementation Plan

This plan targets a **$0-to-start** backend that feels “Supabase-like” for generated apps, while staying realistic for a student team.

It is intentionally staged: **Supabase‑lite MVP first**, then advanced features (storage/realtime/platform provisioning).

---

## 0) Operating Constraints (Design Rules)

### Cost
- Prefer **free tiers** and self-hosted dev only.
- If a service requires a credit card for “free”, treat it as **optional** and provide an alternative.

### Time
- Each autonomous iteration should be **30–60 minutes**, touching **≤5 files** and ending with a log entry.

### Scope (MVP)
MVP must support:
- Auth (JWT)
- Postgres-backed data with **RLS**
- Edge functions (HTTP)
- Basic project keys (anon/service) semantics

Defer until later:
- Realtime subscriptions at scale
- Storage (S3/R2) with signed URLs
- Multi-project provisioning and dashboard

---

## 1) Recommended Stack (Free-tier Friendly)

### Database
- **Neon Postgres** (serverless managed Postgres) for prod-like environments.
- Local Postgres via Docker for offline development (optional).

### Edge Runtime
- **Cloudflare Workers** (free tier) as the “Edge Functions” execution layer.
- Use a fetch/WebSocket Postgres driver (no raw TCP).

### Language / Framework
- TypeScript
- **Hono** for the edge HTTP router (runs on Workers and also on Node for local dev).

### Database Access + Migrations
- **Drizzle ORM + drizzle-kit** (migrations + type safety).
  - Use Neon-compatible adapters for edge/serverless.

---

## 1.1) Proposed Repo Layout (inside `wiraflow/`)

Add a second app alongside `apps/web`:

```txt
wiraflow/
  apps/
    web/                  (existing Next.js UI)
    edge/                 (new Cloudflare Worker: API + edge functions)
  packages/
    db/                   (new: schema + migrations + db client)
    contracts/            (existing: shared types)
    backend-planner/      (existing: intent → backend graph)
    supabase-generator/   (existing: graph → supabase schema plan)
```

---

## 1.2) Environment Variables (MVP)

Create `wiraflow/apps/edge/.env.example` (and never commit real values):
- `NEON_DATABASE_URL` (direct/non-pooled URL recommended for migrations)
- `JWT_SECRET` (HS256 secret for MVP) **or** `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` (preferred later)
- `SERVICE_ROLE_KEY` (server-only API key that can bypass RLS)
- `ANON_KEY` (public API key with minimal privileges)
- `CORS_ORIGIN` (dev origin allowlist)

Note: if using any pooling/transaction pooler, always set claims **inside the same transaction** that runs queries.

---

## 1.3) HTTP API Conventions (Supabase-like)

Recommended request headers:
- `apikey: <ANON_KEY | SERVICE_ROLE_KEY>` (identifies the project key)
- `Authorization: Bearer <user_jwt>` (end-user identity; optional for anon routes)

Suggested routes (aligning with Supabase naming where helpful):
- `POST /auth/v1/signup`
- `POST /auth/v1/token` (password grant)
- `POST /auth/v1/token?grant_type=refresh_token`
- `GET  /auth/v1/user`
- `POST /functions/v1/:name` (edge functions)
- `GET/POST/PATCH/DELETE /rest/v1/:table` (minimal CRUD; expand gradually)

---

## 2) System Architecture (MVP)

### High-level components
- **Edge Gateway (Worker)**: routes requests, verifies JWT, applies rate limits, invokes “functions”.
- **Postgres (Neon)**: primary data store, RLS policy engine, auth/session storage.

### Request flow
1) Client calls Edge Gateway with `Authorization: Bearer <JWT>` (or anon key).
2) Gateway verifies token + derives claims (userId/orgId/role).
3) Gateway opens a DB transaction and sets per-request claims (GUC) for RLS:
   - `set_config('request.jwt.claims', '<json>', true)`
4) DB enforces RLS policies.
5) Response returned.

---

## 3) Security Model (Core of “Supabase-like”)

### Roles / Keys
- **Anon**: public, extremely limited access (usually read-only or no access).
- **Authenticated**: user JWTs, access controlled via RLS.
- **Service role**: server-only; bypasses RLS for admin tasks (never shipped to clients).

### RLS conventions
Create helper SQL functions:
- `auth.uid()` → current user id from claims
- `auth.role()` → role string
- `auth.org_id()` → optional org/tenant id

Policy style:
- Enable RLS on all app tables.
- Prefer *deny by default* policies; add explicit allow rules.

---

## 3.1) Minimal RLS SQL Pattern (Reference)

Helper functions (claims stored by the gateway with `set_config`):

```sql
create schema if not exists auth;

create or replace function auth.jwt() returns jsonb
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(auth.jwt()->>'sub', '')::uuid;
$$;
```

Example table policy:

```sql
alter table public.todos enable row level security;
create policy "todos_owner_read" on public.todos
for select using (user_id = auth.uid());
```

---

## 4) MVP Data Model (Minimal Tables)

### Platform-level (optional in MVP)
- `platform_users` (admins of the platform)
- `projects` (one per app/backend instance)
- `project_api_keys` (anon/service keys, rotated)

### App-level (must exist)
- `auth_users` (end-users)
- `auth_sessions` (refresh tokens; rotation)
- `app_*` tables for the generated app’s entities

MVP can start **single-project** (one project, one set of keys) and later generalize.

---

## 5) Milestones (Ordered for Maximum Momentum)

### M0 — Repo + Local DX (1–2 sessions)
Deliverables:
- New `apps/edge` Worker app scaffold
- New `packages/db` package (schema + migrations)
- Env var conventions + `.env.example`
Done when:
- `npm -C wiraflow run typecheck` passes
- A “hello” Worker route responds locally

### M1 — Auth + JWT + Sessions (2–4 sessions)
Deliverables:
- Endpoints: `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- Password hashing compatible with edge runtime (WebCrypto PBKDF2 is acceptable for MVP)
- JWT signing + verification (key rotation plan documented)
Done when:
- A user can sign up, log in, refresh, and hit a protected endpoint

### M2 — RLS + Example Entity CRUD (2–4 sessions)
Deliverables:
- RLS helper functions (`auth.uid()` etc)
- One sample table (e.g. `todos`) with full RLS
- CRUD endpoints under `/rest/*` or `/db/*`
Done when:
- User A cannot read/write User B rows (verified by tests)

### M3 — “Edge Functions” Developer Experience (2–4 sessions)
Deliverables:
- Convention-based function registry: `apps/edge/src/functions/<name>.ts`
- Route: `POST /functions/:name` to invoke a function with auth context
- Function context includes `{ user, role, db }`
Done when:
- Adding a new function file requires no routing changes

### M4 — Storage (Signed URLs) (optional, 4–8 sessions)
Choose one:
- **Backblaze B2** free tier (S3-compatible) or
- Cloudflare R2 (may require billing details), or
- Temporary MVP fallback: store small blobs in Postgres (`bytea`) with strict limits
Deliverables:
- `storage_buckets`, `storage_objects` metadata tables + RLS
- Signed upload + download endpoints
Done when:
- Authenticated user can upload and fetch an object they own

### M5 — Realtime (optional, 6–12 sessions)
Phase approach:
1) MVP realtime: app-level “events” table + long-polling
2) Upgrade: LISTEN/NOTIFY bridge → WebSockets
3) Future: logical replication/WAL streaming
Done when:
- Clients can subscribe to changes for a table/topic with auth gating

### M6 — Multi-project + Provisioning (optional, 10–20 sessions)
Deliverables:
- Project creation (single Neon project + schema-per-project at first)
- Per-project API keys
- Basic dashboard endpoints for keys + logs
Done when:
- Two projects are isolated and cannot access each other’s data

---

## 6) Testing Strategy (Keep It Simple)
- Unit tests for JWT + password hashing
- Integration tests against a local Postgres (Docker) for RLS behavior
- Minimal contract tests for edge function invocation

---

## 7) Deployment Strategy (Student-friendly)
- Deploy Worker via `wrangler` (manual at first)
- Neon: set connection string as Worker secret
- Migrations: run from local machine (or CI later)

---

## 8) “Autonomous Build” Operating System

This plan is executed by:
- `BACKEND_BACKLOG.md` (what to do next)
- `BACKEND_WORK_PROCESS.md` (how to pick + ship tasks)
- `BACKEND_WORK_LOG.md` (what changed and why)

Keep the backlog short; always choose the smallest next step that unblocks the next milestone.
