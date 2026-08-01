import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Resolve the shared workspace package straight to source so tests
      // don't require a build step first.
      shared: fileURLToPath(new URL("./shared/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["frontend/src/**/*.test.ts", "backend/src/**/*.test.ts", "shared/src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["frontend/src/**", "backend/src/**", "shared/src/**"],
    },
  },
});
