const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting TradeBikes build process for deployment...');

try {
  // Ensure all dependencies are installed
  console.log('Installing dependencies...');
  execSync('npm install -D autoprefixer postcss tailwindcss', { stdio: 'inherit' });
  
  // Run the build process
  console.log('Building the application...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Create build directory if it doesn't exist
  const buildDir = path.join(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Copy the dist files to build directory for deployment
  console.log('Copying build files...');
  execSync('cp -r dist/* build/', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully! Files are ready for deployment.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}