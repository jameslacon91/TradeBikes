import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import { corsConfig } from "./deployment-config";

// DEPLOYMENT_VERSION: 2025-05-16T05:55:53.288Z - Updated for Replit deployment

const app = express();

// Configure CORS for cross-site requests using centralized config
// Must come before any other middleware that might set headers
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
    
    // In development, allow all origins for easier debugging
    if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }
    
    // In production, enforce CORS rules
    callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
  },
  credentials: corsConfig.credentials, // Allow cookies to be sent
  exposedHeaders: corsConfig.exposedHeaders,
  optionsSuccessStatus: corsConfig.optionsSuccessStatus, // For legacy browser support
  methods: corsConfig.methods,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-XSRF-TOKEN']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Server Error: [${status}] ${message}`);
    console.error(err.stack || err);
    
    // Don't expose detailed error info in production
    const responseMessage = process.env.NODE_ENV === 'production' 
      ? "Server Error" 
      : message;
    
    // Send response but don't throw the error after
    res.status(status).json({ message: responseMessage });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // In production, use our custom static server that looks for files in the /build directory
    try {
      const { serveStatic: serveStaticProd } = await import("./static-server");
      serveStaticProd(app);
      console.log("✅ Using production static server from static-server.ts");
    } catch (err) {
      console.error("❌ Failed to load production static server:", err);
      // Fallback to the default static server
      serveStatic(app);
    }
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Start server with error handling for port conflicts
  try {
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying alternative startup...`);
      // Try without reusePort option
      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port} (alternative startup)`);
      });
    } else {
      throw error;
    }
  }
})();
