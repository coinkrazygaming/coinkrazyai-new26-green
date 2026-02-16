import { defineConfig, Plugin } from "vite";
import path from "path";
import fs from "fs";

// Plugin to copy schema.sql
function copySchemaPlugin(): Plugin {
  return {
    name: "copy-schema",
    apply: "build",
    writeBundle() {
      const schemaSource = path.resolve(__dirname, "server/db/schema.sql");
      const schemaDest = path.resolve(__dirname, "dist/server/schema.sql");
      fs.copyFileSync(schemaSource, schemaDest);
      console.log("✓ Copied schema.sql to dist/server/");
    },
  };
}

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build.ts"),
      name: "server",
      fileName: "production",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        // External dependencies that should not be bundled
        "express",
        "cors",
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: true,
  },
  plugins: [copySchemaPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
