import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "url";
import { dirname, join } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Usar proxy apenas em desenvolvimento local
  const isDevelopment = mode === 'development' && !process.env.RAILWAY_ENVIRONMENT;
  
  return {
    root: '.',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      allowedHosts: ["all", "infobva.up.railway.app", "ctifrontend-production.up.railway.app", "ctibva.up.railway.app", "cursotecnicoinfobva-frontend-production.up.railway.app", "cursotecnicobva.up.railway.app", "cursotecnicoinfobva.up.railway.app"],
      host: "0.0.0.0",
      port: 8080,
      // Proxy APENAS em desenvolvimento local (não no Railway)
      ...(isDevelopment && {
        proxy: {
          '/api': {
            target: process.env.VITE_API_URL || 'http://localhost:4002',
            changeOrigin: true,
            secure: false,
          },
        },
      }),
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
  };
});
