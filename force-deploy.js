/**
 * Force deployment update by creating a timestamp file
 * This helps Replit recognize that changes have been made
 */
import fs from 'fs';
import { execSync } from 'child_process';

// Create timestamp file
const timestamp = new Date().toISOString();
fs.writeFileSync('deployment-timestamp.txt', timestamp);
console.log(`Created deployment timestamp: ${timestamp}`);

// Install the necessary packages globally to ensure they're available during build
try {
  console.log('Installing required build dependencies...');
  execSync('npm install -g autoprefixer postcss tailwindcss@latest @tailwindcss/typography');
  console.log('Global packages installed');
  
  // Also install them locally to be sure
  execSync('npm install --save-dev autoprefixer postcss tailwindcss@latest @tailwindcss/typography');
  console.log('Local packages installed');
  
  // Create the CJS format PostCSS config for deployment
  const postcssConfigCjs = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;
  fs.writeFileSync('postcss.config.cjs', postcssConfigCjs);
  console.log('Created CJS format PostCSS config');
  
  // Create deployment marker file
  fs.writeFileSync('.build-marker', timestamp);
  console.log('✅ Deployment preparation complete');
  
  console.log('\nYour application is now ready for deployment.');
  console.log('Click the Deploy button in Replit to deploy your TradeBikes application.');
} catch (error) {
  console.error('Error preparing deployment:', error);
}