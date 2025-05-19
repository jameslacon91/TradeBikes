/**
 * TradeBikes Build Script for Deployment
 * This script handles the build process for production deployment
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Timestamp for logging
const timestamp = new Date().toISOString();
console.log(`Starting build process at ${timestamp}`);

try {
  // Step 1: Build the client
  console.log('Building client application...');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  
  // Step 2: Check if client/dist exists
  const clientDistPath = path.join(__dirname, 'client', 'dist');
  if (!fs.existsSync(clientDistPath)) {
    throw new Error('Client build failed: dist directory not found');
  }
  
  // Step 3: Create build folder at root if it doesn't exist
  const rootBuildPath = path.join(__dirname, 'build');
  if (!fs.existsSync(rootBuildPath)) {
    fs.mkdirSync(rootBuildPath, { recursive: true });
    console.log('Created build directory at project root');
  } else {
    // Clean the build directory
    console.log('Cleaning existing build directory...');
    fs.rmSync(rootBuildPath, { recursive: true, force: true });
    fs.mkdirSync(rootBuildPath, { recursive: true });
  }
  
  // Step 4: Copy client/dist contents to root/build
  console.log('Copying build files to root/build directory...');
  execSync(`cp -r ${clientDistPath}/* ${rootBuildPath}`, { stdio: 'inherit' });
  
  // Step 5: Copy Google verification file
  const googleVerificationFile = path.join(__dirname, 'client', 'public', 'google164afafb9b0b0c7a.html');
  if (fs.existsSync(googleVerificationFile)) {
    console.log('Copying Google verification file...');
    fs.copyFileSync(googleVerificationFile, path.join(rootBuildPath, 'google164afafb9b0b0c7a.html'));
  } else {
    console.warn('Warning: Google verification file not found');
  }
  
  // Step 6: Update deploy.ts with new timestamp
  console.log('Updating deployment timestamp...');
  const deployPath = path.join(__dirname, 'server', 'deploy.ts');
  let deployContent = fs.readFileSync(deployPath, 'utf8');
  deployContent = deployContent.replace(
    /Last deployment: .*/,
    `Last deployment: ${timestamp}`
  );
  fs.writeFileSync(deployPath, deployContent);
  
  // Step 7: Create deployment timestamp file
  const timestampPath = path.join(__dirname, 'deployment-timestamp.txt');
  fs.writeFileSync(timestampPath, timestamp);
  
  console.log('✅ Build process completed successfully!');
  console.log(`Build folder created at: ${rootBuildPath}`);
  console.log('The application is now ready for deployment.');
} catch (error) {
  console.error('❌ Build process failed:');
  console.error(error);
  process.exit(1);
}