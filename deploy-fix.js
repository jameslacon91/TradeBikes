#!/usr/bin/env node
// This script sets up the deployed environment correctly

import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up deployment environment...');

// Ensure we're in production mode
process.env.NODE_ENV = 'production';
process.env.REPLIT_DEPLOYMENT = 'true';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'trade-bikes-secure-session-key-for-prod-deployment';

// Load production environment variables if available
try {
  if (fs.existsSync('.env.production')) {
    console.log('📄 Loading production environment variables...');
    const envFile = fs.readFileSync('.env.production', 'utf8');
    
    // Parse and set environment variables
    envFile.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
} catch (error) {
  console.warn('⚠️ Warning: Could not load production environment variables:', error.message);
}

// Log environment for debugging
console.log('Environment:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT}`);
console.log(`SESSION_SECRET: ${process.env.SESSION_SECRET ? '[Set]' : '[Not Set]'}`);

// Force TLS for outbound connections if needed (some environments need this)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('✅ Deployment environment setup complete');

// Now run the main application
import './index.js';