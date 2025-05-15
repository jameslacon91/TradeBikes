import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

// DEPLOYMENT_VERSION: May 15, 2025 - 12:15 PM - Latest version with WebSocket improvements and motorcycle status transitions

const app = express();

// Configure CORS for cross-site requests
// Must come before any other middleware that might set headers
app.use(cors({
  origin: function(origin, callback) {
    // In deployment, we need to specifically allow the replit.app domain and our development domain
    const allowedOrigins = [
      'https://trade-bikes-jameslacon1.replit.app',
      'https://trade-bikes.jameslacon1.repl.co',
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ];
    
    // If no origin (like a direct request) or our origin is in the allowed list, allow it
    const originToCheck = origin || 'same-origin';
    const allowed = !origin || allowedOrigins.includes(origin);
    
    console.log(`CORS request from origin: ${originToCheck}, allowed: ${allowed}`);
    
    // Allow any origin for now to facilitate debugging
    callback(null, true);
    
    // Once debug is complete, switch to this line to enforce origin rules:
    // callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
  },
  credentials: true, // Allow cookies to be sent
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
