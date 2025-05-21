import express from "express";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";
import cors from "cors";
import { corsConfig } from "./deployment-config";

// Setup Express
const app = express();

// Configure CORS for cross-site requests
app.use(cors({
  origin: function(origin, callback) {
    // If no origin (like a direct request), allow it
    if (!origin) {
      console.log(`CORS request from same-origin, allowed: true`);
      callback(null, true);
      return;
    }
    
    // Check against our allowedOrigins list
    const allowedOrigins = corsConfig.allowedOrigins;
    
    // First check exact matches
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS request from origin: ${origin}, allowed: true (exact match)`);
      callback(null, true);
      return;
    }
    
    // Then check pattern matches (for RegExp entries)
    const matchesPattern = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (matchesPattern) {
      console.log(`CORS request from origin: ${origin}, allowed: true (pattern match)`);
      callback(null, true);
      return;
    }
    
    console.log(`CORS request from origin: ${origin}, allowed: false`);
    callback(null, true); // Allow all origins in production for now
  },
  credentials: corsConfig.credentials,
  exposedHeaders: corsConfig.exposedHeaders,
  optionsSuccessStatus: corsConfig.optionsSuccessStatus,
  methods: corsConfig.methods,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-XSRF-TOKEN']
}));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
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

// Set up API routes first
(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Error handling middleware
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error(`Server Error: [${status}] ${message}`);
      console.error(err.stack || err);
      
      res.status(status).json({ message: "Server Error" });
    });
    
    // Serve static files
    // Look for build in the root directory first (for Replit deployment)
    let staticPath = path.resolve("build");
    if (!fs.existsSync(staticPath)) {
      // Fall back to dist/public if build doesn't exist
      staticPath = path.resolve("dist", "public");
      if (!fs.existsSync(staticPath)) {
        console.warn("Warning: Could not find static files at either 'build' or 'dist/public'");
      } else {
        console.log(`Serving static files from ${staticPath}`);
      }
    } else {
      console.log(`Serving static files from ${staticPath}`);
    }
    
    if (fs.existsSync(staticPath)) {
      app.use(express.static(staticPath));
      
      // Serve index.html for all client-side routes
      app.get("*", (_, res) => {
        res.sendFile(path.join(staticPath, "index.html"));
      });
    }
    
    // Start the server
    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();