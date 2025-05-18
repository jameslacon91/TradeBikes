/**
 * TradeBikes Deployment Helper
 * This script forces Replit to recognize changes in deployment
 * by creating a timestamp file and modifying critical paths
 */

import * as fs from 'fs';

// Update the timestamp in deployment-timestamp.txt
const timestamp = new Date().toISOString();
console.log(`Updating deployment timestamp to: ${timestamp}`);
fs.writeFileSync('deployment-timestamp.txt', `Deployment requested at: ${timestamp}`);

// Update a comment in the server file to force rebuild
console.log('Adding deployment trigger to server files');
const deployFilePath = 'server/deploy.ts';
const deployContent = fs.readFileSync(deployFilePath, 'utf8');
const updatedDeployContent = deployContent.replace(
  '/**\n * Special deployment entry point for TradeBikes',
  `/**\n * Special deployment entry point for TradeBikes\n * Last deployment: ${timestamp}`
);
fs.writeFileSync(deployFilePath, updatedDeployContent);

// Create a special build marker file that will force rebuild
console.log('Creating build marker file');
fs.writeFileSync('.build-marker', `BUILD_TIMESTAMP=${timestamp}\nTRIGGER=true\n`);

console.log('✅ Deployment helper complete!');
console.log('Please deploy again - these changes should ensure the latest version is deployed.');