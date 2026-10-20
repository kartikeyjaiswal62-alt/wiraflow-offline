# 🚀 Wiraflow: Technical & Product Documentation

> [!IMPORTANT]
> **Vision:** To democratize application development by enabling anyone to transform complex ideas into production-ready software using AI.

---

## 🏗️ 1. Architecture Overview

Wiraflow operates as a multi-stage **Intelligence Pipeline**. It does not simply "guess" code; it architecturally reasons through requirements to build structured systems.

### 1.1 The Multi-Agent Orchestration
*   **The UI Architect (Agent A):** Consumes natural language and outputs a **Design Specification Language (DSL)**. It focuses on UX best practices, accessibility, and visual hierarchy.
*   **The Database Architect (Agent B):** Scans the DSL for data-intensive widgets (Lists, Profiles, Forms) and generates a normalized PostgreSQL schema.
*   **The Logic Resolver (Agent C):** Identifies triggers and actions, wiring UI components to backend mutations and navigation routes.

---

## 🛠️ 2. Technical Implementation

### 2.1 The DSL (Design Specification Language)
We use a proprietary JSON-based DSL that acts as a universal bridge between the AI and the target platform.
*   **Decoupled:** The AI doesn't need to know Flutter or React syntax.
*   **Validated:** The DSL is strictly typed, preventing hallucinated properties from reaching the compiler.

### 2.2 The Flutter Compiler Engine
Located in `src/lib/flutter-codegen.ts`, this engine performs high-fidelity transformation:
- **Layout Mapping:** Flex/Web styles → Flutter Widgets.
- **Dynamic Data Binding:** Automatically injects `FutureBuilder` for tables with the `query_table` property.
- **Dependency Management:** Injects required packages (Supabase, Google Fonts, etc.) automatically.

---

## 🗄️ 3. Database & Backend Strategy

Wiraflow uses **Supabase** (Postgres) as its core engine.

### 3.1 Atomic Schema Deployment
To solve the "Chicken and Egg" problem with Foreign Keys, Wiraflow implements **Atomic Transactions**:
1.  Analyzes table dependencies.
2.  Orders migrations (Parents before Children).
3.  Executes the entire block inside a `BEGIN; ... COMMIT;` transaction.

### 3.2 Security (RLS)
Security is not an afterthought. Every generated table is automatically protected with **Row Level Security (RLS)** policies based on the `auth.uid()`.

---

## 🧪 4. Interactive Test Mode

Our Test Mode provides a **Virtual App Runtime** in the browser.
*   **State Simulation:** Uses a custom `RuntimeState` to manage authentication and user sessions.
*   **Navigation Guards:** Enforces login requirements before accessing protected dashboards.
*   **Live Data:** Fetches real data from your Supabase instance to verify the UI.

---

## 📦 5. Production & CI/CD Flow

Wiraflow is built for **Production**, not just demos.

1.  **Code Export:** Full Flutter source is pushed to GitHub.
2.  **Automated Builds:** GitHub Actions are triggered on every push.
3.  **Artifact Generation:** Free APKs are compiled and made available for download.

---

## 📜 6. Roadmap & Future Scope

### Phase 1: The Core (Current)
- [x] AI-to-DSL UI Engine
- [x] Supabase Integration
- [x] GitHub CI/CD Pipeline

### Phase 2: The Ecosystem
- [ ] **Figma Integration:** Import real Figma designs into the Wiraflow engine.
- [ ] **AI-Generated Unit Tests:** Automatic testing of generated business logic.

### Phase 3: The Factory
- [ ] **One-Click App Store Submission:** Automated distribution to iOS and Android stores.

---

## 🛡️ 7. Security & Compliance
- **Data Privacy:** Wiraflow never stores your API keys; they are passed securely to the LLM and the build environment.
- **Open Code:** You own 100% of the generated source code. No vendor lock-in.

---

**Built with ❤️ by Ashutosh Rao & The Wiraflow Team**
