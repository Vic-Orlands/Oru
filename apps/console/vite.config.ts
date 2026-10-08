import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Every var, not just VITE_ ones: the dev hosts below never reach the
  // browser bundle.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    // Fixed port so Better Auth can trust one stable console origin while the
    // main app keeps port 3000.
    server: {
      port: 3001,
      strictPort: true,
      // Extra hosts allowed to reach the dev server (a proxy, another
      // device), comma-separated in DEV_ALLOWED_ORIGINS.
      allowedHosts: (env.DEV_ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((host) => host.trim())
        .filter(Boolean),
    },
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
