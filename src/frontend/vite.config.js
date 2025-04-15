import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";
import environment from "vite-plugin-environment";

export default defineConfig({
  root: "./",
  logLevel: "info",
  build: {
    // outDir: "../../dist/frontend",
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    rollupOptions: {
      // Fallback: externalize /src/index.ts if resolution still fails
      external: ["/src/index.ts"],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  resolve: {
    extensions: [".js", ".ts"],
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
    ],
    dedupe: ["@dfinity/agent"],
  },
});