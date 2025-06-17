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
      input: resolve(__dirname, "src/content/content.ts"),
      output: {
        entryFileNames: "content.js",
        dir: "dist",
        format: "iife",
        inlineDynamicImports: true,
        generatedCode: {
          constBindings: true,
        },
      },
      external: [],
    },
    target: "es2020",
    minify: false, // Disable minification to avoid encoding issues
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
})
