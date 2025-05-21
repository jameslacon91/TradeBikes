import express, { Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES modules: get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This function is exported and used by the main server
export function serveStatic(app: Express) {
  // Check for build folder first
  let staticPath = path.resolve(__dirname, "..", "build");
  
  // If build doesn't exist, try dist/public
  if (!fs.existsSync(staticPath)) {
    staticPath = path.resolve(__dirname, "..", "dist", "public");
    
    // If dist/public doesn't exist either, use a relative path to build
    if (!fs.existsSync(staticPath)) {
      staticPath = path.resolve("build");
      
      // If none of these paths exist, warn but don't fail
      if (!fs.existsSync(staticPath)) {
        console.warn(`⚠️ Warning: Could not find static files at any expected location`);
        return;
      }
    }
  }
  
  console.log(`🌟 Serving static files from ${staticPath}`);
  
  // Serve static files
  app.use(express.static(staticPath));
  
  // Serve index.html for client-side routing
  app.get("*", (_, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}
