// Simple production server for TradeBikes
const express = require('express');
const path = require('path');
const cors = require('cors');
const { execSync } = require('child_process');

// Verify we have the database connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required!');
  process.exit(1);
}

// Check if our build exists
const buildDir = path.join(__dirname, 'build');
try {
  const stat = require('fs').statSync(path.join(buildDir, 'index.html'));
  console.log(`Found build files, last modified: ${stat.mtime}`);
} catch (err) {
  console.warn(`Warning: Could not find build files at ${buildDir}`);
  console.log('This is normal if you haven\'t built the frontend yet.');
}

// Setup Express
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Serve static files
app.use(express.static(buildDir));

// Start server process
try {
  // Start the server via child process
  console.log('Starting TradeBikes server...');
  const child = require('child_process').spawn(
    'node_modules/.bin/tsx', 
    ['server/index.ts'], 
    {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'inherit'
    }
  );
  
  child.on('error', (err) => {
    console.error('Failed to start server process:', err);
  });
  
  // Handle frontend requests that aren't API calls
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      // Let the API server handle this
      res.status(404).send('API endpoint not found');
    } else {
      // Serve the React app
      res.sendFile(path.join(buildDir, 'index.html'));
    }
  });
  
  // Start web server
  const PORT = 3000; // Use a different port than the API server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 TradeBikes web server running on port ${PORT}`);
    console.log(`📝 API requests will be handled by the server process`);
  });
} catch (error) {
  console.error('Failed to start application:', error);
  process.exit(1);
}