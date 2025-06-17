import { defineConfig } from "vite"
import { resolve } from "path"
import checker from "vite-plugin-checker"

export default defineConfig({
  plugins: [
    checker({
      typescript: true,
    }),
  ],
  build: {
    sourcemap: true,
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, "src/popup/popup.ts"),
      output: {
        entryFileNames: "popup.js",
        dir: "dist",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
    target: "es2020",
    minify: false,
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
})
