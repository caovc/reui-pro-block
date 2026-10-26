import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["@radix-ui/react-focus-scope", "@radix-ui/react-dismissable-layer"],
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
