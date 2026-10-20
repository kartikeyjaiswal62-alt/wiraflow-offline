# Wiraflow + Antigravity Build Pack

This folder helps you use existing Wiraflow research files inside Google Antigravity with minimal friction.

## Source Research Files Used

- `/Users/ashutoshrao/Desktop/App Developement Platform/PLATFORM_BUILDER_BLUEPRINT.md`
- `/Users/ashutoshrao/Desktop/App Developement Platform/docs/openclaw-handoff/WIR-003-platform-shell-architecture-v0.4.md`
- `/Users/ashutoshrao/Desktop/App Developement Platform/docs/openclaw-handoff/WIR-007-wiring-and-action-flow-v0.2.md`
- `/Users/ashutoshrao/Desktop/App Developement Platform/docs/openclaw-handoff/WIR-003-shell-scaffold-checkpoint-2026-04-03.md`

## Fast Workflow

1. Build a merged context pack:
   - `bash /Users/ashutoshrao/Desktop/App Developement Platform/scripts/build_antigravity_context.sh`
2. In Antigravity, upload:
   - `/Users/ashutoshrao/Desktop/App Developement Platform/docs/antigravity/WIRAFLOW_CONTEXT_PACK.md`
3. Paste:
   - `/Users/ashutoshrao/Desktop/App Developement Platform/docs/antigravity/ANTIGRAVITY_MASTER_PROMPT.md`
4. Let Antigravity generate tasks and start with `Sprint 0` and `Sprint 1`.

## Build Order To Follow In Antigravity

- `S0`: Canonical contracts and parser boundaries
- `S1`: Designer markdown parser -> `AppIntentSpec`, `UISemanticGraph`
- `S2`: Backend inference -> `BackendIntentGraph`, `SupabaseSchemaPlan`
- `S3`: Wiring planner -> `WiringActionFlowPlan`
- `S4`: Mission control UI + preview and debug traces
- `S5`: Validation, regression suite, and release hardening

## Rule

Do not treat FlutterFlow Designer prompt text as source of truth.
Use canonical internal artifacts as the system of record.
