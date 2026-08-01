import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors frontend/tsconfig.json's "@/*" -> "./src/*" path. Vite/Vitest
      // don't read tsconfig "paths" on their own, so this has to be kept in
      // sync manually.
      "@": fileURLToPath(new URL("./frontend/src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: [
      "frontend/src/**/*.test.{ts,tsx}",
      "backend/src/**/*.test.ts",
      "shared/src/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: ["frontend/src/**", "backend/src/**", "shared/src/**"],
    },
  },
});
