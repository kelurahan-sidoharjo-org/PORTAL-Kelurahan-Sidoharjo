import { defineConfig } from "vitest/config";

export default defineConfig({
  // Teaches Vite the `@/*` → `./src/*` alias from tsconfig.json. Native since
  // Vite 8; before that it silently did nothing and `vite-tsconfig-paths` was
  // required instead. Removing it fails only the tests that use `@/`, so the
  // breakage looks partial rather than obvious — see CLAUDE.md.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
