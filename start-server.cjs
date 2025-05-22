// TradeBikes Simple Production Server
// This is a standalone server that doesn't rely on the complex build system
const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { WebSocketServer } = require('ws');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cors = require('cors');
const crypto = require('crypto');

console.log('Starting TradeBikes standalone server...');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Serve the static files
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
  // Create a minimal emergency page that doesn't require any build system
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TradeBikes - Motorcycle Trading Platform</title>
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
          .error-message {
            color: #ef4444;
            margin-top: 1rem;
            font-size: 0.875rem;
          }
          .success-message {
            color: #10b981;
            margin-top: 1rem;
            font-size: 0.875rem;
          }
          footer {
            background-color: #1e293b;
            color: #94a3b8;
            text-align: center;
            padding: 1rem;
            margin-top: auto;
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
              <h2>Login</h2>
              <div id="login-error" class="error-message"></div>
              <form id="login-form">
                <div class="form-group">
                  <label for="login-username">Username</label>
                  <input type="text" id="login-username" name="username" required>
                </div>
                <div class="form-group">
                  <label for="login-password">Password</label>
                  <input type="password" id="login-password" name="password" required>
                </div>
                <button type="submit">Login</button>
              </form>
            </div>
            
            <div class="auth-card">
              <h2>Register</h2>
              <div id="register-error" class="error-message"></div>
              <div id="register-success" class="success-message"></div>
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
                <button type="submit">Register</button>
              </form>
            </div>
          </div>
        </main>
        <footer>
          <p>&copy; 2025 TradeBikes. All rights reserved.</p>
        </footer>
        
        <script>
          // Login form handling
          document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const errorElement = document.getElementById('login-error');
            
            try {
              errorElement.textContent = '';
              
              const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
              });
              
              if (!response.ok) {
                const data = await response.json();
                errorElement.textContent = data.message || 'Login failed. Please check your credentials.';
                return;
              }
              
              // Login successful
              const user = await response.json();
              localStorage.setItem('user', JSON.stringify(user));
              
              // Show welcome message and redirect to dashboard (simple redirect since we don't have the full app)
              alert(\`Welcome, \${user.username}! You are now logged in.\`);
            } catch (error) {
              console.error('Login error:', error);
              errorElement.textContent = 'An error occurred while logging in. Please try again.';
            }
          });
          
          // Registration form handling
          document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const companyName = document.getElementById('register-company').value;
            const password = document.getElementById('register-password').value;
            const errorElement = document.getElementById('register-error');
            const successElement = document.getElementById('register-success');
            
            try {
              errorElement.textContent = '';
              successElement.textContent = '';
              
              const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, companyName, password, role: 'dealer' }),
                credentials: 'include'
              });
              
              if (!response.ok) {
                const data = await response.json();
                errorElement.textContent = data.message || 'Registration failed. Please try again.';
                return;
              }
              
              // Registration successful
              const user = await response.json();
              localStorage.setItem('user', JSON.stringify(user));
              
              // Clear form and show success message
              document.getElementById('register-form').reset();
              successElement.textContent = 'Registration successful! You are now logged in.';
              
              // Show welcome message
              setTimeout(() => {
                alert(\`Welcome, \${user.username}! Your account has been created successfully.\`);
              }, 500);
            } catch (error) {
              console.error('Registration error:', error);
              errorElement.textContent = 'An error occurred during registration. Please try again.';
            }
          });
        </script>
      </body>
      </html>
    `);
  });
}

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ TradeBikes server running on port ${PORT}`);
});