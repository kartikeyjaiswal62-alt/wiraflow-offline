import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], globals: true },
  resolve: { alias: {
    "@wiraflow/contracts": resolve(__dirname, "../contracts/src/index.ts"),
    "@wiraflow/artifact-parser": resolve(__dirname, "../artifact-parser/src/index.ts"),
    "@wiraflow/backend-planner": resolve(__dirname, "../backend-planner/src/index.ts"),
    "@wiraflow/supabase-generator": resolve(__dirname, "../supabase-generator/src/index.ts"),
  }},
});
