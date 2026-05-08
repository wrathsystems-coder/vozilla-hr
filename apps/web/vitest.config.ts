import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    // Integration tests share the dev Postgres in docker-compose. Running
    // test files in parallel against the same tables produces flakes when
    // two suites truncate the same table at once. Single-fork mode runs
    // files sequentially (unit tests are fast enough that the cost is
    // negligible).
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "."),
    },
  },
  // Match Next.js' automatic JSX runtime so .tsx files (React Email
  // templates, future component tests) don't need an explicit React import.
  esbuild: {
    jsx: "automatic",
  },
});
