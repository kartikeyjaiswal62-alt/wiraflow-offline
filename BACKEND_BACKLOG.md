# Wiraflow Backend — Backlog

Keep this short and actionable. Check items as they complete.

## P0 — MVP Backbone (Auth + RLS + Edge Functions)
- [ ] Scaffold `apps/edge` (Hono Worker) + local dev script
- [ ] Add `packages/db` with Drizzle schema + migrations
- [ ] Implement auth tables + JWT (signup/login/refresh/me)
- [ ] Add RLS helper functions (`auth.uid()` etc) + example table with policies
- [ ] Add edge function registry + `POST /functions/:name` dispatcher
- [ ] Add minimal rate limiting + request logging
- [ ] Add integration test for “user A cannot read user B rows”

## P1 — Developer Experience
- [ ] Add OpenAPI docs generation (routes + schemas)
- [ ] Add “keys” model (anon/service) + key rotation docs
- [ ] Add `wrangler` deploy docs + env/secrets guide

## P2 — Supabase-like Extras
- [ ] Storage metadata + signed URL flow (choose provider + free-tier plan)
- [ ] Realtime MVP (events table + long-polling) then WebSocket bridge
- [ ] Multi-project isolation (schema-per-project) + per-project keys

