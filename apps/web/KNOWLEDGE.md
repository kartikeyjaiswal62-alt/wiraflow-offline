# Graph Report - .  (2026-05-01)

## Corpus Check
- 66 files · ~58,862 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 282 nodes · 332 edges · 32 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]

## God Nodes (most connected - your core abstractions)
1. `renderWidget()` - 23 edges
2. `POST()` - 11 edges
3. `appendMessage()` - 8 edges
4. `POST()` - 7 edges
5. `textStyleToDart()` - 6 edges
6. `generateFlutterPageDart()` - 6 edges
7. `buildZipBlob()` - 6 edges
8. `getSupabaseClient()` - 6 edges
9. `handleApplyPatch()` - 5 edges
10. `useStore()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Sidebar()` --calls--> `useStore()`  [INFERRED]
  src/components/layout/Sidebar.tsx → src/lib/store.tsx
- `ProjectDatabaseConfig()` --calls--> `useStore()`  [INFERRED]
  src/components/canvas/ProjectDatabaseConfig.tsx → src/lib/store.tsx
- `useSupabaseMutation()` --calls--> `getSupabaseClient()`  [INFERRED]
  src/hooks/useSupabaseQuery.ts → src/lib/supabase/client.ts
- `generateFlutterProjectFiles()` --calls--> `generateFlutterPageDart()`  [INFERRED]
  src/lib/flutter-project-export.ts → src/lib/flutter-codegen.ts
- `handleTest()` --calls--> `testApiKey()`  [INFERRED]
  src/app/settings/page.tsx → src/lib/openai.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (27): borderToDart(), boxFitToDart(), buildWidgetTree(), childrenWithGaps(), colorPropToDart(), crossAxisAlignmentToDart(), dartStringLiteral(), edgeInsetsToDart() (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (11): contrastRatio(), findAncestorBg(), getLucideIconComp(), getLucideIconName(), getWidgetHoverLabel(), hoverLeave(), hoverMove(), parseHex() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.23
Nodes (14): appendMessage(), applyPatchWidgets(), clearPendingPatch(), copyToClipboard(), expandToolCommand(), handleApplyPatch(), handleRedo(), handleRejectPatch() (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (9): ProjectDatabaseConfig(), useActionFlow(), useSupabaseMutation(), useSupabaseQuery(), Sidebar(), useStore(), getDynamicSupabaseClient(), getStaticSupabaseClient() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (9): applyDesignThemeToSpec(), buildHexToKeyMap(), getThemeById(), isHexColor(), tokenizeColorRef(), generateDesignSpec(), handleGenerate(), applyTheme() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (8): canonicalizeWidget(), canonicalizeWidgetProperties(), canonicalWidgetType(), convertProperties(), normalizeWidgetProperties(), resolveColorToken(), testApiKey(), handleTest()

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (12): applyLayoutAlignment(), collectDescendantTextWidgetKeys(), extractMaterialIconName(), findPageForWidget(), findWidgetByKey(), isRemoveIconPrompt(), isTextAlignPrompt(), mergeProperties() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (13): AI Assistant Sidebar, AI Patch Preview System, Design Generation API, Design Specification, Flutter Code Generation, Agent Guidelines System, Project IDE Workspace, Widget Inspector (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (4): clamp(), fitAll(), onWheel(), run()

### Community 9 - "Community 9"
Cohesion: 0.4
Nodes (9): buildAgentPrompt(), findPageByKey(), findWidgetByKey(), mergeProperties(), mergeWidget(), POST(), replaceWidgetByKey(), safeJsonParse() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.52
Nodes (6): buildZipBlob(), concat(), crc32(), toDosDateTime(), u16(), u32()

### Community 12 - "Community 12"
Cohesion: 0.47
Nodes (3): goNext(), goPrev(), onKey()

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (2): executeActionFlow(), executeMutation()

### Community 14 - "Community 14"
Cohesion: 0.6
Nodes (3): dartIdentifierFromKey(), generateFlutterProjectFiles(), primaryColorSeed()

### Community 15 - "Community 15"
Cohesion: 0.6
Nodes (3): findPageByType(), getWidgetLabel(), resolveWidgetAction()

### Community 19 - "Community 19"
Cohesion: 0.83
Nodes (3): buildHref(), ensureGoogleFontsLoaded(), toGoogleFamily()

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (2): proxy(), unauthorized()

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (2): pickSwatches(), ThemePicker()

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (2): executeAdminSql(), getSupabaseAdmin()

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (2): Next.js Framework, Wiraflow Platform

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (2): Device Presets, Mobile Preview (IDE Canvas)

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): Palette Token Mapping

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): Supabase Backend Integration

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): Edit Design API

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): Schema Panel Page

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): Wiring Graph Page

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): Flutter Native Renderer Page

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): Execution Traces / Debug Console

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): Widget Data Interface

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): Frame Mode (Device/Fill)

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): Fit vs Custom Zoom

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): Hover Interaction State

## Knowledge Gaps
- **22 isolated node(s):** `Next.js Framework`, `Wiraflow Platform`, `Flutter Code Generation`, `Palette Token Mapping`, `Supabase Backend Integration` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 13`** (6 nodes): `action-executor.ts`, `data-fetcher.ts`, `executeActionFlow()`, `executeMutation()`, `executeUpload()`, `fetchReadBinding()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (3 nodes): `proxy()`, `proxy.ts`, `unauthorized()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (3 nodes): `ThemePicker.tsx`, `pickSwatches()`, `ThemePicker()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (3 nodes): `admin.ts`, `executeAdminSql()`, `getSupabaseAdmin()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `Next.js Framework`, `Wiraflow Platform`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `Device Presets`, `Mobile Preview (IDE Canvas)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `Palette Token Mapping`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `Supabase Backend Integration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `Edit Design API`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `Schema Panel Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `Wiring Graph Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `Flutter Native Renderer Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `Execution Traces / Debug Console`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `Widget Data Interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `Frame Mode (Device/Fill)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `Fit vs Custom Zoom`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `Hover Interaction State`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateDesignSpec()` connect `Community 4` to `Community 5`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `Next.js Framework`, `Wiraflow Platform`, `Flutter Code Generation` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._