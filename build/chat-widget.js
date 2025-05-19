/**
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
  
  // Chat panel header
  const chatHeader = document.createElement('div');
  chatHeader.style.backgroundColor = '#2c5282';
  chatHeader.style.color = 'white';
  chatHeader.style.padding = '12px 16px';
  chatHeader.style.fontWeight = 'bold';
  chatHeader.style.display = 'flex';
  chatHeader.style.justifyContent = 'space-between';
  chatHeader.style.alignItems = 'center';
  chatHeader.innerHTML = '<span>TradeBikes Support</span><span style="cursor:pointer" id="tradebikes-chat-close">✕</span>';
  
  // Chat messages container
  const chatMessages = document.createElement('div');
  chatMessages.id = 'tradebikes-chat-messages';
  chatMessages.style.flex = '1';
  chatMessages.style.overflow = 'auto';
  chatMessages.style.padding = '16px';
  
  // Add a welcome message
  const welcomeMessage = document.createElement('div');
  welcomeMessage.style.backgroundColor = '#f0f4f8';
  welcomeMessage.style.borderRadius = '8px';
  welcomeMessage.style.padding = '12px';
  welcomeMessage.style.marginBottom = '8px';
  welcomeMessage.style.maxWidth = '80%';
  welcomeMessage.innerHTML = '<p style="margin:0">Hello! 👋 How can we help you today?</p><p style="margin:4px 0 0 0;font-size:12px;color:#666">Please leave a message and we\'ll get back to you shortly.</p>';
  chatMessages.appendChild(welcomeMessage);
  
  // Chat input area
  const chatInputArea = document.createElement('div');
  chatInputArea.style.borderTop = '1px solid #eee';
  chatInputArea.style.padding = '12px';
  chatInputArea.style.display = 'flex';
  
  const chatInput = document.createElement('input');
  chatInput.id = 'tradebikes-chat-input';
  chatInput.type = 'text';
  chatInput.placeholder = 'Type your message...';
  chatInput.style.flex = '1';
  chatInput.style.padding = '8px 12px';
  chatInput.style.border = '1px solid #ddd';
  chatInput.style.borderRadius = '20px';
  chatInput.style.outline = 'none';
  
  const sendButton = document.createElement('button');
  sendButton.style.backgroundColor = '#2c5282';
  sendButton.style.color = 'white';
  sendButton.style.border = 'none';
  sendButton.style.borderRadius = '20px';
  sendButton.style.padding = '8px 16px';
  sendButton.style.marginLeft = '8px';
  sendButton.style.cursor = 'pointer';
  sendButton.innerText = 'Send';
  
  // Add elements to the DOM
  chatInputArea.appendChild(chatInput);
  chatInputArea.appendChild(sendButton);
  
  chatPanel.appendChild(chatHeader);
  chatPanel.appendChild(chatMessages);
  chatPanel.appendChild(chatInputArea);
  
  chatWidget.appendChild(chatButton);
  chatWidget.appendChild(chatPanel);
  
  document.body.appendChild(chatWidget);
  
  // Add event listeners
  chatButton.addEventListener('click', function() {
    chatPanel.style.display = chatPanel.style.display === 'none' ? 'flex' : 'none';
    chatButton.style.transform = chatPanel.style.display === 'none' ? 'scale(1)' : 'scale(0.8)';
  });
  
  document.getElementById('tradebikes-chat-close').addEventListener('click', function(e) {
    e.stopPropagation();
    chatPanel.style.display = 'none';
    chatButton.style.transform = 'scale(1)';
  });
  
  function sendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText) {
      // Create user message element
      const userMessage = document.createElement('div');
      userMessage.style.backgroundColor = '#e6f7ff';
      userMessage.style.color = '#333';
      userMessage.style.borderRadius = '8px';
      userMessage.style.padding = '12px';
      userMessage.style.marginBottom = '8px';
      userMessage.style.marginLeft = 'auto';
      userMessage.style.maxWidth = '80%';
      userMessage.innerHTML = messageText;
      chatMessages.appendChild(userMessage);
      
      // Clear input
      chatInput.value = '';
      
      // Auto scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Add response message after a delay
      setTimeout(function() {
        const responseMessage = document.createElement('div');
        responseMessage.style.backgroundColor = '#f0f4f8';
        responseMessage.style.borderRadius = '8px';
        responseMessage.style.padding = '12px';
        responseMessage.style.marginBottom = '8px';
        responseMessage.style.maxWidth = '80%';
        responseMessage.innerHTML = 'Thanks for your message. Our team has been notified and will respond as soon as possible.';
        chatMessages.appendChild(responseMessage);
        
        // Auto scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 1000);
    }
  }
  
  sendButton.addEventListener('click', sendMessage);
  
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

// Run the initialization when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeChatWidget);
} else {
  // DOM is already ready
  initializeChatWidget();
}