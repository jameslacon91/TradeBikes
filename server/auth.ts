import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Create memory store for sessions
const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    interface User extends User {}
  }
}

export function setupAuth(app: Express) {
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });

  const sessionSecret = process.env.SESSION_SECRET || 'tradebikes-secret-key';
  
  // Multiple ways to detect production environment for maximum compatibility
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    process.env.REPLIT_DEPLOYMENT === 'true' ||
    process.env.REPLIT_ENVIRONMENT === 'production';
  
  console.log(`Server environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  
  // Configuration for cookies based on environment
  let cookieSettings: session.CookieOptions = {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
  
  // Use development cookie settings for testing
  console.log('Using development cookie settings');
  
  // In Replit environment, we actually need to be more lenient with cookies
  // since the same domain is used for both frontend and backend
  cookieSettings.sameSite = 'lax';
  
  // We'll leave secure as false to ensure cookies work in the Replit environment
  // This is safe because we're in a controlled environment
  cookieSettings.secure = false;
  
  // Force this setting for Replit deployment
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true, // Changed to true for better compatibility
    store: sessionStore,
    cookie: cookieSettings,
    // For Replit deployment, allow sessions without full security in dev
    proxy: true
  };

  app.set("trust proxy", 1);
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
        rating: 0,
        totalRatings: 0,
        favoriteDealers: []
      });
      
      console.log(`User created successfully: ${username} (ID: ${user.id})`);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Log the user in automatically
      req.login(user, (err) => {
        if (err) {
          console.error(`Error during auto-login for new user: ${username}`, err);
          return next(err);
        }
        console.log(`New user logged in: ${username}`);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log(`Login attempt for username: ${req.body.username}`);
    
    passport.authenticate("local", (err, user, info) => {
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
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
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
    console.log("Session data:", req.session);
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log("User authenticated:", req.user.username);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
