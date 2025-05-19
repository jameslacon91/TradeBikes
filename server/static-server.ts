import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Serves static files from the build directory in production
 * This matches the exact implementation you requested
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "build");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client using 'npm run build'`,
    );
  }

  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}