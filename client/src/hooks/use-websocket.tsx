import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WSMessage } from '@shared/types';
import { queryClient } from '@/lib/queryClient';

// Define what functionality our WebSocket context will provide
interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: WSMessage) => void;
  registerAuthenticatedUser: (userId: number) => void;
}

// Create the context with a default value
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  sendMessage: () => console.warn('WebSocket not initialized'),
  registerAuthenticatedUser: () => console.warn('WebSocket not initialized')
});

// Check if we're running in the browser
const isBrowser = typeof window !== 'undefined';

// Export the provider component that will wrap our app
export function WebSocketProvider({ children }: { children: ReactNode }) {
  // Only create state if in browser
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Setup WebSocket connection - only in browser
  useEffect(() => {
    if (!isBrowser) return; // Return early if not in browser
    
    let ws: WebSocket | null = null;
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
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
      ws.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        setConnected(false);
      });

      // Listen for messages
      ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          handleWebSocketMessage(message);
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

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message: WSMessage) => {
    if (!isBrowser) return; // Return early if not in browser
    
    console.log('Received WebSocket message:', message);
    
    // Handle based on message type
    switch (message.type) {
      case 'new_bid':
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        break;
      case 'auction_completed':
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        break;
      case 'new_message':
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        break;
      case 'auction_created':
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
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
        registerAuthenticatedUser 
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

