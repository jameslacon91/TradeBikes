/**
 * TradeBikes deployment override - adjusts the server configuration for production
 * Last updated: 2025-05-19T11:56:35.972Z
 */

import express, { type Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

/**
 * This overrides the serveStatic function to point to the correct build directory
 * in production - used only by deploy.ts.
 */
export function deployServeStatic(app: Express) {
  // Try multiple possible build locations
  const possibleBuildLocations = [
    path.resolve(import.meta.dirname, "..", "build"),
    path.resolve(import.meta.dirname, "..", "client", "dist"),
    path.resolve(import.meta.dirname, "..", "client", "build"),
    path.resolve(import.meta.dirname, "..", "dist")
  ];
  
  // Find the first build directory that exists
  let distPath = null;
  for (const location of possibleBuildLocations) {
    if (fs.existsSync(location)) {
      console.log(`✅ Found build directory at: ${location}`);
      distPath = location;
      break;
    }
  }
  
  if (!distPath) {
    // Create a fallback build directory with a minimal index.html if no build folder is found
    distPath = path.resolve(import.meta.dirname, "..", "build");
    console.warn(`⚠️ No build directory found, creating fallback at: ${distPath}`);
    
    try {
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
      }
      
      // Create a minimal index.html file
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradeBikes - Real‑Time Wholesale Motorcycle Trading</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #1a202c;
      color: white;
    }
    .container {
      text-align: center;
      padding: 20px;
      max-width: 600px;
      border-radius: 8px;
      background-color: #2d3748;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      color: #3182ce;
    }
    button {
      padding: 10px 20px;
      background-color: #3182ce;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 20px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>TradeBikes</h1>
    <p>We're experiencing technical difficulties</p>
    <p>Our team has been notified and is working to fix this issue.</p>
    <button onclick="window.location.reload()">Refresh Page</button>
  </div>
</body>
</html>`;
      
      fs.writeFileSync(path.join(distPath, "index.html"), indexHtml);
    } catch (error) {
      console.error("Failed to create fallback directory:", error);
      throw new Error("Could not find or create a build directory");
    }
  }
  
  // Serve static files from the build directory
  app.use(express.static(distPath));
  
  // When requesting Google verification file, serve it directly
  app.get("/google*.html", (req: Request, res: Response, next: NextFunction) => {
    const verificationFile = path.join(distPath, req.path);
    if (fs.existsSync(verificationFile)) {
      res.sendFile(verificationFile);
    } else {
      next();
    }
  });
  
  // Fallback to index.html for all other routes (SPA routing)
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}