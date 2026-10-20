# Wiraflow Backend — Work Process (Autonomous)

This file defines how Codex should build the **Supabase‑like backend** autonomously, without runaway refactors or big scope jumps.

## Goals
- Ship a **Supabase‑lite** backend: Auth + RLS + Edge Functions first.
- Keep everything **free-tier friendly** (Neon + Workers).
- Keep changes small, testable, and reversible.

## Daily Loop
1) **Pick the next task**
   - Take the highest priority unchecked item from `BACKEND_BACKLOG.md`.
   - If none exist, derive 1 task that unblocks the next milestone in `docs/backend/IMPLEMENTATION_PLAN.md`.
2) **Implement**
   - Target ≤60 minutes, ≤5 files.
3) **Validate**
   - Run the smallest relevant checks (typecheck/tests for the touched package/app).
4) **Log**
   - Append a short entry to `BACKEND_WORK_LOG.md`:
     - what changed
     - files touched
     - how to verify
     - what’s next

## Guardrails
- No large refactors “for cleanliness”.
- No new paid services.
- No secrets committed (keep `.env.example` only).
- Prefer Postgres-enforced security (RLS) over app-only checks.

## Definition Of Done (for a task)
- Backlog item is checked off (or updated).
- Validation step run (even if limited) and results noted in log.
- `BACKEND_WORK_LOG.md` updated with files touched.

