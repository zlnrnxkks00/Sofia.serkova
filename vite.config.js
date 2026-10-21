import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: ".vite-public",
  build: {
    outDir: "build",
    emptyOutDir: true,
    license: { fileName: "assets/THIRD-PARTY-LICENSES.md" },
  },
});
