# Platform Shell Architecture Handoff

Target source artifact: `/Users/ashutoshrao/.openclaw/workspaces/platform-builder-studio/specs/platform-shell-architecture.md`  
Task: `WIR-003`  
Mirrored checkpoint: `draft v0.4`  
Captured: `2026-04-03`

## Why This Mirror Exists
This workspace can read the OpenClaw source-of-truth spec but cannot patch it directly from the current sandbox.
This handoff mirrors the current `WIR-003` checkpoint so the mission-control app and local implementation work do not keep advertising the stale `v0.1` draft.

## Source State
- `docs/TASK_QUEUE.md` records `WIR-003` at `draft v0.4`
- the source spec body already includes the concrete route/module implementation plan and scaffold contract that justify `v0.4`
- the source spec header still says `Status: draft v0.3`, so there is a source-header mismatch to correct later inside the OpenClaw workspace

## Checkpoint Summary
`WIR-003` now defines the shell as a projection layer over canonical Wiraflow artifacts.
It establishes:
- a persistent desktop-first shell with left navigation, center workspace, right inspector, and bottom debug rail
- a normalized `ShellSelection` model shared across preview, inspector, backend, and debug surfaces
- projection adapters that reshape canonical artifacts into shell view models without inventing new domain semantics
- a normalized trace contract that preserves `flowKey`, `stepKey`, `runtimeBoundary`, and artifact lineage
- explicit ownership boundaries so the shell owns layout, selection, and trace presentation, while semantics stay upstream in `WIR-004` through `WIR-007`

## Implementation-Ready Route And Module Plan
The source spec now includes a concrete App Router shape:

```txt
/app
  /(workspace)
    /apps/[appId]
      /layout.tsx
      /page.tsx
      /preview/[[...routePath]]/page.tsx
      /intent/page.tsx
      /backend/page.tsx
      /debug/page.tsx
      /artifacts/page.tsx
```

Recommended module seams:
- `ShellFrame` for the persistent frame
- projection adapters under `lib/projections/shell/`
- `useShellState` for `ShellMode` and `ShellSelection`
- `PreviewBridge` for route-aware preview mounting
- inspector cards that consume projected view models plus `artifactLinks`
- `DebugRail` and trace normalizers for execution evidence

## Delivery Sequence
1. Build the projection adapter layer and fail-fast validation path.
2. Implement the persistent App Router shell frame.
3. Wire shared selection state across left rail, center surface, inspector, and debug rail.
4. Mount the debug rail with normalized trace envelopes.
5. Add the preview bridge so route-aware preview clicks feed inspector/debug focus.
6. Add live trace streaming later without changing shell ownership boundaries.

## Current Constraint
The OpenClaw source-of-truth file still needs an in-place header/status sync from `v0.3` to `v0.4`.
That correction is blocked here only by workspace write boundaries, not by missing architecture.
