# WIR-003 Shell Scaffold Checkpoint

Target source artifact: `/Users/ashutoshrao/.openclaw/workspaces/platform-builder-studio/specs/platform-shell-architecture.md`  
Task: `WIR-003`  
Checkpoint: `mission-control implementation scaffold`  
Captured: `2026-04-03`

## What Changed
The writable mission-control app now mirrors the `WIR-003` route/module plan with a real App Router shell route group and a richer projection bundle.

Current implementation checkpoint:
- `app/(workspace)/apps/[appId]/layout.tsx` loads `loadShellBundle`
- `components/shell/ShellFrame.tsx` hosts the persistent left rail, center surface, inspector, and debug rail
- `lib/projections/shell/build-shell-projection-bundle.ts` now emits non-empty `pageViews`, `resourceViews`, and `flowViews`
- `components/shell/CenterSurface.tsx` and `components/shell/RightInspector.tsx` now inspect route/resource/flow placeholders instead of only empty states

## Why This Matters
This moves `WIR-003` from "frame exists" to "frame has meaningful shell-owned projections."
The shell still fails closed on missing canonical graph outputs, but it now exposes concrete route contracts, backend projection placeholders, and debug flow placeholders that can be swapped to real loaders later without rewriting the shell frame.

## Remaining Constraint
The OpenClaw source workspace remains read-only from this sandbox, so the source-of-truth spec header/status mismatch and queue-state updates still need to be applied upstream when write access is available.
