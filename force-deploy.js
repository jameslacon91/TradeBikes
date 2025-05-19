/**
 * Force deployment update by creating a timestamp file
 * This helps Replit recognize that changes have been made
 */
const fs = require('fs');
const path = require('path');

// Create timestamp for unique identifier
const timestamp = new Date().toISOString();

// Update deployment timestamp in deploy.ts
const deployPath = path.join(__dirname, 'server', 'deploy.ts');
let deployContent = fs.readFileSync(deployPath, 'utf8');
deployContent = deployContent.replace(
  /Last deployment: .*/,
  `Last deployment: ${timestamp}`
);
fs.writeFileSync(deployPath, deployContent);

// Create/update force-rebuild.txt in the public directory
const forceRebuildPath = path.join(__dirname, 'client', 'public', 'force-rebuild.txt');
fs.writeFileSync(forceRebuildPath, `Force rebuild for deployment: ${timestamp}`);

// Update deployment timestamp file
const timestampPath = path.join(__dirname, 'deployment-timestamp.txt');
fs.writeFileSync(timestampPath, timestamp);

console.log(`Deployment files updated with timestamp: ${timestamp}`);
console.log('Ready for deployment!');