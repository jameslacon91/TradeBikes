// Simple standalone server for TradeBikes
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('@neondatabase/serverless');
const session = require('express-session');
const connectPg = require('connect-pg-simple');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('⚠️ DATABASE_URL environment variable not set');
  process.exit(1);
}

// Create the database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Set up session store
const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({ 
  pool, 
  createTableIfMissing: true 
});

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(cors({ 
  origin: true, 
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session setup
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'tradebikes-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('WebSocket message received:', parsedMessage.type);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Welcome to TradeBikes WebSocket server'
  }));
});

// Find the static files
let staticPath = path.join(__dirname, 'build');
if (!fs.existsSync(staticPath)) {
  console.log('Build directory not found at:', staticPath);
  staticPath = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(staticPath)) {
    console.warn('WARNING: Could not find build files. The API will work but frontend may not load.');
  } else {
    console.log('Using static files from:', staticPath);
  }
} else {
  console.log('Using static files from:', staticPath);
}

// Serve static files if they exist
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  
  // For client-side routing
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    // Serve the React app for client-side routing
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ TradeBikes server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});