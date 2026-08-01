import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["frontend/src/**/*.test.ts", "backend/src/**/*.test.ts", "shared/src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["frontend/src/**", "backend/src/**", "shared/src/**"],
    },
  },
});
