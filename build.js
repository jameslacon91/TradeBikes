// This script sets up the build directory for deployment
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupBuildDirectory() {
  console.log('Setting up build directory for deployment...');
  
  // Create build directory if it doesn't exist
  const buildDir = path.join(__dirname, 'build');
  try {
    await fs.mkdir(buildDir, { recursive: true });
    console.log('✅ Build directory created');
  } catch (err) {
    console.log('Build directory already exists');
  }
  
  // Create a timestamp to force Replit to recognize changes
  const timestamp = new Date().toISOString();
  await fs.writeFile(path.join(buildDir, 'force-rebuild.txt'), timestamp);
  console.log(`✅ Created force-rebuild.txt with timestamp: ${timestamp}`);
  
  // Copy Google verification file
  try {
    const googleVerificationSource = path.join(__dirname, 'attached_assets', 'google164afafb9b0b0c7a.html');
    const googleVerificationDest = path.join(buildDir, 'google164afafb9b0b0c7a.html');
    await fs.copyFile(googleVerificationSource, googleVerificationDest);
    console.log('✅ Google verification file copied');
  } catch (err) {
    console.error('❌ Error copying Google verification file:', err.message);
  }
  
  // Create a basic index.html if it doesn't exist
  const indexPath = path.join(buildDir, 'index.html');
  try {
    await fs.access(indexPath);
    console.log('✅ index.html already exists');
  } catch (err) {
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradeBikes - B2B Motorcycle Trading Platform</title>
  <meta name="description" content="A cutting-edge B2B digital platform revolutionizing motorcycle trading through advanced marketplace technologies and dynamic user engagement.">
  <link rel="icon" href="/icons/icon-512x512.svg">
  <script>
    // Redirect to client path
    window.location.href = "/client/";
  </script>
</head>
<body>
  <div id="app">
    <h1>TradeBikes Loading...</h1>
    <p>If you are not redirected automatically, please click <a href="/client/">here</a>.</p>
  </div>
</body>
</html>`;
    await fs.writeFile(indexPath, indexHtml);
    console.log('✅ Created basic index.html');
  }
  
  // Ensure icons directory exists with a placeholder
  const iconsDir = path.join(buildDir, 'icons');
  try {
    await fs.mkdir(iconsDir, { recursive: true });
    console.log('✅ Icons directory created');
    
    // Create a basic SVG icon if it doesn't exist
    const iconPath = path.join(iconsDir, 'icon-512x512.svg');
    try {
      await fs.access(iconPath);
      console.log('✅ Icon already exists');
    } catch (err) {
      const svgIcon = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#000033"/>
  <path d="M128 128H384V384H128V128Z" fill="#0066CC"/>
  <path d="M192 192H320V320H192V192Z" fill="white"/>
</svg>`;
      await fs.writeFile(iconPath, svgIcon);
      console.log('✅ Created placeholder SVG icon');
    }
  } catch (err) {
    console.error('❌ Error creating icons directory:', err.message);
  }
  
  console.log('✅ Build directory setup complete!');
}

setupBuildDirectory().catch(err => {
  console.error('Error setting up build directory:', err);
  process.exit(1);
});