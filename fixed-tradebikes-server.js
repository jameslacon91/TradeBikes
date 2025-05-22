// TradeBikes Fixed Authentication Server
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import session from 'express-session';
import MemoryStore from 'memorystore';
import crypto from 'crypto';
import cors from 'cors';

// Get dirname in ESM environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting TradeBikes fixed authentication server...');

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
const MemoryStoreSession = MemoryStore(session);
const sessionStore = new MemoryStoreSession({
  checkPeriod: 86400000 // prune expired entries every 24h
});

app.set("trust proxy", 1);
app.use(session({
  secret: 'tradebikes-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

// In-memory user database with correct password hashing
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

// Serve favicon
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(__dirname, 'attached_assets', 'favicon.ico.png');
  if (fs.existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    // Generate a simple SVG favicon as fallback
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#3b82f6" stroke="#1e40af" stroke-width="4"/>
      <path d="M25 50 L40 35 L60 50 L75 35 M25 65 L40 50 L60 65 L75 50" stroke="white" stroke-width="3" fill="none"/>
    </svg>`;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  }
});

// Auth page - with enhanced error handling
app.get('/auth', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TradeBikes - Authentication</title>
      <link rel="icon" type="image/png" href="/favicon.ico">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #0f172a;
          color: #f8fafc;
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        header {
          background-color: #1e293b;
          color: white;
          padding: 1rem;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        main {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          width: 100%;
          box-sizing: border-box;
        }
        .logo {
          font-size: 1.8rem;
          font-weight: bold;
          margin: 0;
          color: #3b82f6;
        }
        .container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .auth-card {
          background-color: #1e293b;
          border-radius: 0.5rem;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 400px;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #334155;
          border-radius: 0.25rem;
          background-color: #0f172a;
          color: #f8fafc;
          font-size: 1rem;
          box-sizing: border-box;
        }
        button {
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.25rem;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          transition: background-color 0.2s;
        }
        button:hover {
          background-color: #2563eb;
        }
        button:disabled {
          background-color: #64748b;
          cursor: not-allowed;
        }
        .error-message {
          color: #ef4444;
          margin-top: 1rem;
          font-size: 0.875rem;
          padding: 0.75rem;
          background-color: rgba(239, 68, 68, 0.1);
          border-radius: 0.25rem;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .success-message {
          color: #10b981;
          margin-top: 1rem;
          font-size: 0.875rem;
          padding: 0.75rem;
          background-color: rgba(16, 185, 129, 0.1);
          border-radius: 0.25rem;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        footer {
          background-color: #1e293b;
          color: #94a3b8;
          text-align: center;
          padding: 1rem;
          margin-top: auto;
        }
        .tabs {
          display: flex;
          margin-bottom: 1.5rem;
        }
        .tab {
          flex: 1;
          text-align: center;
          padding: 0.75rem;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block;
        }
        .test-accounts {
          margin-top: 1rem;
          padding: 1rem;
          background-color: rgba(59, 130, 246, 0.1);
          border-radius: 0.25rem;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .test-accounts h4 {
          margin: 0 0 0.5rem 0;
          color: #3b82f6;
          font-size: 0.875rem;
        }
        .test-account-button {
          background-color: transparent;
          border: 1px solid #3b82f6;
          color: #3b82f6;
          padding: 0.5rem;
          margin: 0.25rem;
          font-size: 0.75rem;
        }
        .test-account-button:hover {
          background-color: rgba(59, 130, 246, 0.1);
        }
      </style>
    </head>
    <body>
      <header>
        <h1 class="logo">TradeBikes</h1>
      </header>
      <main>
        <div class="container">
          <div class="auth-card">
            <div class="tabs">
              <div class="tab active" id="login-tab">Login</div>
              <div class="tab" id="register-tab">Register</div>
            </div>
            
            <div class="tab-content active" id="login-content">
              <div id="login-error" class="error-message" style="display: none;"></div>
              <form id="login-form">
                <div class="form-group">
                  <label for="login-username">Username</label>
                  <input type="text" id="login-username" name="username" required>
                </div>
                <div class="form-group">
                  <label for="login-password">Password</label>
                  <input type="password" id="login-password" name="password" required>
                </div>
                <button type="submit" id="login-button">Login</button>
              </form>
              
              <div class="test-accounts">
                <h4>Test Accounts:</h4>
                <button type="button" class="test-account-button" onclick="fillLogin('admin', 'password')">Admin Account</button>
                <button type="button" class="test-account-button" onclick="fillLogin('johndealer', 'password123')">Dealer Account</button>
              </div>
            </div>
            
            <div class="tab-content" id="register-content">
              <div id="register-error" class="error-message" style="display: none;"></div>
              <div id="register-success" class="success-message" style="display: none;"></div>
              <form id="register-form">
                <div class="form-group">
                  <label for="register-username">Username</label>
                  <input type="text" id="register-username" name="username" required>
                </div>
                <div class="form-group">
                  <label for="register-email">Email</label>
                  <input type="email" id="register-email" name="email" required>
                </div>
                <div class="form-group">
                  <label for="register-company">Company Name</label>
                  <input type="text" id="register-company" name="companyName" required>
                </div>
                <div class="form-group">
                  <label for="register-password">Password</label>
                  <input type="password" id="register-password" name="password" required>
                </div>
                <button type="submit" id="register-button">Register</button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <footer>
        <p>&copy; 2025 TradeBikes. All rights reserved.</p>
      </footer>
      
      <script>
        // Fill login form with test account data
        function fillLogin(username, password) {
          document.getElementById('login-username').value = username;
          document.getElementById('login-password').value = password;
        }
      
        // Tab switching
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginContent = document.getElementById('login-content');
        const registerContent = document.getElementById('register-content');
        
        loginTab.addEventListener('click', () => {
          loginTab.classList.add('active');
          registerTab.classList.remove('active');
          loginContent.classList.add('active');
          registerContent.classList.remove('active');
        });
        
        registerTab.addEventListener('click', () => {
          registerTab.classList.add('active');
          loginTab.classList.remove('active');
          registerContent.classList.add('active');
          loginContent.classList.remove('active');
        });
        
        // Enhanced error display function
        function showError(elementId, message) {
          const errorElement = document.getElementById(elementId);
          errorElement.textContent = message;
          errorElement.style.display = 'block';
        }
        
        function hideError(elementId) {
          const errorElement = document.getElementById(elementId);
          errorElement.style.display = 'none';
        }
        
        function showSuccess(elementId, message) {
          const successElement = document.getElementById(elementId);
          successElement.textContent = message;
          successElement.style.display = 'block';
        }
        
        function hideSuccess(elementId) {
          const successElement = document.getElementById(elementId);
          successElement.style.display = 'none';
        }
        
        // Login form handling with enhanced error handling
        document.getElementById('login-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.getElementById('login-username').value;
          const password = document.getElementById('login-password').value;
          const loginButton = document.getElementById('login-button');
          
          // Reset error state
          hideError('login-error');
          
          // Disable button during request
          loginButton.disabled = true;
          loginButton.textContent = 'Logging in...';
          
          try {
            console.log('Attempting login for:', username);
            
            const response = await fetch('/api/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password }),
              credentials: 'include'
            });
            
            console.log('Login response status:', response.status);
            
            if (!response.ok) {
              let errorMessage = 'Login failed. Please check your credentials.';
              try {
                const data = await response.json();
                errorMessage = data.message || errorMessage;
              } catch (parseError) {
                console.error('Error parsing response:', parseError);
                errorMessage = 'Server error occurred during login.';
              }
              showError('login-error', errorMessage);
              return;
            }
            
            // Login successful
            const user = await response.json();
            console.log('Login successful for:', user.username);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Redirect to homepage
            window.location.href = '/';
          } catch (error) {
            console.error('Login error:', error);
            showError('login-error', 'Network error occurred. Please check your connection and try again.');
          } finally {
            // Re-enable button
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
          }
        });
        
        // Registration form handling
        document.getElementById('register-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.getElementById('register-username').value;
          const email = document.getElementById('register-email').value;
          const companyName = document.getElementById('register-company').value;
          const password = document.getElementById('register-password').value;
          const registerButton = document.getElementById('register-button');
          
          // Reset error and success states
          hideError('register-error');
          hideSuccess('register-success');
          
          // Disable button during request
          registerButton.disabled = true;
          registerButton.textContent = 'Registering...';
          
          try {
            console.log('Attempting registration for:', username);
            
            const response = await fetch('/api/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, email, companyName, password, role: 'dealer' }),
              credentials: 'include'
            });
            
            console.log('Registration response status:', response.status);
            
            if (!response.ok) {
              let errorMessage = 'Registration failed. Please try again.';
              try {
                const data = await response.json();
                errorMessage = data.message || errorMessage;
              } catch (parseError) {
                console.error('Error parsing response:', parseError);
                errorMessage = 'Server error occurred during registration.';
              }
              showError('register-error', errorMessage);
              return;
            }
            
            // Registration successful
            const user = await response.json();
            console.log('Registration successful for:', user.username);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Clear form and show success message
            document.getElementById('register-form').reset();
            showSuccess('register-success', 'Registration successful! Redirecting...');
            
            // Redirect to homepage
            setTimeout(() => {
              window.location.href = '/';
            }, 1500);
          } catch (error) {
            console.error('Registration error:', error);
            showError('register-error', 'Network error occurred. Please check your connection and try again.');
          } finally {
            // Re-enable button
            registerButton.disabled = false;
            registerButton.textContent = 'Register';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Enhanced Login API with better error handling
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`);
    
    if (!username || !password) {
      console.log('Missing username or password');
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
    console.log(`Password hash check for ${username}: ${passwordHash === user.password}`);
    
    if (passwordHash !== user.password) {
      console.log(`Invalid password for user: ${username}`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Set user in session
    req.session.user = { ...user, password: undefined };
    
    console.log(`User authenticated successfully: ${username} (${user.role})`);
    
    // Return user without password
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
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
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'TradeBikes Authentication Server',
    version: '1.0.0'
  });
});

// API endpoints for motorcycles
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

// Create a simple homepage
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TradeBikes - Motorcycle Trading Platform</title>
      <link rel="icon" type="image/png" href="/favicon.ico">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #0f172a;
          color: #f8fafc;
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        header {
          background-color: #1e293b;
          color: white;
          padding: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        main {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          width: 100%;
          box-sizing: border-box;
        }
        .logo {
          font-size: 1.8rem;
          font-weight: bold;
          margin: 0;
          color: #3b82f6;
        }
        footer {
          background-color: #1e293b;
          color: #94a3b8;
          text-align: center;
          padding: 1rem;
          margin-top: auto;
        }
        .button {
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.25rem;
          padding: 0.5rem 1rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
        .button:hover {
          background-color: #2563eb;
        }
        .welcome-container {
          text-align: center;
          margin-top: 2rem;
        }
        .motorcycles-container {
          margin-top: 2rem;
        }
        .motorcycle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .motorcycle-card {
          background-color: #1e293b;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .motorcycle-image {
          height: 200px;
          background-color: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: #94a3b8;
        }
        .motorcycle-details {
          padding: 1.5rem;
        }
        .motorcycle-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }
        .motorcycle-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
          margin: 0.5rem 0;
        }
        .motorcycle-specs {
          margin: 1rem 0;
          color: #cbd5e1;
        }
        .spec {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        .auth-buttons {
          display: flex;
          gap: 1rem;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .user-name {
          font-weight: 500;
        }
        .nav-buttons {
          display: flex;
          gap: 1rem;
        }
      </style>
    </head>
    <body>
      <header>
        <h1 class="logo">TradeBikes</h1>
        <div id="auth-container" class="auth-buttons">
          <a href="/auth" class="button">Login</a>
        </div>
      </header>
      <main>
        <div class="welcome-container">
          <h1>Welcome to TradeBikes</h1>
          <p>The premier platform for motorcycle dealers to trade vehicles.</p>
        </div>
        
        <div class="motorcycles-container">
          <h2>Featured Motorcycles</h2>
          <div class="motorcycle-grid" id="motorcycle-grid">
            <!-- Motorcycles will be loaded here -->
          </div>
        </div>
      </main>
      <footer>
        <p>&copy; 2025 TradeBikes. All rights reserved.</p>
      </footer>
      
      <script>
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const authContainer = document.getElementById('auth-container');
        
        if (user) {
          authContainer.innerHTML = \`
            <div class="user-info">
              <span class="user-name">\${user.username} (\${user.role})</span>
              <div class="nav-buttons">
                <button id="logout-button" class="button">Logout</button>
              </div>
            </div>
          \`;
          
          // Add logout functionality
          document.getElementById('logout-button').addEventListener('click', async () => {
            try {
              await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
              });
              localStorage.removeItem('user');
              window.location.reload();
            } catch (error) {
              console.error('Logout error:', error);
            }
          });
        }
        
        // Load motorcycles
        async function loadMotorcycles() {
          try {
            const response = await fetch('/api/motorcycles');
            const motorcycles = await response.json();
            
            const motorcycleGrid = document.getElementById('motorcycle-grid');
            motorcycleGrid.innerHTML = '';
            
            motorcycles.forEach(motorcycle => {
              const card = document.createElement('div');
              card.className = 'motorcycle-card';
              
              card.innerHTML = \`
                <div class="motorcycle-image">
                  \${motorcycle.make} \${motorcycle.model}
                </div>
                <div class="motorcycle-details">
                  <h3 class="motorcycle-title">\${motorcycle.make} \${motorcycle.model} (\${motorcycle.year})</h3>
                  <p class="motorcycle-price">£\${motorcycle.price.toLocaleString()}</p>
                  <div class="motorcycle-specs">
                    <div class="spec">
                      <span>Color:</span>
                      <span>\${motorcycle.color}</span>
                    </div>
                    <div class="spec">
                      <span>Mileage:</span>
                      <span>\${motorcycle.mileage.toLocaleString()} miles</span>
                    </div>
                    <div class="spec">
                      <span>Condition:</span>
                      <span>\${motorcycle.condition}</span>
                    </div>
                  </div>
                  <button class="button">View Details</button>
                </div>
              \`;
              
              motorcycleGrid.appendChild(card);
            });
          } catch (error) {
            console.error('Error loading motorcycles:', error);
          }
        }
        
        // Load motorcycles on page load
        loadMotorcycles();
      </script>
    </body>
    </html>
  `);
});

// Fallback for all other routes
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ TradeBikes fixed authentication server running on port ${PORT}`);
});