import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  worker: {
    format: "es", // Explicitly enforce 'es' for workers
  },
  // If you have rollupOptions.output.format = 'iife' for the main bundle, keep it—workers are handled separately
  plugins: [
    vue(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: "konduit-app",
        short_name: "konduit-app",
        description: "A Cardano to Bitcoin Lightning Network Pipe",
        theme_color: "#922256",
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: false,
        navigateFallback: "index.html",
        suppressWarnings: false,
        type: "module",
      },
    }),
  ],
});
