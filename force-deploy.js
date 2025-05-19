/**
 * Force deployment update by creating a timestamp file
 * This helps Replit recognize that changes have been made
 */

const fs = require('fs');
const path = require('path');

// Current timestamp
const timestamp = new Date().toISOString();

// Update the timestamp file
fs.writeFileSync(
  path.resolve(__dirname, 'deployment-timestamp.txt'),
  timestamp
);

// Update the version number in deploy.ts
const deployTsPath = path.resolve(__dirname, 'server', 'deploy.ts');
if (fs.existsSync(deployTsPath)) {
  let deployTs = fs.readFileSync(deployTsPath, 'utf8');
  deployTs = deployTs.replace(
    /Last deployment: .*Z/,
    `Last deployment: ${timestamp}`
  );
  fs.writeFileSync(deployTsPath, deployTs, 'utf8');
}

// Update the version number in deploy-override.ts
const overrideTsPath = path.resolve(__dirname, 'server', 'deploy-override.ts');
if (fs.existsSync(overrideTsPath)) {
  let overrideTs = fs.readFileSync(overrideTsPath, 'utf8');
  overrideTs = overrideTs.replace(
    /Last updated: .*Z/,
    `Last updated: ${timestamp}`
  );
  fs.writeFileSync(overrideTsPath, overrideTs, 'utf8');
}

// Make sure the build directory exists
const buildDir = path.resolve(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Create an emergency index.html if it doesn't exist
const indexPath = path.resolve(buildDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  const emergencyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradeBikes - Real‑Time Wholesale Motorcycle Trading</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #1a202c;
      color: white;
    }
    .container {
      text-align: center;
      padding: 20px;
      max-width: 600px;
      border-radius: 8px;
      background-color: #2d3748;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      color: #3182ce;
    }
    button {
      padding: 10px 20px;
      background-color: #3182ce;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>TradeBikes</h1>
    <p>We're experiencing technical difficulties</p>
    <p>Our team has been notified and is working to fix this issue.</p>
    <button onclick="window.location.reload()">Refresh Page</button>
  </div>
</body>
</html>`;
  fs.writeFileSync(indexPath, emergencyHtml, 'utf8');
}

// Add the Google verification file as well
const googleVerificationContent = fs.readFileSync(
  path.resolve(__dirname, 'attached_assets', 'google164afafb9b0b0c7a.html'),
  'utf8'
);
fs.writeFileSync(
  path.resolve(buildDir, 'google164afafb9b0b0c7a.html'),
  googleVerificationContent,
  'utf8'
);

console.log(`Deployment files updated with timestamp: ${timestamp}`);
console.log('Build directory:', buildDir);
console.log('Ready for deployment');