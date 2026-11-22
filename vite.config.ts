import { defineConfig } from "vitest/config";
import strings from "./src/content/strings.json";

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
  },
  plugins: [
    {
      // The page title comes from strings.json too, so the name lives in one place (D-004).
      name: "title-from-strings",
      transformIndexHtml: (html) => html.replace("%TITLE%", strings.ui.title),
    },
  ],
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
