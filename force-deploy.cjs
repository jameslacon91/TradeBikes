/**
 * Force deployment update by creating a timestamp file
 * This helps Replit recognize that changes have been made
 */

const fs = require('fs');
const path = require('path');

// Create timestamp file with current date and time
const timestamp = new Date().toISOString();
fs.writeFileSync(path.join(__dirname, 'deployment-timestamp.txt'), timestamp);

// Update the force-rebuild file in the build directory
if (!fs.existsSync(path.join(__dirname, 'build'))) {
  fs.mkdirSync(path.join(__dirname, 'build'), { recursive: true });
}

fs.writeFileSync(path.join(__dirname, 'build', 'force-rebuild.txt'), timestamp);

// Make sure the Google verification file exists
const googleVerificationSource = path.join(__dirname, 'attached_assets', 'google164afafb9b0b0c7a.html');
const googleVerificationDest = path.join(__dirname, 'build', 'google164afafb9b0b0c7a.html');

if (fs.existsSync(googleVerificationSource)) {
  fs.copyFileSync(googleVerificationSource, googleVerificationDest);
  console.log('Google verification file copied to build directory');
}

// Update deploy-override.ts timestamp
const deployOverridePath = path.join(__dirname, 'server', 'deploy-override.ts');
if (fs.existsSync(deployOverridePath)) {
  let content = fs.readFileSync(deployOverridePath, 'utf8');
  content = content.replace(
    /Last updated: [0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.*Z/,
    `Last updated: ${timestamp}`
  );
  fs.writeFileSync(deployOverridePath, content);
  console.log('Updated deploy-override.ts timestamp');
}

// Make sure .env has production setting
const envPath = path.join(__dirname, '.env');
const envContent = 'NODE_ENV=production\n';
fs.writeFileSync(envPath, envContent);
console.log('Created/updated .env file with production setting');

console.log(`Deployment force update created at ${timestamp}`);
console.log('Your changes will be reflected in the next deployment.');