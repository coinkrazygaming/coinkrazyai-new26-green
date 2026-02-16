import path from "path";
import http from "http";
import { createServer } from "./index";
import { setupSocketIO } from "./socket";
import * as express from "express";

const app = createServer();
const server = http.createServer(app);
setupSocketIO(server);

const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Add middleware to explicitly handle non-API routes AFTER API routes
// This ensures /api/* routes go through Express routes registered in createServer()
app.use((req, res, next) => {
  // Let API and health routes be handled by Express routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return next();
  }

  // For everything else, try to serve static files
  express.static(distPath)(req, res, () => {
    // If static file not found, serve index.html for React Router
    res.sendFile(path.join(distPath, "index.html"));
  });
});

server.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
