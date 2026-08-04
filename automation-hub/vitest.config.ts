import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  css: false,
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
