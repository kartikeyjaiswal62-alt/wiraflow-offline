# Wiraflow — Backlog

Check items as they are completed. Keep this list short and actionable.

## P0
- [x] Agent Studio: add diff/preview + Apply/Reject + Undo for last change
- [x] Agent Studio: patch diff viewer (per-widget/property paths)
- [x] Agent Studio: multi-widget selection (Shift-click) + selection-scope batch edit
- [x] Agent Studio: selection by tag/role + batch edit (by semanticRole/type)
- [x] Private testing: add a Settings page hint for enabling Basic Auth env vars
- [x] Preview: fix hydration mismatch (DebugRail collapsed/expanded SSR)
- [x] Preview: tighten iPhone 16 content inset + refine Dynamic Island styling

## P1
- [x] Agent Studio: “Prompt Lab” with per-project system prompt addenda (generator + editor)
- [x] Agent Studio: tool-style commands (/polish, /typography, /charts, /light-mode, /accessibility)
- [x] Design generator: enforce chart inclusion rules for dashboards (bar/line/pie)
- [x] Renderer: expand widget coverage (ListView, Tabs, AppBar, BottomNav, Badges)

## P2
- [x] Export: generate Dart skeleton + widgets from spec
- [x] Navigation: multi-page routing + link actions in wiring plan

## Next (New)

## P0
- [x] Agent Studio: safer patch application (schema validate + forbid deleting required widget keys)
  - Acceptance: invalid patches are blocked with a clear error; app never ends up with orphan widgets or missing `key/type/parentKey`.
- [x] Preview: toolbar redesign + pan/zoom polish (spacebar pan, cursor-follow, no clipping)
  - Acceptance: spacebar-drag pans smoothly across the whole canvas; zoom keeps devices centered and never clips content.

## P1
- [x] Export: downloadable ZIP (Flutter project folder) instead of JSON bundle
  - Acceptance: user clicks Export and receives a `.zip` containing `pubspec.yaml`, `lib/main.dart`, `lib/pages/*`.
- [ ] Design generator: broaden widget coverage in prompt (Tabs/AppBar/BottomNav/ListView/Badges) + minimal images default
  - Acceptance: regenerated specs consistently include these widgets where relevant and avoid images unless explicitly requested.
- [ ] Backend readiness: Supabase connection hardening (no service key in client store, clear env var + auth setup)
  - Acceptance: service role key is never stored client-side; settings UI explains safe setup; build passes without secrets.
