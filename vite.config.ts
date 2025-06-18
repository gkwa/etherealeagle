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
     input: {
       background: resolve(__dirname, "src/background/background.ts"),
       content: resolve(__dirname, "src/content/content.ts"),
       popup: resolve(__dirname, "src/popup/popup.ts"),
     },
     output: {
       entryFileNames: (chunkInfo) => {
         const facadeModuleId = chunkInfo.facadeModuleId
         if (facadeModuleId?.includes('background')) return 'background.js'
         if (facadeModuleId?.includes('content')) return 'content.js'
         if (facadeModuleId?.includes('popup')) return 'popup.js'
         return '[name].js'
       },
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
