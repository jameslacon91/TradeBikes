// Simple production server for TradeBikes
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Get dirname in ESM environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting TradeBikes production server...');

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session setup
const MemoryStoreFactory = MemoryStore(session);
const sessionStore = new MemoryStoreFactory({
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
});

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// CORS middleware for API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Password utilities
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64));
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// In-memory user database
const users = new Map();

// Create admin user if it doesn't exist
async function createAdminUser() {
  if (!users.has('admin')) {
    const adminPassword = await hashPassword('password');
    users.set('admin', {
      id: 999,
      username: 'admin',
      password: adminPassword,
      email: 'admin@tradebikes.com',
      role: 'admin',
      companyName: 'TradeBikes Administration',
      favoriteDealers: []
    });
    console.log('Admin user created with username: admin, password: password');
  }
  
  // Add test user
  if (!users.has('johndealer')) {
    const dealerPassword = await hashPassword('password123');
    users.set('johndealer', {
      id: 1,
      username: 'johndealer',
      password: dealerPassword,
      email: 'john@example.com',
      role: 'dealer',
      companyName: 'Johns Motorcycles',
      favoriteDealers: []
    });
    console.log('Test user johndealer created');
  }
}

// Create initial users
createAdminUser();

// Login API
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const user = users.get(username);
    
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const isPasswordValid = await comparePasswords(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${username}`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Set user in session
    req.session.user = { ...user, password: undefined };
    
    console.log(`User authenticated: ${username}`);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// Registration API
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, companyName, role = 'dealer' } = req.body;
    console.log(`Registration attempt for: ${username}`);
    
    if (!username || !password || !email || !companyName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (users.has(username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create the new user
    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: Date.now(), // Simple ID generation
      username,
      password: hashedPassword,
      email,
      role,
      companyName,
      favoriteDealers: []
    };
    
    // Store in our in-memory database
    users.set(username, newUser);
    
    // Set user in session
    req.session.user = { ...newUser, password: undefined };
    
    console.log(`New user registered: ${username}`);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
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
  req.session.destroy();
  res.sendStatus(200);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TradeBikes API is running' });
});

// Find and serve static files
let staticPath = path.join(__dirname, 'build');
if (!fs.existsSync(staticPath)) {
  staticPath = path.join(__dirname, 'client');
  console.log(`Using development frontend path: ${staticPath}`);
} else {
  console.log(`Using build frontend path: ${staticPath}`);
}

if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
}

// SPA fallback - all non-API routes serve the index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(staticPath, 'index.html'));
  } else {
    res.status(404).json({ message: 'API endpoint not found' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ TradeBikes server running on port ${PORT}`);
});