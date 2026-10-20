import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Em desenvolvimento, encaminha /api para o server.js (npm run server)
    proxy: { "/api": "http://localhost:3001" },
  },
});
