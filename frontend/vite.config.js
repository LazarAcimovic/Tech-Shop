import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/create-checkout-session": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/my-webhook": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, "/uploads"), //preusmerava sve zahteve na 5000
      },
    },
  },
});
