import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    ssr: {
    external: ["@babel/preset-typescript"],
        noExternal: ["@babel/preset-typescript"]
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist", "public"),
    emptyOutDir: true,
    rollupOptions: {
      external: ["@babel/preset-typescript", "lightningcss"]
    }
  },
  optimizeDeps: {
  exclude: ['@babel/preset-typescript', 'lightningcss']
  }
});
