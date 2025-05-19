// This script will show a proper UI if the main React app fails to load
window.addEventListener('load', function() {
  console.log("Emergency fallback script loaded");
  
  // Check if the app has loaded after 5 seconds
  setTimeout(function() {
    console.log("Checking if app loaded correctly");
    // Get the root element
    const rootElement = document.getElementById('root');
    
    // If the root is empty, show an emergency UI
    if (rootElement && rootElement.childElementCount === 0) {
      console.error('React app failed to load, showing emergency UI');
      
      // Create a basic UI
      const emergencyUI = document.createElement('div');
      emergencyUI.style.padding = '20px';
      emergencyUI.style.maxWidth = '600px';
      emergencyUI.style.margin = '0 auto';
      emergencyUI.style.marginTop = '100px';
      emergencyUI.style.fontFamily = 'Inter, system-ui, sans-serif';
      emergencyUI.style.color = '#333';
      
      // Add content
      emergencyUI.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5282; font-size: 28px; margin-bottom: 10px;">TradeBikes</h1>
          <p style="font-size: 18px; color: #666;">Motorcycle Trading Platform</p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2c5282; margin-top: 0; font-size: 20px;">Welcome to TradeBikes</h2>
          <p>The B2B digital platform that modernizes the way used motorcycles are traded between dealerships.</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-radius: 6px; border-left: 4px solid #2c5282;">
            <p style="margin: 0; font-weight: bold;">We're experiencing technical difficulties</p>
            <p style="margin: 5px 0 0 0;">Our team has been notified and is working to fix this issue. Please try again later.</p>
          </div>
          
          <div style="margin-top: 30px;">
            <h3 style="font-size: 18px; color: #2c5282;">For immediate assistance:</h3>
            <p>Please use the chat bubble in the bottom right corner to speak with our support team.</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <button id="reload-app" style="background: #2c5282; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-size: 16px; cursor: pointer;">Reload Application</button>
          </div>
        </div>
      `;
      
      // Add to the DOM
      rootElement.appendChild(emergencyUI);
      
      // Add event listener to reload button
      document.getElementById('reload-app').addEventListener('click', function() {
        window.location.reload();
      });
    }
  }, 5000); // Wait 5 seconds to check if React loaded
});