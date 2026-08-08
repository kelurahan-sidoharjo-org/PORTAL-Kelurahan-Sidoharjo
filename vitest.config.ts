import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mengajarkan alias `@/*` → `./src/*` dari tsconfig.json ke Vite. Native
  // sejak Vite 8; sebelum itu diam-diam tidak berbuat apa-apa dan
  // `vite-tsconfig-paths` dibutuhkan sebagai gantinya. Menghapus ini cuma
  // menggagalkan tes yang pakai `@/`, jadi kerusakannya terlihat sebagian,
  // bukan jelas — lihat CLAUDE.md.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
