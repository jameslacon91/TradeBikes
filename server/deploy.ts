/**
 * Special deployment entry point for TradeBikes
 * Last deployment: 2025-05-18T09:40:46.603Z
 * This file is designed for Replit deployment and handles production-specific configuration
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";
import cors from "cors";
import { isProduction, corsConfig } from "./prod-config"; // Use production-specific config
import crypto from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth } from "./auth";

// Create memory store for sessions
const MemoryStore = createMemoryStore(session);

// Ensure we're in production mode
process.env.NODE_ENV = 'production';
console.log(`✅ Deployment mode active (NODE_ENV: ${process.env.NODE_ENV})`);

// Create and configure the Express application
const app = express();

// Configure CORS using production settings
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) {
      console.log(`CORS request from same-origin, allowed: true`);
      callback(null, true);
      return;
    }
    
    // In production, always allow the main deployment domain
    if (origin.includes('replit.app') || origin.includes('repl.co')) {
      console.log(`CORS request from Replit domain: ${origin}, allowed: true`);
      callback(null, true);
      return;
    }
    
    // Check against allowedOrigins for other domains
    const allowedOrigins = corsConfig.allowedOrigins;
    
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS request from origin: ${origin}, allowed: true (exact match)`);
      callback(null, true);
      return;
    }
    
    console.log(`CORS request from origin: ${origin}, allowed: true (deployment mode)`);
    callback(null, true);
  },
  credentials: true,
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-XSRF-TOKEN']
}));

// Configure request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for production
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

const sessionSecret = process.env.SESSION_SECRET || 'trade-bikes-secure-session-key';
console.log(`Session secret available: ${!!sessionSecret}`);

// Set up session handling
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', crypto.randomUUID(), {
    httpOnly: false,
    sameSite: 'none',
    secure: true,
    path: '/'
  });
  next();
});

app.use(session({
  secret: sessionSecret,
  resave: true,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    path: '/'
  },
  proxy: true,
  name: 'tradebikes.sid',
  rolling: true
}));

// Setup authentication
setupAuth(app);

// Start the server
(async () => {
  // Register API routes
  const server = await registerRoutes(app);

  // Error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Server Error: [${status}] ${message}`);
    console.error(err.stack || err);
    
    // Send a generic message in production for security
    res.status(status).json({ 
      message: "An error occurred while processing your request. Please try again later." 
    });
  });

  // Serve static files from the client build
  serveStatic(app);

  // Start the server
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`✅ TradeBikes server running on port ${port} (PRODUCTION MODE)`);
  });
})();