import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WSMessage } from '@shared/types';
import { queryClient } from '@/lib/queryClient';

// Helper function to get human-readable meanings for WebSocket close codes
function getWebSocketCloseCodeMeaning(code: number): string {
  switch (code) {
    case 1000: return 'Normal Closure';
    case 1001: return 'Going Away';
    case 1002: return 'Protocol Error';
    case 1003: return 'Unsupported Data';
    case 1005: return 'No Status Received';
    case 1006: return 'Abnormal Closure';
    case 1007: return 'Invalid Frame Payload Data';
    case 1008: return 'Policy Violation';
    case 1009: return 'Message Too Big';
    case 1010: return 'Mandatory Extension';
    case 1011: return 'Internal Server Error';
    case 1012: return 'Service Restart';
    case 1013: return 'Try Again Later';
    case 1014: return 'Bad Gateway';
    case 1015: return 'TLS Handshake';
    default: return 'Unknown';
  }
}

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
        // Reset previous connection if it exists
        if (ws) {
          try {
            ws.close();
          } catch (e) {
            console.error('Error closing previous WebSocket connection:', e);
          }
        }
        
        console.log('Initializing WebSocket connection...');
        reconnectAttempts++;
        
        // Build the WebSocket URL, ensuring it works in all environments
        let wsUrl = '';
        
        try {
          // Dynamically detect the protocol (wss for https, ws for http)
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const host = window.location.host;
          
          // Build the WebSocket URL using current host (works for all domains)
          wsUrl = `${protocol}//${host}/ws`;
          
          // Log detailed connection information
          console.log('WebSocket connection details:');
          console.log(`  Protocol: ${protocol} (from ${window.location.protocol})`);
          console.log(`  Host: ${host}`);
          console.log(`  Full URL: ${wsUrl}`);
          console.log(`  Connection attempt: ${reconnectAttempts}/${maxReconnectAttempts}`);
        } catch (e) {
          // Provide fallbacks for different environments
          if (window.location.hostname.includes('replit.app')) {
            wsUrl = 'wss://trade-bikes-jameslacon1.replit.app/ws';
          } else if (window.location.hostname.includes('repl.co')) {
            wsUrl = 'wss://trade-bikes-jameslacon1.repl.co/ws';
          } else {
            wsUrl = 'ws://localhost:5000/ws';
          }
          console.warn(`Error creating WebSocket URL, using fallback (${wsUrl}):`, e);
        }
        
        console.log(`WebSocket URL: ${wsUrl}, attempt: ${reconnectAttempts}`);
        
        // Create new WebSocket with error handling
        try {
          ws = new WebSocket(wsUrl);
        } catch (e) {
          console.error('Error creating WebSocket connection:', e);
          
          // Try again after a delay if within retry limit
          if (reconnectAttempts < maxReconnectAttempts) {
            setTimeout(() => {
              initWebSocket();
            }, 5000);
          }
          return;
        }

        // Connection opened
        ws.addEventListener('open', () => {
          console.log('WebSocket connection established');
          setConnected(true);
          reconnectAttempts = 0; // Reset the counter on successful connection
          
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
          // Log with improved error information
          const codeMeaning = getWebSocketCloseCodeMeaning(event.code);
          console.log(`WebSocket connection closed: Code=${event.code} (${codeMeaning}), Reason=${event.reason || 'Unknown'}, Clean=${event.wasClean}`);
          setConnected(false);
          
          // Determine reconnection strategy based on close code
          const isAbnormalClosure = event.code === 1006;
          const isNoStatusReceived = event.code === 1005;
          
          // For common Replit-specific connection issues, use a more aggressive reconnection strategy
          if (isAbnormalClosure || isNoStatusReceived) {
            console.log(`Detected common Replit WebSocket issue (code ${event.code}). Using optimized reconnection strategy.`);
            
            // For these specific error codes, use a faster reconnect with shorter initial delay
            const fastReconnectDelay = Math.min(500 * Math.pow(1.5, reconnectAttempts), 5000);
            
            setTimeout(() => {
              if (document.visibilityState !== 'hidden') {
                console.log(`Fast reconnecting WebSocket after code ${event.code}...`);
                initWebSocket();
              } else {
                // Same visibility handling as below, but with faster reconnect
                const visibilityListener = () => {
                  if (document.visibilityState === 'visible') {
                    console.log('Page became visible, fast reconnecting WebSocket');
                    document.removeEventListener('visibilitychange', visibilityListener);
                    initWebSocket();
                  }
                };
                document.addEventListener('visibilitychange', visibilityListener);
              }
            }, fastReconnectDelay);
            
            return; // Skip the standard reconnection logic
          }
          
          // Standard reconnection logic with exponential backoff for other close codes
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10 seconds
            console.log(`Attempting to reconnect WebSocket in ${delay/1000} seconds... (attempt ${reconnectAttempts} of ${maxReconnectAttempts})`);
            
            setTimeout(() => {
              // Check if we should still reconnect
              if (document.visibilityState !== 'hidden') {
                console.log('Reconnecting WebSocket...');
                initWebSocket();
              } else {
                console.log('Page not visible, delaying reconnect until page becomes visible');
                // Set up a one-time visibility change listener
                const visibilityListener = () => {
                  if (document.visibilityState === 'visible') {
                    console.log('Page became visible, reconnecting WebSocket');
                    document.removeEventListener('visibilitychange', visibilityListener);
                    initWebSocket();
                  }
                };
                document.addEventListener('visibilitychange', visibilityListener);
              }
            }, delay);
          } else {
            console.error('Maximum reconnection attempts reached. WebSocket connection failed permanently.');
          }
        });
        
        // Use the helper function defined outside this block

        // Listen for messages
        ws.addEventListener('message', (event) => {
          try {
            // Log the raw data for debugging
            if (typeof event.data === 'string' && event.data.length > 1000) {
              console.log('WebSocket message received (large data):', event.data.substring(0, 100) + '... [truncated]');
            } else {
              console.log('WebSocket message received:', event.data);
            }
            
            // Parse and process the message
            const message = JSON.parse(event.data) as WSMessage;
            
            // Add timestamp if missing
            if (!message.timestamp) {
              message.timestamp = Date.now();
            }
            
            // Process the message
            processWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            console.error('Raw message data:', typeof event.data === 'string' ? 
              (event.data.length > 200 ? event.data.substring(0, 200) + '... [truncated]' : event.data) : 
              'Non-string data');
          }
        });

        // Error handler with better logging
        ws.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          
          // Automatically try to reconnect on error
          if (reconnectAttempts < maxReconnectAttempts) {
            setTimeout(() => {
              console.log('Reconnecting after WebSocket error...');
              initWebSocket();
            }, 3000);
          }
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
      case 'register_confirmed':
        console.log(`WebSocket registration confirmed for user ID: ${message.data.userId}`);
        break;
      case 'pong':
        console.log('Received pong response from server');
        break;
      case 'new_bid':
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        break;
      case 'bid_accepted':
      case 'bid_accepted_confirm':
        // For bid acceptance, handle with high priority and aggressively update
        console.log('🚨 Bid accepted WebSocket event received - refreshing all data with priority', message.data);
        
        // Check for the force update flag
        const forceUpdate = message.data.forceStatusUpdate === true;
        const updatePriority = message.data.updatePriority === 'high';
        
        if (forceUpdate) {
          console.log('Force status update flag detected - aggressive cache update will be performed');
        }
        
        // Enhanced motorcycle status update with more robust cache handling
        if (message.data.motorcycle && message.data.motorcycle.id) {
          const motorcycleId = message.data.motorcycle.id;
          const newStatus = message.data.motorcycle.status;
          
          console.log(`🔄 Immediately updating motorcycle ${motorcycleId} status to "${newStatus}"`);
          
          // Update individual motorcycle data
          queryClient.setQueryData(
            [`/api/motorcycles/${motorcycleId}`], 
            (oldData: any) => {
              if (!oldData) return oldData;
              console.log(`Updated single motorcycle cache for ID ${motorcycleId}`);
              return { ...oldData, status: newStatus };
            }
          );
          
          // Also update any motorcycle lists that might contain this motorcycle
          queryClient.setQueriesData(
            { queryKey: ['/api/motorcycles'] },
            (oldData: any) => {
              if (!oldData || !Array.isArray(oldData)) return oldData;
              
              console.log(`Checking motorcycles list cache for ID ${motorcycleId}`);
              return oldData.map((motorcycle: any) => 
                motorcycle.id === motorcycleId 
                  ? { ...motorcycle, status: newStatus }
                  : motorcycle
              );
            }
          );
          
          // Also update motorcycle info inside auction details
          if (message.data.auctionId) {
            queryClient.setQueriesData(
              { queryKey: [`/api/auctions/${message.data.auctionId}`] },
              (oldData: any) => {
                if (!oldData) return oldData;
                
                console.log(`Updating auction ${message.data.auctionId} with motorcycle status ${newStatus}`);
                return {
                  ...oldData,
                  status: message.data.auction?.status || oldData.status,
                  motorcycle: oldData.motorcycle ? {
                    ...oldData.motorcycle,
                    status: newStatus
                  } : oldData.motorcycle
                };
              }
            );
          }
          
          // Also update motorcycle in bidder's auctions list
          queryClient.setQueriesData(
            { queryKey: ['/api/auctions/bids'] },
            (oldData: any) => {
              if (!oldData || !Array.isArray(oldData)) return oldData;
              
              console.log('Updating motorcycle status in bidder auctions list');
              return oldData.map((auction: any) => {
                if (auction.motorcycleId === motorcycleId || auction.motorcycle?.id === motorcycleId) {
                  return {
                    ...auction,
                    status: message.data.auction?.status || auction.status,
                    bidAccepted: true,
                    motorcycle: auction.motorcycle ? {
                      ...auction.motorcycle,
                      status: newStatus
                    } : auction.motorcycle
                  };
                }
                return auction;
              });
            }
          );
        }
        
        // Handle status change object if present
        if (message.data.statusChange) {
          console.log('Status change notification received:', message.data.statusChange);
          // Consider additional logic here if needed
        }
        
        // Now invalidate queries to ensure fresh data from server
        // Invalidate specific auction data
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        
        // Invalidate all auction and motorcycle related queries
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/bids'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
        queryClient.invalidateQueries({ queryKey: ['/api/motorcycles'] });
        
        // Invalidate dashboard and notifications
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
        
        // Also invalidate any specific motorcycle data
        if (message.data.motorcycleId) {
          queryClient.invalidateQueries({ queryKey: [`/api/motorcycles/${message.data.motorcycleId}`] });
        }
        
        // Force a complete refetch of all auction data with this flag - this is more aggressive
        setTimeout(() => {
          console.log('Dispatching force-data-refresh event');
          window.dispatchEvent(new CustomEvent('force-data-refresh'));
        }, 500);
        break;
        
      case 'auction_status_changed':
        console.log(`Auction status changed to ${message.data.newStatus}`, message.data);
        
        // Immediately update motorcycle status in cache if available
        if (message.data.motorcycle && message.data.motorcycle.id) {
          console.log(`Directly updating motorcycle ${message.data.motorcycle.id} status to ${message.data.motorcycle.status}`);
          
          // Update motorcycle status in any existing queries
          queryClient.setQueryData(
            [`/api/motorcycles/${message.data.motorcycle.id}`], 
            (oldData: any) => {
              if (!oldData) return oldData;
              return { ...oldData, status: message.data.motorcycle.status };
            }
          );
          
          // Also update it in any auction listings that might contain this motorcycle
          queryClient.setQueriesData(
            { queryKey: ['/api/auctions'] },
            (oldData: any) => {
              if (!oldData || !Array.isArray(oldData)) return oldData;
              
              return oldData.map((auction: any) => {
                if (auction.motorcycle && auction.motorcycle.id === message.data.motorcycle.id) {
                  return {
                    ...auction,
                    motorcycle: {
                      ...auction.motorcycle,
                      status: message.data.motorcycle.status
                    },
                    status: message.data.newStatus
                  };
                }
                return auction;
              });
            }
          );
        }
        
        // Invalidate relevant data
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/bids'] });
        
        // If motorcycle data included, update motorcycle status
        if (message.data.motorcycle) {
          console.log(`Updating motorcycle ${message.data.motorcycle.id} status to ${message.data.motorcycle.status}`);
          queryClient.invalidateQueries({ queryKey: ['/api/motorcycles'] });
          queryClient.invalidateQueries({ queryKey: [`/api/motorcycles/${message.data.motorcycle.id}`] });
        }
        
        // Also update dashboard data which might show this auction/motorcycle
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
        break;
      case 'auction_completed':
      case 'underwrite_completed':
        console.log(`Auction/underwrite ${message.data.auctionId} completed`);
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
        break;
        
      case 'new_message':
        console.log('New message received');
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        break;
        
      case 'auction_created':
      case 'underwrite_created':
        console.log(`New auction/underwrite created: ${message.data.auction?.id}`);
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        break;
        
      case 'deal_confirmed':
        console.log(`Deal confirmed for auction ${message.data.auctionId}`);
        // Invalidate all auction-related queries
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/bids'] });
        queryClient.invalidateQueries({ queryKey: ['/api/motorcycles'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
        break;
        
      case 'collection_scheduled':
        console.log(`Collection scheduled for auction ${message.data.auctionId} on ${new Date(message.data.collectionDate).toLocaleDateString()}`);
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/bids'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        break;
        
      case 'collection_confirmed':
        console.log(`Collection confirmed for auction ${message.data.auctionId}`);
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/bids'] });
        queryClient.invalidateQueries({ queryKey: ['/api/motorcycles'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
        break;
        
      case 'date_extended':
        console.log(`Date extended for auction ${message.data.auctionId} to ${new Date(message.data.newAvailabilityDate).toLocaleDateString()}`);
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${message.data.auctionId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        break;
        
      case 'force_data_refresh':
        console.log('Force data refresh requested');
        // Clear the entire cache and refetch everything
        queryClient.invalidateQueries();
        break;
        
      case 'refresh_stats':
        console.log('Refreshing dashboard stats');
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        break;
    }
  };

  // Send a message through the WebSocket
  const sendMessage = (message: WSMessage) => {
    if (!isBrowser) return; // Return early if not in browser
    
    // Add timestamp to message if not present
    const messageWithTimestamp = {
      ...message,
      timestamp: message.timestamp || Date.now()
    };
    
    // Check if socket is ready to send
    if (socket && socket.readyState === WebSocket.OPEN && connected) {
      console.log('Sending WebSocket message:', messageWithTimestamp);
      try {
        socket.send(JSON.stringify(messageWithTimestamp));
        return true; // Indicate success
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        // Continue to queuing logic
      }
    } else {
      // More detailed logging about why we couldn't send
      if (!socket) {
        console.warn('Cannot send message: WebSocket not initialized');
      } else if (socket.readyState !== WebSocket.OPEN) {
        console.warn(`Cannot send message: WebSocket not in OPEN state (current state: ${
          ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socket.readyState]
        })`);
      } else if (!connected) {
        console.warn('Cannot send message: WebSocket not marked as connected');
      }
      
      // Queue message for when connection is restored (up to 3 retries)
      let retryCount = 0;
      const maxRetries = 3;
      
      const attemptSend = () => {
        if (retryCount >= maxRetries) {
          console.error(`Failed to send message after ${maxRetries} attempts`, messageWithTimestamp);
          return;
        }
        
        retryCount++;
        const delay = 1000 * retryCount;
        
        console.log(`Queuing WebSocket message for retry in ${delay}ms (attempt ${retryCount}/${maxRetries})`, messageWithTimestamp);
        
        setTimeout(() => {
          if (socket && socket.readyState === WebSocket.OPEN && connected) {
            try {
              socket.send(JSON.stringify(messageWithTimestamp));
              console.log(`Successfully sent WebSocket message on retry ${retryCount}`);
            } catch (error) {
              console.error(`Error sending message on retry ${retryCount}:`, error);
              attemptSend();
            }
          } else {
            // Try again if still not connected
            attemptSend();
          }
        }, delay);
      };
      
      attemptSend();
      return false; // Indicate that the message was queued
    }
    
    return true; // Default to assume success
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