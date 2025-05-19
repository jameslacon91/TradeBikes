/**
 * TradeBikes Deployment Helper
 * This script forces Replit to recognize changes in deployment
 * by creating a timestamp file and modifying critical paths
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create timestamp for unique identifier
const timestamp = new Date().toISOString();

try {
  // Update deployment timestamp in deploy.ts
  const deployPath = path.join(__dirname, 'server', 'deploy.ts');
  let deployContent = fs.readFileSync(deployPath, 'utf8');
  deployContent = deployContent.replace(
    /Last deployment: .*/,
    `Last deployment: ${timestamp}`
  );
  fs.writeFileSync(deployPath, deployContent);
  console.log('✅ Updated deployment timestamp in deploy.ts');

  // Create/update force-rebuild.txt in the public directory
  const forceRebuildPath = path.join(__dirname, 'client', 'public', 'force-rebuild.txt');
  fs.writeFileSync(forceRebuildPath, `Force rebuild for deployment: ${timestamp}`);
  console.log('✅ Created force-rebuild.txt');

  // Create deployment-timestamp.txt at root
  const timestampPath = path.join(__dirname, 'deployment-timestamp.txt');
  fs.writeFileSync(timestampPath, timestamp);
  console.log('✅ Created deployment-timestamp.txt');

  // Create .build-marker file to force rebuild
  fs.writeFileSync('.build-marker', timestamp);
  console.log('✅ Updated .build-marker file');

  // Fix potential WebSocket issues in deployment
  console.log('Deployment files prepared with timestamp:', timestamp);
  console.log('Ready for deployment!');
} catch (error) {
  console.error('Error updating deployment files:', error);
  process.exit(1);
}