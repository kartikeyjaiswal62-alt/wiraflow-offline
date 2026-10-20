# Wiraflow — Work Process (Autonomous)

This file defines how Codex should keep improving Wiraflow end-to-end (UI generation quality + preview/workspace UX) while you’re away, without breaking the app.

## Goals
- Make AI UI generation consistently high-fidelity (Flutter-like layouts, rich widgets, charts).
- Make preview/workspace feel like a real design tool (clean controls, pan/zoom, good device mock, hover/inspect).
- Keep “private testing” safe (no leaked API keys, basic access control for shared URLs).

## Daily Loop
1) **Reproduce & screenshot**
   - Open `/project?id=<latest>` and `/design-preview/<sessionId>` and note regressions.
   - Verify on both IDE themes (dark/light).
2) **Fix one UX issue at a time**
   - Keep patches small and reversible.
   - Prefer CSS/layout fixes before component rewrites.
3) **Validate**
   - Watch the dev server console for runtime errors.
   - Confirm the change in the in-app browser.
4) **Log**
   - Append a short entry to `WORK_LOG.md` (what changed, where, why).

## Continuous Autonomy (Next-Task Picker)
When a task is finished, immediately pick the next task without waiting for input:
1) Check `BACKLOG.md` for the highest priority unchecked item.
2) If `BACKLOG.md` is empty/outdated, derive the next task from:
   - Current user complaints (UI/preview/agent), then
   - Runtime warnings/errors in dev console, then
   - Missing “differentiators” (agentic IDE features, quality gates).
3) Choose a task that can be completed in ≤30–60 minutes and touches ≤5 files.
4) Execute → validate → log → repeat.

## Definition Of Done (for a task)
- The feature works in the UI (or API) and is reachable from the workspace.
- No new runtime errors in console.
- `WORK_LOG.md` has a new entry with files touched.

## Guardrails (to avoid runaway changes)
- No massive refactors “because it’s cleaner”.
- No dependency sprawl unless unavoidable.
- Keep a rollback path (small commits/patches; avoid broad renames).
- Prefer additive changes with feature flags/toggles.

## Engineering Rules
- Don’t introduce new external services unless requested.
- Don’t add heavy dependencies for visuals; prefer CSS/SVG.
- Keep API key handling server-side for any public/private share.
- Avoid “image generation” URLs; default to minimal images.

## Known Hotspots
- UI generator prompt + schema: `apps/web/src/app/api/generate-design/route.ts`
- Edit agent prompt: `apps/web/src/app/api/edit-design/route.ts`
- Workspace: `apps/web/src/app/project/page.tsx`
- Preview renderer: `apps/web/src/components/canvas/WidgetTree.tsx`
- All-pages canvas: `apps/web/src/components/canvas/PagesStrip.tsx`

## Priority Backlog
P0
- Stabilize selection/hover UX (no parent/root hover conflicts; show labels reliably).
- Improve “real iPhone” mock: bezel thickness, radii, island placement, safe areas.
- Add access control for tunnel “private testing”.

P1
- Improve chart DSL + rendering consistency (bar/line/pie + labels + colors).
- Expand supported Flutter widget mappings in renderer (common Material widgets).
- Improve “All Pages” canvas usability (panning feel, drag reorder stability).

P2
- Reduce hydration mismatch warnings (DebugRail SSR vs client state).
- Export-to-Dart + multi-page navigation wiring.

## Private Testing Checklist
- Ensure a password gate exists for any externally shared URL.
- Confirm no secrets are stored in client JS (localStorage only for user-provided keys).
- Add clear instructions for setting env vars locally.
