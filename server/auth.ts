import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { User } from "@shared/schema";
import crypto from "crypto";
import { isProduction, cookieConfig } from "./deployment-config";

// Create memory store for sessions
const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    // Fix circular reference by explicitly defining required properties
    interface User {
      id: number;
      username: string;
      role: string;
      companyName: string;
      [key: string]: any; // Allow other properties from the User type
    }
  }
}

// Function to help debug session issues
const debugSession = (req: any) => {
  try {
    console.log('DEBUG SESSION:', {
      id: req.sessionID,
      cookie: JSON.stringify(req.session.cookie),
      passport: req.session.passport ? 'Exists' : 'Missing',
      user: req.user ? 'Authenticated' : 'Unauthenticated',
    });
  } catch (e) {
    console.log('Error debugging session:', e);
  }
};

export function setupAuth(app: Express) {
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });

  const sessionSecret = process.env.SESSION_SECRET || 'tradebikes-secret-key';
  
  console.log(`Server environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`Cookie settings: sameSite=${cookieConfig.session.sameSite}, secure=${cookieConfig.session.secure}`);
  
  // These settings help with TLS issues in various environments
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: true, // Changed to true to ensure session is saved on every request
    saveUninitialized: true, // Set to true for better compatibility with browser refreshes
    store: sessionStore,
    cookie: cookieConfig.session,
    // For Replit deployment, allow sessions without full security in dev
    proxy: true,
    name: 'tradebikes.sid', // Custom session name to avoid conflicts
    rolling: true // Extends session lifetime on each request
  };

  // Trust proxy is required for secure cookies over HTTPS connections on Replit
  app.set("trust proxy", 1);
  
  // Add a basic security token for AJAX requests
  // This helps with CSRF protection in a simple way
  app.use((req, res, next) => {
    res.cookie('XSRF-TOKEN', crypto.randomUUID(), {
      httpOnly: false, // Must be readable by JavaScript
      sameSite: 'lax',
      secure: false // Set to true in production with HTTPS
    });
    next();
  });
  
  // Set up session handling
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Authenticating user: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Incorrect username" });
        }
        
        console.log(`User found, validating password for: ${username}`);
        const isPasswordValid = await storage.comparePasswords(password, user.password);
        
        if (!isPasswordValid) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false, { message: "Incorrect password" });
        }
        
        console.log(`Password validated for user: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`Authentication error for ${username}:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log(`Serializing user: ${user.username} (${user.id})`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user ID: ${id}`);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.log(`User not found during deserialization. ID: ${id}`);
        return done(null, false);
      }
      
      console.log(`User deserialized successfully: ${user.username}`);
      done(null, user);
    } catch (error) {
      console.error(`Error deserializing user (ID: ${id}):`, error);
      done(error);
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt:", req.body.username);
      
      const { username, password, email, companyName, phone, address, city, postcode } = req.body;
      
      // Check for existing user
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log(`Registration failed - username already exists: ${username}`);
        return res.status(400).json({ message: "Username already exists" });
      }
      
      console.log(`Creating new user: ${username}`);
      
      // Always create users with dealer role
      const user = await storage.createUser({
        username,
        password,
        email,
        role: 'dealer', // Force role to be dealer
        companyName,
        phone,
        address,
        city,
        postcode,
        // Set default values for new users
        favoriteDealers: []
        // Note: rating and totalRatings are managed internally by the storage system
      });
      
      console.log(`User created successfully: ${username} (ID: ${user.id})`);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Add timestamp for cache busting
      const userData = {
        ...userWithoutPassword,
        _ts: new Date().getTime() // Add timestamp to force client cache invalidation
      };
      
      // Log the user in automatically
      req.login(user, (err) => {
        if (err) {
          console.error(`Error during auto-login for new user: ${username}`, err);
          return next(err);
        }
        console.log(`New user logged in: ${username}`);
        debugSession(req);
        
        // Set a cookie header to help with cross-domain issues
        // Using the same cookie settings as the session for consistency
        res.cookie('loggedIn', 'true', {
          httpOnly: false, // Readable by browser
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: cookieSettings.sameSite,
          secure: cookieSettings.secure,
          path: '/'
        });
        
        res.status(201).json(userData);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log(`Login attempt for username: ${req.body.username}`);
    
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message?: string } = {}) => {
      if (err) {
        console.error("Login authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed:", info.message || "Authentication failed");
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      
      console.log(`User authenticated successfully: ${user.username}`);
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login session error:", loginErr);
          return next(loginErr);
        }
        
        console.log(`Login session created for: ${user.username}`);
        debugSession(req);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        // Add timestamp for cache busting
        const userData = {
          ...userWithoutPassword,
          _ts: new Date().getTime() // Add timestamp to force client cache invalidation
        };
        
        // Set a cookie header to help with cross-domain issues
        // Using the same cookie settings as the session for consistency
        res.cookie('loggedIn', 'true', {
          httpOnly: false, // Readable by browser
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: cookieSettings.sameSite,
          secure: cookieSettings.secure,
          path: '/'
        });
        
        return res.status(200).json(userData);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - Auth status:", req.isAuthenticated());
    debugSession(req);
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log("User authenticated:", req.user?.username);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    
    // Add timestamp for cache busting
    const userData = {
      ...userWithoutPassword,
      _ts: new Date().getTime() // Add timestamp to force client cache invalidation
    };
    
    res.json(userData);
  });
}
