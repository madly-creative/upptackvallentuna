import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        evenemang: resolve(__dirname, "evenemang.html"),
        om: resolve(__dirname, "om.html"),
        integritet: resolve(__dirname, "integritet.html"),
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
