// ES module build script for TradeBikes
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting TradeBikes build process for deployment...');

// Make sure we have the required dependencies
try {
  console.log('📦 Installing required dependencies...');
  await execAsync('npm install -D autoprefixer postcss tailwindcss @tailwindcss/typography');
  console.log('✅ Dependencies installed successfully');

  // Run the build
  console.log('🏗️ Building the application...');
  await execAsync('vite build');
  console.log('✅ Application built successfully');

  // Create build directory
  const buildDir = path.join(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Copy files to build directory
  console.log('📂 Copying build files to deployment directory...');
  await execAsync('cp -r dist/* build/');
  console.log('✅ Build files copied successfully');

  console.log('🎉 Build completed successfully! Your application is ready for deployment.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  if (error.stdout) console.error('stdout:', error.stdout);
  if (error.stderr) console.error('stderr:', error.stderr);
  process.exit(1);
}