import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "url";
import { dirname, join } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    allowedHosts: ["all", "ctibva.up.railway.app", "cursotecnicoinfobva-frontend-production.up.railway.app", "cursotecnicobva.up.railway.app", "cursotecnicoinfobva.up.railway.app"],
    host: "0.0.0.0",
    port: 8080,
  },
  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8080"),
  },
  plugins: [
    react(),
 ],
  resolve: {
    alias: {
      "@": join(dirname(fileURLToPath(import.meta.url)), "./src"),
    },
  },
});
