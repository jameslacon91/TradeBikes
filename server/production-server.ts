import express from "express";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";
import cors from "cors";
import { corsConfig } from "./deployment-config";

// Setup Express
const app = express();

// Configure CORS
app.use(cors({
  origin: corsConfig.allowedOrigins,
  credentials: corsConfig.credentials,
  methods: corsConfig.methods,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-XSRF-TOKEN']
}));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Start the server
(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Error handling
    app.use((err: any, _req: any, res: any, _next: any) => {
      console.error('Server error:', err);
      res.status(500).json({ message: "Server Error" });
    });
    
    // Find and serve static files
    let staticPath = "";
    const buildPath = path.resolve("build");
    const distPath = path.resolve("dist", "public");
    
    if (fs.existsSync(buildPath)) {
      staticPath = buildPath;
    } else if (fs.existsSync(distPath)) {
      staticPath = distPath;
    }
    
    if (staticPath) {
      console.log(`Serving static files from ${staticPath}`);
      app.use(express.static(staticPath));
      
      // Handle client-side routing
      app.get("*", (_, res) => {
        res.sendFile(path.join(staticPath, "index.html"));
      });
    } else {
      console.warn("⚠️ No static files found at build/ or dist/public/");
    }
    
    // Start listening
    const port = process.env.PORT || 5000;
    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ TradeBikes server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();