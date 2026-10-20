# Wiraflow — Work Log

Append-only notes for autonomous progress.

## Template
- Date:
- Change:
- Files:
- Result:
- Next:

## 2026-04-20
- Change: Added process docs + basic auth for tunnel private testing; allowed dev origin for `*.trycloudflare.com` to avoid blocked HMR.
- Files: `WORK_PROCESS.md`, `apps/web/src/proxy.ts`, `apps/web/next.config.ts`
- Result: Quick tunnel works without dev-origin errors; optional auth gate via env vars.
- Next: Add a minimal “set password” note in UI and ensure keys aren’t exposed client-side.

## 2026-04-20
- Change: Added multi-widget agent edit API + upgraded Agent Studio panel (chat + page-scope edits + prompt guidelines).
- Files: `apps/web/src/app/api/agent-edit/route.ts`, `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `apps/web/src/components/canvas/AIAssistantSidebar.module.css`, `apps/web/src/app/project/page.tsx`, `apps/web/src/lib/types.ts`
- Result: Workspace AI Agent supports multi-turn chat, widget/page scope, and project-specific guidelines appended to requests.
- Next: Add diff/undo (preview appliedKeys + revert), and support safe add/delete widget ops for charts/navigation.

## 2026-04-20
- Change: Added Preview/Apply/Reject/Undo workflow for Agent Studio (dry-run patch from AI + client-side patch apply + undo stack).
- Files: `apps/web/src/app/api/agent-edit/route.ts`, `apps/web/src/app/api/edit-design/route.ts`, `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `apps/web/src/components/canvas/AIAssistantSidebar.module.css`
- Result: You can now preview patch keys before applying, reject without changing spec, and undo last apply (stored locally per project).
- Next: Add a real diff viewer (per widget property diff) + multi-widget batch selection.

## 2026-04-20
- Change: Added a real patch diff viewer in Agent Studio (per-widget changed property paths).
- Files: `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `apps/web/src/components/canvas/AIAssistantSidebar.module.css`, `BACKLOG.md`
- Result: Pending patch card now expands to show which widget fields/properties will change before Apply.
- Next: Multi-widget selection + batch edit, plus a richer diff (before/after value snippet).

## 2026-04-20
- Change: Added multi-widget selection (Shift-click) + Selection-scope batch edit in Agent Studio (allowedKeys guard).
- Files: `apps/web/src/app/project/page.tsx`, `apps/web/src/components/canvas/WidgetTree.tsx`, `apps/web/src/components/canvas/PagesStrip.tsx`, `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `apps/web/src/app/api/agent-edit/route.ts`, `BACKLOG.md`
- Result: You can Shift-click to select multiple widgets; Agent Studio “Selection” scope edits only those keys and previews/apply/undo works.
- Next: Add tag/role based selection and a richer diff with before/after snippets.

## 2026-04-20
- Change: Added Smart Select (by widget `type` + `semanticRole`, page/app scope) that sets multi-selection and feeds Selection-scope edits.
- Files: `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `apps/web/src/components/canvas/AIAssistantSidebar.module.css`, `apps/web/src/app/project/page.tsx`, `BACKLOG.md`
- Result: You can select matching widgets without clicking (Replace/Add/Clear), then run Selection-scope edits safely.
- Next: Private testing settings hint + hydration mismatch fix.

## 2026-04-20
- Change: Fixed DebugRail hydration mismatch by deferring responsive default expansion to client mount; checked off private-testing Settings hint.
- Files: `apps/web/src/components/debug/DebugRail.tsx`, `BACKLOG.md`
- Result: Preview no longer risks SSR/client mismatch for the console rail open/closed state.
- Next: Preview UX polish (device bezel realism, island positioning, scrollbar styling) + Prompt Lab addenda.

## 2026-04-20
- Change: Tightened device screen content inset and refined iPhone 16 Dynamic Island sizing + sheen for better realism and less awkward light-theme contrast.
- Files: `apps/web/src/components/canvas/WidgetTree.tsx`, `apps/web/src/components/canvas/WidgetTree.module.css`, `BACKLOG.md`
- Result: Less “thick border” feel between UI content and screen edge; island reads cleaner across themes.
- Next: Re-layout preview toolbar (less scattered), and add Prompt Lab addenda.

## 2026-04-20
- Change: Fixed build-time TypeScript type mismatch for pending Agent Studio patches (added `selection` to patch scope union).
- Files: `apps/web/src/components/canvas/AIAssistantSidebar.tsx`
- Result: `next build` succeeds again.
- Next: Prompt Lab addenda + tool commands, then chart enforcement in generator prompt.

## 2026-04-20
- Change: Added Prompt Lab (per-project generator + editor addenda) and wired generator addendum into Design Preview regeneration.
- Files: `apps/web/src/lib/types.ts`, `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `apps/web/src/app/design-preview/[sessionId]/page.tsx`, `BACKLOG.md`
- Result: Each project can store prompt addenda; edits use the Editor addendum automatically and regen uses the Generator addendum.
- Next: Add tool commands (/charts etc) and enforce chart inclusion in the generator system prompt.

## 2026-04-20
- Change: Added a “View/Hide” button on Agent patch review to temporarily preview the patch on the canvas (without applying), plus an exit banner while previewing.
- Files: `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `apps/web/src/components/canvas/AIAssistantSidebar.module.css`, `apps/web/src/app/project/page.tsx`
- Result: You can visually confirm widget/UI changes before clicking Apply.
- Next: Add tool commands (/charts, /typography, /accessibility) and chart enforcement in generator prompt.

## 2026-04-20
- Change: Made Agent undo/redo session-scoped (prevents undoing older agent edits) and added Undo/Redo buttons in the Agent Studio header.
- Files: `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `apps/web/src/components/canvas/AIAssistantSidebar.module.css`
- Result: Undo now only affects the most recent agent Apply in the current browser session; redo restores it.
- Next: Add tool commands (/charts, /typography, /accessibility) and chart enforcement in generator prompt.

## 2026-04-20
- Change: Added slash tool commands in Agent Studio (`/polish`, `/typography`, `/charts`, `/light-mode`, `/accessibility`) that expand into structured edit instructions; marked generator chart enforcement as complete (already in system prompt).
- Files: `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `BACKLOG.md`
- Result: You can type `/charts` etc to reliably steer edits without rewriting long prompts.
- Next: Expand renderer widget coverage (Tabs/AppBar/BottomNav/ListView/Badges).

## 2026-04-20
- Change: Upgraded Agent Studio chat UX to “pro coding agent” style: process panel (toggleable), per-message trace pills, expandable JSON details (copyable), and better message styling.
- Files: `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `apps/web/src/components/canvas/AIAssistantSidebar.module.css`
- Result: Users can see what scope/tool/model/preview mode was used per message, with a Hide option to keep the UI clean.
- Next: Expand renderer widget coverage (Tabs/AppBar/BottomNav/ListView/Badges).

## 2026-04-28
- Change: Expanded preview renderer widget coverage (ListView, AppBar, Tabs, BottomNav, Badge) and fixed Supabase hooks typing to be project-aware (optional `projectId`) without requiring global store fields.
- Files: `apps/web/src/components/canvas/WidgetTree.tsx`, `apps/web/src/hooks/useActionFlow.ts`, `apps/web/src/hooks/useSupabaseQuery.ts`, `BACKLOG.md`
- Result: `npm -w apps/web run build` passes; new widget types render instead of falling back to generic containers.
- Next: Export: generate Dart skeleton + widgets from spec.

## 2026-04-28
- Change: Added “Export Bundle” from Code tab (downloads `pubspec.yaml`, `lib/main.dart`, and `lib/pages/*.dart` as a single JSON file) + “Download Page” for the current Dart file.
- Files: `apps/web/src/lib/flutter-project-export.ts`, `apps/web/src/components/canvas/CodeViewer.tsx`, `BACKLOG.md`
- Result: `npm -w apps/web run build` passes; exported bundle includes routes and optional `fl_chart` dependency when needed.
- Next: Navigation: multi-page routing + link actions in wiring plan.

## 2026-04-28
- Change: Enabled real multi-page navigation in preview + export by preserving widget `action` from the DesignSpec and mapping `navigate` actions to page switches (preview) and `Navigator.pushNamed` (Dart codegen).
- Files: `apps/web/src/lib/types.ts`, `apps/web/src/lib/openai.ts`, `apps/web/src/app/project/page.tsx`, `apps/web/src/lib/flutter-codegen.ts`, `BACKLOG.md`
- Result: Clicking a widget action with `{ operation: \"navigate\", targetPageKey }` switches pages and emits debug events; exported Dart buttons/icon buttons navigate via routes.
- Next: If `BACKLOG.md` is empty, add new P0 tasks (preview toolbar polish, basic auth UI, agent patch safety).

## 2026-04-28
- Change: Hardened Agent Studio patch apply/preview with schema validation (blocks unsafe patches that would orphan widgets or clear required fields).
- Files: `apps/web/src/components/canvas/AIAssistantSidebar.tsx`, `BACKLOG.md`
- Result: Invalid agent patches are rejected with a clear “Blocked unsafe patch” message; `npm -w apps/web run build` passes.
- Next: Preview: toolbar redesign + pan/zoom polish (spacebar pan, cursor-follow, no clipping).

## 2026-04-28
- Change: Added spacebar pan + smooth cursor-follow panning for the preview canvas; reworked preview area to use a centered pan scene (prevents zoom clipping and keeps device centered by default).
- Files: `apps/web/src/components/canvas/WidgetTree.tsx`, `apps/web/src/components/canvas/WidgetTree.module.css`, `BACKLOG.md`
- Result: Hold Space + drag to pan freely; zoom resets keep the device centered and the preview no longer relies on nested scrollbars for navigation; `npm -w apps/web run build` passes.
- Next: Export: downloadable ZIP (Flutter project folder) instead of JSON bundle.

## 2026-04-28
- Change: Implemented client-side ZIP export (store-only) for Flutter project bundle; “Export Bundle” now downloads a real `.zip` without adding dependencies.
- Files: `apps/web/src/lib/zip.ts`, `apps/web/src/components/canvas/CodeViewer.tsx`, `BACKLOG.md`
- Result: Export produces a zip containing `pubspec.yaml`, `lib/main.dart`, and `lib/pages/*`; `npm -w apps/web run build` passes.
- Next: Design generator: broaden widget coverage in prompt + default to minimal images.
