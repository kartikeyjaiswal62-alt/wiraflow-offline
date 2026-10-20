import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@wiraflow/contracts": resolve(__dirname, "../contracts/src/index.ts"),
    },
  },
});
