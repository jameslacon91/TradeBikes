// Simple production server for TradeBikes
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

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

// Set up WebSocket for real-time communication
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  
  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'welcome',
    message: 'Connected to TradeBikes WebSocket server'
  }));
});

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Define API endpoints
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

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ TradeBikes server running on port ${PORT}`);
});