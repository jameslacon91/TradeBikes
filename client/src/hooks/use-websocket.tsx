import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WSMessage } from '@shared/types';
import { queryClient } from '@/lib/queryClient';

interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: WSMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Create WebSocket connection
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      // Connection opened
      ws.addEventListener('open', () => {
        console.log('WebSocket connection established');
        setConnected(true);
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

      // Cleanup on unmount
      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message: WSMessage) => {
    // We'll handle specific message types in the components that need them
    // This is just a central place to log and potentially do global handling
    console.log('Received WebSocket message:', message);
    
    // You could dispatch events/actions here based on message types
    // For example, refreshing queries when data changes
    switch (message.type) {
      case 'new_bid':
        // Invalidate auction queries to refresh data
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        break;
      case 'auction_completed':
        // Invalidate auction and dashboard queries
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        break;
      case 'new_message':
        // Invalidate messages query
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        break;
      case 'auction_created':
        // Invalidate auctions query
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        break;
    }
  };

  // Send a message through the WebSocket
  const sendMessage = (message: WSMessage) => {
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message, WebSocket not connected');
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}


