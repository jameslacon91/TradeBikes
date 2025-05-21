// Simplified server for TradeBikes that doesn't conflict with existing server
const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('Starting TradeBikes simplified server...');

// Create Express app
const app = express();

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Find static files
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  console.log(`Serving static files from: ${buildDir}`);
  app.use(express.static(buildDir));
  
  // Serve index.html for all routes for SPA routing
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).send('API endpoint not found');
    } else {
      res.sendFile(path.join(buildDir, 'index.html'));
    }
  });
} else {
  console.warn(`Warning: Could not find build directory at ${buildDir}`);
  console.log('The API server will still be running on port 5000');
}

// Start on port 3000 to avoid conflict with the main server
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ TradeBikes frontend server running on port ${PORT}`);
  console.log(`⚠️ This is a simplified server for static files only.`);
  console.log(`⚠️ The main server with API endpoints should be running on port 5000.`);
});