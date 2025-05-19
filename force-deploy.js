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

console.log(`Deployment force update created at ${timestamp}`);
console.log('Your changes will be reflected in the next deployment.');