// Simple production server script
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { registerRoutes } from './server/routes.js';

// Get dirname in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create Express app
const app = express();

// Basic middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Start the server
(async () => {
  try {
    // Setup API routes first
    const server = await registerRoutes(app);
    
    // Find static files
    const staticPath = path.join(__dirname, 'build');
    console.log(`Looking for static files at: ${staticPath}`);
    
    // Serve static files if they exist
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ TradeBikes server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();