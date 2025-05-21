// Simple production deployment server for TradeBikes
// This runs independently from the main code
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import session from 'express-session';
import memorystore from 'memorystore';
import crypto from 'crypto';
import cors from 'cors';

// Get dirname in ESM environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting TradeBikes standalone server...');

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session setup
const MemoryStore = memorystore(session);
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

app.set("trust proxy", 1);
app.use(session({
  secret: 'tradebikes-secret-key',
  resave: true,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  proxy: true,
  name: 'tradebikes.sid',
  rolling: true
}));

// Set up WebSocket for real-time communication
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  
  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'CONNECTED',
    data: {
      message: 'Connected to TradeBikes WebSocket server'
    },
    timestamp: Date.now()
  }));
  
  // Keep connection alive with heartbeats
  const interval = setInterval(() => {
    if (ws.readyState === 1) { // WebSocket.OPEN (1)
      ws.send(JSON.stringify({
        type: 'HEARTBEAT',
        timestamp: Date.now()
      }));
    } else {
      clearInterval(interval);
    }
  }, 30000);
  
  ws.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket connection closed');
  });
});

// Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// In-memory user database
const users = {
  'admin': {
    id: 999,
    username: 'admin',
    password: crypto.createHash('sha256').update('password').digest('hex'),
    email: 'admin@tradebikes.com',
    role: 'admin',
    companyName: 'TradeBikes Administration',
    favoriteDealers: []
  },
  'johndealer': {
    id: 1,
    username: 'johndealer',
    password: crypto.createHash('sha256').update('password123').digest('hex'),
    email: 'john@example.com',
    role: 'dealer',
    companyName: 'Johns Motorcycles', 
    favoriteDealers: []
  }
};

// Login API
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Case insensitive username lookup
    const userKey = Object.keys(users).find(key => key.toLowerCase() === username.toLowerCase());
    const user = userKey ? users[userKey] : null;
    
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    if (passwordHash !== user.password) {
      console.log(`Invalid password for user: ${username}`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Set user in session
    req.session.user = { ...user, password: undefined };
    
    console.log(`User authenticated: ${username}`);
    
    // Return user without password
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Registration API
app.post('/api/register', (req, res) => {
  try {
    const { username, password, email, companyName, role = 'dealer' } = req.body;
    console.log(`Registration attempt for: ${username}`);
    
    if (!username || !password || !email || !companyName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (Object.keys(users).some(key => key.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create the new user
    const newUser = {
      id: Date.now(),
      username,
      password: crypto.createHash('sha256').update(password).digest('hex'),
      email,
      role,
      companyName,
      phone: req.body.phone || '',
      address: req.body.address || '',
      city: req.body.city || '',
      postcode: req.body.postcode || '',
      favoriteDealers: []
    };
    
    // Store in our in-memory database
    users[username] = newUser;
    
    // Set user in session
    req.session.user = { ...newUser, password: undefined };
    
    console.log(`New user registered: ${username}`);
    
    // Return user without password
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User info API
app.get('/api/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  return res.json(req.session.user);
});

// Logout API
app.post('/api/logout', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.clearCookie('tradebikes.sid');
      res.status(200).json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TradeBikes API is running' });
});

// Mock API endpoints
app.get('/api/motorcycles', (req, res) => {
  res.json([
    { 
      id: 1, 
      make: 'Honda', 
      model: 'CB750', 
      year: 2020, 
      color: 'Red',
      mileage: 5000,
      condition: 'Excellent',
      price: 8500,
      sellerId: 1
    },
    { 
      id: 2, 
      make: 'Kawasaki', 
      model: 'Ninja 400', 
      year: 2019, 
      color: 'Green',
      mileage: 3200,
      condition: 'Good',
      price: 5800,
      sellerId: 2
    },
    { 
      id: 3, 
      make: 'Yamaha', 
      model: 'MT-07', 
      year: 2021, 
      color: 'Black',
      mileage: 1200,
      condition: 'Like New',
      price: 7200,
      sellerId: 1
    }
  ]);
});

// Mock dealers
app.get('/api/dealers', (req, res) => {
  res.json([
    { id: 1, name: "John's Motorcycles", location: "London", rating: 4.8 },
    { id: 2, name: "City Bikes", location: "Manchester", rating: 4.5 },
    { id: 3, name: "Motorhead Dealership", location: "Birmingham", rating: 4.7 }
  ]);
});

// Find and serve static files
const staticPath = path.join(__dirname, 'build');
if (fs.existsSync(staticPath)) {
  console.log(`Serving static files from: ${staticPath}`);
  app.use(express.static(staticPath));
  
  // SPA fallback - all non-API routes serve the index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(staticPath, 'index.html'));
    } else {
      res.status(404).json({ message: 'API endpoint not found' });
    }
  });
} else {
  console.log('Warning: Static files not found at', staticPath);
}

// Update the deployment instructions
const DEPLOYMENT_MD = path.join(__dirname, 'DEPLOYMENT.md');
if (fs.existsSync(DEPLOYMENT_MD)) {
  try {
    let content = fs.readFileSync(DEPLOYMENT_MD, 'utf8');
    content = content.replace(
      /```\n.*NODE_ENV=.*\n```/,
      '```\nnode production-server.js\n```'
    );
    fs.writeFileSync(DEPLOYMENT_MD, content);
    console.log('Updated deployment instructions in DEPLOYMENT.md');
  } catch (error) {
    console.error('Error updating DEPLOYMENT.md:', error);
  }
}

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ TradeBikes server running on port ${PORT}`);
});