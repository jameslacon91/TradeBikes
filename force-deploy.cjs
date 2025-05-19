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
try {
  const googleVerificationContent = fs.readFileSync(
    path.resolve(__dirname, 'attached_assets', 'google164afafb9b0b0c7a.html'),
    'utf8'
  );
  fs.writeFileSync(
    path.resolve(buildDir, 'google164afafb9b0b0c7a.html'),
    googleVerificationContent,
    'utf8'
  );
} catch (err) {
  console.error('Could not copy Google verification file:', err.message);
}

// Add a chat widget script to the build directory
try {
  const chatWidgetSource = path.resolve(__dirname, 'build', 'chat-widget.js');
  if (fs.existsSync(chatWidgetSource)) {
    console.log('Chat widget already exists in build directory');
  } else {
    const chatWidgetContent = `/**
 * TradeBikes Chat Widget
 * Standalone chat widget that works even if React fails to load
 */

// Initialize the chat widget when the DOM is fully loaded
function initializeChatWidget() {
  console.log("Creating standalone chat widget");
  
  // Check if the chat widget already exists
  if (document.getElementById('tradebikes-chat-widget')) {
    console.log("Chat widget already exists, skipping creation");
    return;
  }
  
  // Create the chat widget container
  const chatWidget = document.createElement('div');
  chatWidget.id = 'tradebikes-chat-widget';
  chatWidget.style.position = 'fixed';
  chatWidget.style.bottom = '20px';
  chatWidget.style.right = '20px';
  chatWidget.style.zIndex = '9999';
  chatWidget.style.fontFamily = 'Inter, system-ui, sans-serif';
  
  // Create the chat button
  const chatButton = document.createElement('div');
  chatButton.id = 'tradebikes-chat-button';
  chatButton.style.width = '60px';
  chatButton.style.height = '60px';
  chatButton.style.borderRadius = '30px';
  chatButton.style.backgroundColor = '#2c5282';
  chatButton.style.color = 'white';
  chatButton.style.display = 'flex';
  chatButton.style.alignItems = 'center';
  chatButton.style.justifyContent = 'center';
  chatButton.style.cursor = 'pointer';
  chatButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  chatButton.style.transition = 'transform 0.3s ease';
  chatButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>';
  
  // Create the chat panel (initially hidden)
  const chatPanel = document.createElement('div');
  chatPanel.id = 'tradebikes-chat-panel';
  chatPanel.style.position = 'absolute';
  chatPanel.style.bottom = '70px';
  chatPanel.style.right = '0';
  chatPanel.style.width = '300px';
  chatPanel.style.height = '400px';
  chatPanel.style.backgroundColor = 'white';
  chatPanel.style.borderRadius = '8px';
  chatPanel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  chatPanel.style.display = 'none';
  chatPanel.style.flexDirection = 'column';
  chatPanel.style.overflow = 'hidden';
  
  // Add elements to the DOM
  chatWidget.appendChild(chatButton);
  chatWidget.appendChild(chatPanel);
  
  document.body.appendChild(chatWidget);
  
  // Add event listeners
  chatButton.addEventListener('click', function() {
    console.log("Chat button clicked");
    window.open("mailto:support@tradebikes.online", "_blank");
  });
}

// Run the initialization when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeChatWidget);
} else {
  // DOM is already ready
  initializeChatWidget();
}`;
    fs.writeFileSync(path.resolve(buildDir, 'chat-widget.js'), chatWidgetContent, 'utf8');
    console.log('Created chat widget in build directory');
  }
} catch (err) {
  console.error('Could not create chat widget:', err.message);
}

console.log(`Deployment files updated with timestamp: ${timestamp}`);
console.log('Build directory:', buildDir);
console.log('Ready for deployment');