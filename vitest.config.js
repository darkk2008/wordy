import { defineConfig } from "vitest/config";

// Tests only: use React's automatic JSX runtime (no `import React` needed in every file).
export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  esbuild: { jsx: "automatic" },
});
