// vite.config.ts

import path from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendPort = env.VITE_BACKEND_PORT || env.PORT || "4000";
  const backendHost = env.VITE_BACKEND_HOST || "localhost";
  const backendProtocol = env.VITE_BACKEND_PROTOCOL || "http";
  const backendTarget = `${backendProtocol}://${backendHost}:${backendPort}`;

  return defineConfig({
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
    ],
    server: {
      host: "0.0.0.0",
      proxy: {
        "/api": { target: backendTarget, changeOrigin: true },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  });
};
