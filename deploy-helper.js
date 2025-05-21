/**
 * TradeBikes Deployment Helper
 * This script forces Replit to recognize changes in deployment
 * by creating a timestamp file and modifying critical paths
 */
import fs from 'fs';
import { execSync } from 'child_process';

// Create timestamp file for deployment
const timestamp = new Date().toISOString();
fs.writeFileSync('deployment-timestamp.txt', timestamp);
console.log(`Created deployment timestamp: ${timestamp}`);

// Make sure the PostCSS config exists in CJS format for deployment
const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;

fs.writeFileSync('postcss.config.cjs', postcssConfig);
console.log('Created PostCSS config for deployment');

// Add a simple deployment marker
try {
  console.log('Installing deployment dependencies...');
  execSync('npm install -D autoprefixer postcss tailwindcss @tailwindcss/typography');
  
  // Create deployment marker file
  fs.writeFileSync('.build-marker', timestamp);
  console.log('✅ Deployment preparation complete');
  
  console.log('\nYour application is now ready for deployment.');
  console.log('Click the Deploy button in Replit to deploy your TradeBikes application.');
} catch (error) {
  console.error('Error preparing deployment:', error);
}