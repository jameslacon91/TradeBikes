// Simplified production server for TradeBikes
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Find the build directory
let buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  buildPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(buildPath)) {
    console.warn('WARNING: Could not find build files. API endpoints will work but frontend may not.');
  }
}

if (fs.existsSync(buildPath)) {
  console.log(`Serving static files from: ${buildPath}`);
  app.use(express.static(buildPath));
}

// API endpoints

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ TradeBikes server running on port ${PORT}`);
});