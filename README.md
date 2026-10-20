# WiraFlow

**Turn an app idea into an editable Flutter prototype on your computer.** Describe a screen, review its visual design, export Flutter source, and—when the local tools are installed—run Flutter checks without an AI API key.

WiraFlow is a working prototype, not yet a production app factory. Full local model generation can take minutes on a CPU-only computer. See the [beginner-friendly project brief](docs/WIRAFLOW_PROJECT_BRIEF.md) for current capabilities, competitor context, limitations, screenshots, and a staged roadmap.

## What you can do today

- Create an **instant Quick Preview** from a local template without model inference.
- Use **Full Blueprint** with Ollama to generate a richer, compact design. A sketch can be passed to a compatible local vision model.
- Review pages on a device-style canvas; change themes and colors; ask the AI edit panel for refinements.
- Generate and download a Flutter project ZIP.
- Use **Analyze, repair & preview** to run Flutter package resolution in offline mode, `flutter analyze`, `flutter test`, and `flutter build web`. If a check fails, local Gemma can attempt up to two Dart repair passes. A successful build opens a browser preview.
- Draft SQLite schema plans locally. Supabase and cloud AI are optional paths, not requirements for the default local design flow.

The build panel’s generated widget test currently checks that the app launches. Passing it does not prove every interaction or business rule is correct. Review generated code before using it in a real product.

## Run WiraFlow

### Requirements

- Node.js **20.9 or newer** and npm.
- For local AI: install [Ollama](https://ollama.com/download) and download a compatible model. The default is `gemma4:e2b-it-q4_K_M`; Ollama lists this quantized tag at about 4.6 GB on disk. Larger models need more storage and memory.
- For Flutter export verification and embedded build preview: install the Flutter SDK, enable web support, and ensure required packages are available in Flutter’s local package cache. WiraFlow’s build check uses `flutter pub get --offline` and will not download missing packages for you.

### Start

From this repository root:

```bash
npm install
ollama pull gemma4:e2b-it-q4_K_M
npm run dev --workspace=apps/web
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Quick Preview works without Ollama; Full Blueprint and local AI editing require a running Ollama service and the selected model. In **Settings**, select **Local Ollama** and use **Test Local Connection**.

If you only want the web prototype, start the Next.js app with Node/npm; Ollama and Flutter are optional until you use the AI or local build features.

## Quick demo

1. Open **New Project**.
2. Enter: `A student habit tracker with today's checklist and a streak counter`.
3. Choose **Quick Preview** and click **Create instant preview**. This path uses a deterministic local template and should return quickly; it is not an AI generation benchmark.
4. Return and try **Full Blueprint** to use the selected Ollama model. Expect a longer wait on CPU-only hardware.
5. In the code workspace, download the Flutter ZIP or use **Analyze, repair & preview** after configuring Flutter and its offline package cache.

## Local-first, with precise limits

In Local Ollama mode, WiraFlow sends model requests to an Ollama endpoint restricted to `localhost`. This avoids an AI-provider API key and per-request AI charges for those requests. Your computer, electricity, disk, initial downloads, and setup still have costs. Full Blueprint is not instant on modest CPUs.

The current builder saves project state in browser `localStorage`; it does not use SQLite as its primary project store. SQLite schema generation creates a plan for an app backend. First-time installation, optional cloud providers, Supabase/GitHub workflows, and remote fonts may involve network access.

## Technology

- **Builder:** Next.js 16, React 19, TypeScript, CSS Modules.
- **Local model runtime:** Ollama; Gemma is the default model family.
- **Generated app:** Flutter / Dart source.
- **Optional backend paths:** SQLite schema planning and Supabase integration.
- **Project persistence:** browser `localStorage` plus `sessionStorage` for design handoff.

The current implementation has task-specific model workflows for design generation, design edits, schema planning, and build repair. A coordinated team of five autonomous agents is a future product direction, not a claim about today’s orchestration.

## Check the code

From the repository root:

```bash
npm run typecheck
npm run test
npm run build
```

The monorepo currently includes tests in the shared packages; the web workspace does not define its own test script. Flutter project checks are run from WiraFlow’s build panel on a machine with Flutter configured.

## Screenshots and product status

The project brief includes a genuine screenshot of the earlier full-model generation wait. It is clearly labeled as an in-progress capture, not as proof of a completed build. Capture successful output screens only after the current golden path completes.

See:

- [Project brief and competitive analysis](docs/WIRAFLOW_PROJECT_BRIEF.md)
- [Current backlog](BACKLOG.md)
- [Detailed implementation documentation](DOCUMENTATION.md) — some sections describe earlier plans and should be checked against the current source code.
