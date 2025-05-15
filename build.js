#!/usr/bin/env node
// Custom build script for Replit deployment
// This script enhances the standard build process to ensure all files are properly bundled

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔨 Starting enhanced build process for production deployment...');

try {
  // Run the Vite build for the client
  console.log('📦 Building client with Vite...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Build the server with esbuild
  console.log('📦 Building server with esbuild...');
  const serverFiles = [
    'server/index.ts',
    'server/auth.ts',
    'server/deployment-config.ts',
    'server/routes.ts',
    'server/storage.ts',
    'server/vite.ts',
    'server/utils.ts',
    'server/websocket.ts'
  ];
  
  // Create the list of files to build
  const fileArgs = serverFiles.filter(file => fs.existsSync(file)).join(' ');
  
  // Build the server
  execSync(`esbuild ${fileArgs} --platform=node --packages=external --bundle --format=esm --outdir=dist`, { 
    stdio: 'inherit'
  });
  
  // Copy .env file for production if it exists
  if (fs.existsSync('.env')) {
    console.log('📄 Copying .env file to dist directory...');
    fs.copyFileSync('.env', 'dist/.env');
  }
  
  // Set environment variables for production in a special file
  console.log('🔧 Creating production environment configuration...');
  fs.writeFileSync('dist/.env.production', `
NODE_ENV=production
REPLIT_DEPLOYMENT=true
SESSION_SECRET=trade-bikes-secure-session-key-for-prod-deployment
  `.trim());
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}