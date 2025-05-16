#!/usr/bin/env node
/**
 * TradeBikes Deployment Helper
 * This script forces Replit to recognize changes in deployment
 * by creating a timestamp file and modifying critical paths
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Current timestamp to make this deployment unique
const timestamp = new Date().toISOString();

// Create a timestamp file to ensure Replit sees changes
fs.writeFileSync('deployment-timestamp.txt', `Deployment triggered at: ${timestamp}`);
console.log(`✅ Created timestamp file for deployment: ${timestamp}`);

// If we have a dist directory, touch the files to update timestamps
try {
  if (fs.existsSync('dist')) {
    console.log('📂 Updating timestamps on dist files...');
    execSync('find dist -type f -exec touch {} \\;');
  }
} catch (error) {
  console.log('⚠️ Could not update dist file timestamps:', error.message);
}

// Update main server file to force Replit to notice changes
try {
  const indexPath = 'server/index.ts';
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Add or update deployment version comment
    if (content.includes('DEPLOYMENT_VERSION:')) {
      content = content.replace(
        /DEPLOYMENT_VERSION:.*$/m,
        `DEPLOYMENT_VERSION: ${timestamp} - Updated for Replit deployment`
      );
    } else {
      content = `// DEPLOYMENT_VERSION: ${timestamp} - Updated for Replit deployment\n${content}`;
    }
    
    fs.writeFileSync(indexPath, content);
    console.log('✅ Updated server index.ts with deployment timestamp');
  }
} catch (error) {
  console.log('⚠️ Could not update server index.ts:', error.message);
}

// Create or update Replit Secrets
console.log('🔑 Make sure you have these secrets set in Replit:');
console.log('  - SESSION_SECRET: A secure random string');
console.log('  - NODE_ENV: Set to "production"');
console.log('  - REPLIT_DEPLOYMENT: Set to "true"');

console.log('\n🚀 Ready for deployment!');
console.log('1. Click the "Deploy" button in Replit');
console.log('2. Wait for the deployment to finish');
console.log('3. Visit your deployment URL (e.g., https://trade-bikes-jameslacon1.replit.app)');