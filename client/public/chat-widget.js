// TradeBikes Chat Widget - Standalone Implementation
// This provides a fallback chat widget when the React app doesn't load
document.addEventListener('DOMContentLoaded', function() {
  // Wait a short time to see if React loads
  setTimeout(function() {
    // If we find a React chat widget, don't create this one
    if (document.querySelector('[data-chat-widget="react"]')) {
      console.log('React chat widget detected, skipping standalone implementation');
      return;
    }

    console.log('Creating standalone chat widget');
    
    // Create a chat button with fixed positioning
    const chatButtonContainer = document.createElement('div');
    chatButtonContainer.setAttribute('data-chat-widget', 'standalone');
    chatButtonContainer.style.position = 'fixed';
    chatButtonContainer.style.bottom = '20px';
    chatButtonContainer.style.right = '20px';
    chatButtonContainer.style.zIndex = '9999';
    
    // Create the button
    const chatButton = document.createElement('button');
    chatButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    chatButton.style.width = '56px';
    chatButton.style.height = '56px';
    chatButton.style.borderRadius = '50%';
    chatButton.style.backgroundColor = '#2c5282'; // TradeBikes blue
    chatButton.style.color = 'white';
    chatButton.style.border = 'none';
    chatButton.style.cursor = 'pointer';
    chatButton.style.display = 'flex';
    chatButton.style.justifyContent = 'center';
    chatButton.style.alignItems = 'center';
    chatButton.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
    chatButton.style.transition = 'all 0.3s ease';
    
    // Hover effect
    chatButton.onmouseover = function() {
      this.style.transform = 'scale(1.05)';
      this.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.3)';
    };
    
    chatButton.onmouseout = function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
    };
    
    // Add to DOM
    chatButtonContainer.appendChild(chatButton);
    document.body.appendChild(chatButtonContainer);
    
    // Create chat window (initially hidden)
    const chatWindow = document.createElement('div');
    chatWindow.style.position = 'fixed';
    chatWindow.style.bottom = '80px';
    chatWindow.style.right = '20px';
    chatWindow.style.width = '320px';
    chatWindow.style.height = '400px';
    chatWindow.style.backgroundColor = 'white';
    chatWindow.style.borderRadius = '12px';
    chatWindow.style.boxShadow = '0 5px 25px rgba(0, 0, 0, 0.2)';
    chatWindow.style.display = 'none';
    chatWindow.style.flexDirection = 'column';
    chatWindow.style.overflow = 'hidden';
    chatWindow.style.zIndex = '9998';
    chatWindow.style.fontFamily = 'Inter, system-ui, sans-serif';
    
    // Chat header
    const chatHeader = document.createElement('div');
    chatHeader.style.backgroundColor = '#2c5282';
    chatHeader.style.color = 'white';
    chatHeader.style.padding = '15px';
    chatHeader.style.fontWeight = 'bold';
    chatHeader.style.display = 'flex';
    chatHeader.style.justifyContent = 'space-between';
    chatHeader.style.alignItems = 'center';
    chatHeader.innerHTML = '<span>TradeBikes Support</span>';
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    
    chatHeader.appendChild(closeButton);
    chatWindow.appendChild(chatHeader);
    
    // Chat messages container
    const chatMessages = document.createElement('div');
    chatMessages.style.flex = '1';
    chatMessages.style.padding = '15px';
    chatMessages.style.overflowY = 'auto';
    chatMessages.style.display = 'flex';
    chatMessages.style.flexDirection = 'column';
    chatMessages.style.gap = '10px';
    chatWindow.appendChild(chatMessages);
    
    // Input area
    const inputArea = document.createElement('div');
    inputArea.style.padding = '10px';
    inputArea.style.borderTop = '1px solid #eee';
    inputArea.style.display = 'flex';
    
    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.placeholder = 'Type your message...';
    chatInput.style.flex = '1';
    chatInput.style.padding = '10px';
    chatInput.style.border = '1px solid #ddd';
    chatInput.style.borderRadius = '20px';
    chatInput.style.outline = 'none';
    
    const sendButton = document.createElement('button');
    sendButton.innerHTML = '→';
    sendButton.style.marginLeft = '10px';
    sendButton.style.width = '40px';
    sendButton.style.borderRadius = '20px';
    sendButton.style.backgroundColor = '#2c5282';
    sendButton.style.color = 'white';
    sendButton.style.border = 'none';
    sendButton.style.cursor = 'pointer';
    
    inputArea.appendChild(chatInput);
    inputArea.appendChild(sendButton);
    chatWindow.appendChild(inputArea);
    
    // Add window to DOM
    document.body.appendChild(chatWindow);
    
    // Helper function to add a message
    function addMessage(text, sender) {
      const messageContainer = document.createElement('div');
      messageContainer.style.maxWidth = '80%';
      messageContainer.style.padding = '10px';
      messageContainer.style.borderRadius = '10px';
      messageContainer.style.marginBottom = '8px';
      messageContainer.style.wordBreak = 'break-word';
      
      if (sender === 'user') {
        messageContainer.style.alignSelf = 'flex-end';
        messageContainer.style.backgroundColor = '#E3F2FD';
        messageContainer.style.marginLeft = 'auto';
      } else {
        messageContainer.style.alignSelf = 'flex-start';
        messageContainer.style.backgroundColor = '#f1f1f1';
      }
      
      messageContainer.textContent = text;
      chatMessages.appendChild(messageContainer);
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Toggle chat window visibility
    chatButton.addEventListener('click', function() {
      if (chatWindow.style.display === 'none') {
        chatWindow.style.display = 'flex';
        chatInput.focus();
        
        // If first time opening, add welcome message
        if (chatMessages.childElementCount === 0) {
          addMessage('Hello there! Welcome to TradeBikes. How can I help you today?', 'bot');
        }
      }
    });
    
    // Close chat window
    closeButton.addEventListener('click', function() {
      chatWindow.style.display = 'none';
    });
    
    // Send message functionality
    function sendMessage() {
      const message = chatInput.value.trim();
      if (message) {
        addMessage(message, 'user');
        chatInput.value = '';
        
        // Simulate response after short delay
        setTimeout(() => {
          let response;
          
          if (message.toLowerCase().includes('login') || message.toLowerCase().includes('sign in')) {
            response = "If you're having trouble logging in, please make sure your credentials are correct. If you need further assistance, please contact your account manager.";
          }
          else if (message.toLowerCase().includes('list') || message.toLowerCase().includes('sell')) {
            response = "To list a motorcycle, go to your Dealer Dashboard and click on 'Add New Bike'. Fill in the details and photos, then click 'Create Listing'.";
          }
          else if (message.toLowerCase().includes('bid') || message.toLowerCase().includes('offer')) {
            response = "You can place bids on active listings by visiting the marketplace section. Click on any listing to view details and submit your bid.";
          }
          else if (message.toLowerCase().includes('payment') || message.toLowerCase().includes('pay')) {
            response = "All payments are processed securely through our platform. Once a deal is accepted, you'll receive payment instructions in your notifications.";
          }
          else if (message.toLowerCase().includes('transport') || message.toLowerCase().includes('delivery')) {
            response = "Transport options are available for all completed deals. You can arrange transport from your dashboard after a deal is finalized.";
          }
          else if (message.toLowerCase().includes('contact') || message.toLowerCase().includes('support')) {
            response = "For direct support, please email us at support@tradebikes.online or call 0800-BIKE-TRADE during business hours.";
          }
          else {
            response = "Thank you for your message. Our team is currently offline, but we'll get back to you as soon as possible. For urgent inquiries, please email support@tradebikes.online.";
          }
          
          addMessage(response, 'bot');
        }, 1000);
      }
    }
    
    // Send on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send on Enter key
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }, 2000); // Wait 2 seconds to check if React loads
});