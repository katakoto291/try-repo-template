import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
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
