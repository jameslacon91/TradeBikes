import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WSMessage } from '@shared/types';
import { queryClient } from '@/lib/queryClient';

// Define what functionality our WebSocket context will provide
interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: WSMessage) => void;
  registerAuthenticatedUser: (userId: number) => void;
  handleWebSocketMessage: ((message: WSMessage) => void) | null;
}

// Create the context with a default value
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  sendMessage: () => console.warn('WebSocket not initialized'),
  registerAuthenticatedUser: () => console.warn('WebSocket not initialized'),
  handleWebSocketMessage: null
});

// Check if we're running in the browser
const isBrowser = typeof window !== 'undefined';

// Export the provider component that will wrap our app
export function WebSocketProvider({ children }: { children: ReactNode }) {
  // Only create state if in browser
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [messageHandler, setMessageHandler] = useState<((message: WSMessage) => void) | null>(null);

  // Setup WebSocket connection - only in browser
  useEffect(() => {
    if (!isBrowser) return; // Return early if not in browser
    
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    function initWebSocket() {
      try {
        console.log('Initializing WebSocket connection...');
        reconnectAttempts++;
        
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        console.log(`WebSocket URL: ${wsUrl}, attempt: ${reconnectAttempts}`);
        
        ws = new WebSocket(wsUrl);

        // Connection opened
        ws.addEventListener('open', () => {
          console.log('WebSocket connection established');
          setConnected(true);
          
          // If user is already authenticated, register them
          if (userId && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'register',
              data: { userId },
              timestamp: Date.now()
            }));
          }
        });

        // Connection closed
        ws.addEventListener('close', (event) => {
          console.log(`WebSocket connection closed: Code=${event.code}, Reason=${event.reason || 'Unknown'}, Clean=${event.wasClean}`);
          setConnected(false);
          
          // Attempt to reconnect if not clean close
          if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
            console.log('Attempting to reconnect WebSocket in 3 seconds...');
            setTimeout(() => {
              initWebSocket();
            }, 3000);
          }
        });

        // Listen for messages
        ws.addEventListener('message', (event) => {
          try {
            console.log('WebSocket message received:', event.data);
            const message = JSON.parse(event.data) as WSMessage;
            processWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });

        // Error handler
        ws.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
        });

        setSocket(ws);
      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
      }
    }
    
    // Initialize WebSocket connection
    initWebSocket();

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []); // Only run on component mount
  
  // Listen for auth events
  useEffect(() => {
    if (!isBrowser) return;
    
    const handleAuthEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{userId?: number}>;
      const newUserId = customEvent.detail.userId;
      
      if (newUserId) {
        setUserId(newUserId);
      }
    };
    
    window.addEventListener('auth-state-change', handleAuthEvent);
    
    return () => {
      window.removeEventListener('auth-state-change', handleAuthEvent);
    };
  }, []);

  // Register user ID when it changes
  useEffect(() => {
    if (!isBrowser) return; // Return early if not in browser
    
    if (socket && connected && userId) {
      socket.send(JSON.stringify({
        type: 'register',
        data: { userId },
        timestamp: Date.now()
      }));
    }
  }, [userId, connected, socket]);

  // Function to register authenticated user
  const registerAuthenticatedUser = (newUserId: number) => {
    if (!isBrowser) return; // Return early if not in browser
    setUserId(newUserId);
  };

  // Process incoming WebSocket messages
  const processWebSocketMessage = (message: WSMessage) => {
    if (!isBrowser) return; // Return early if not in browser
    
    console.log('Received WebSocket message:', message);
    
    // Custom handler takes precedence if defined
    if (messageHandler) {
      messageHandler(message);
    }
    
    // Handle based on message type
    switch (message.type) {
      case 'new_bid':
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        break;
      case 'bid_accepted':
        // For bid acceptance, invalidate everything to ensure all data is fresh
        console.log('Bid accepted WebSocket event received - refreshing all data');
        
        // Invalidate specific auction data
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        
        // Invalidate all auction-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/bids'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
        
        // Invalidate dashboard and notifications
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
        
        // Force a complete refetch of all auction data with this flag - this is more aggressive
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('force-data-refresh'));
        }, 500);
        break;
      case 'auction_completed':
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        break;
      case 'new_message':
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        break;
      case 'auction_created':
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        break;
      case 'deal_confirmed':
      case 'collection_scheduled':
      case 'collection_confirmed':
        // Invalidate all auction-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/bids'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        break;
    }
  };

  // Send a message through the WebSocket
  const sendMessage = (message: WSMessage) => {
    if (!isBrowser) return; // Return early if not in browser
    
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message, WebSocket not connected');
    }
  };

  // Provide the WebSocket context to children
  return (
    <WebSocketContext.Provider 
      value={{ 
        connected, 
        sendMessage, 
        registerAuthenticatedUser,
        handleWebSocketMessage: messageHandler
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook to use the WebSocket context
export function useWebSocket() {
  return useContext(WebSocketContext);
}