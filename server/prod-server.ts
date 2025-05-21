import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";

console.log("Starting TradeBikes Production Server");

// Create Express app
const app = express();

// Basic middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Setup API routes and start the server
(async () => {
  try {
    // Register API routes
    const server = await registerRoutes(app);
    
    // Look for static files in build directory (or alternative locations)
    const buildPaths = [
      path.resolve("build"),
      path.resolve("dist"),
      path.resolve("dist/public"),
      path.resolve("../build")
    ];
    
    let staticPath = "";
    for (const potentialPath of buildPaths) {
      if (fs.existsSync(potentialPath)) {
        staticPath = potentialPath;
        console.log(`Found static files at: ${staticPath}`);
        break;
      }
    }
    
    if (staticPath) {
      // Serve static files
      app.use(express.static(staticPath));
      
      // Handle client-side routing
      app.get("*", (_, res) => {
        res.sendFile(path.join(staticPath, "index.html"));
      });
    } else {
      console.warn("WARNING: No static files found for serving the frontend");
    }
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ TradeBikes server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();