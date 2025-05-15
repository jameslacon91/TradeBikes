import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { WSMessage } from '@shared/types';

// Map to store connected clients by user ID
const clients = new Map<number, WebSocket>();

export function setupWebSocket(server: Server) {
  // Configure WebSocket server with more tolerant settings for cross-domain support
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    clientTracking: true,
    // Use simpler configuration for better cross-domain support
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      serverNoContextTakeover: true,
      clientNoContextTakeover: true,
      threshold: 1024
    }
  });
  
  // Add isAlive property to WebSocket
  function heartbeat(this: WebSocket) {
    console.log('WebSocket heartbeat received');
    (this as any).isAlive = true;
  }
  
  // Set up interval for checking connections
  const interval = setInterval(() => {
    console.log(`Checking WebSocket connections (active: ${clients.size}, total: ${wss.clients.size})`);
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        console.log("Terminating inactive WebSocket connection");
        return ws.terminate();
      }
      
      (ws as any).isAlive = false;
      ws.ping(() => {}); // Add empty callback to prevent errors
    });
  }, 20000); // Check more frequently
  
  // Clean up interval on close
  wss.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket server closed');
  });
  
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  wss.on('connection', (ws, req) => {
    const clientIp = req.headers['x-forwarded-for'] || 
                     req.socket.remoteAddress || 
                     'unknown';
    const origin = req.headers.origin || 'unknown';
    
    console.log(`WebSocket connection established - IP: ${clientIp}, Origin: ${origin}`);
    console.log(`WebSocket headers:`, JSON.stringify(req.headers, null, 2));
    
    // Send immediate welcome message to verify connection
    try {
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        data: { message: 'Connected to TradeBikes WebSocket server' },
        timestamp: Date.now()
      }));
      console.log('Sent welcome message to client');
    } catch (e) {
      console.error('Error sending welcome message:', e);
    }
    
    // Mark connection as alive
    (ws as any).isAlive = true;
    ws.on('pong', heartbeat);
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as WSMessage;
        console.log('Received WebSocket message:', data.type);
        
        const userId = data.data?.userId;
        
        // Store connection if user ID is provided
        if (userId) {
          clients.set(userId, ws);
          console.log(`User ${userId} connection stored`);
        }
        
        // Process message based on type
        switch (data.type) {
          case 'register':
            // Handle user registration
            if (data.data?.userId) {
              clients.set(data.data.userId, ws);
              console.log(`User ${data.data.userId} registered with WebSocket`);
              
              // Send a confirmation message back
              ws.send(JSON.stringify({
                type: 'register_confirmed',
                data: { userId: data.data.userId },
                timestamp: Date.now()
              }));
            }
            break;
          case 'ping':
            // Handle ping requests with a pong response
            ws.send(JSON.stringify({
              type: 'pong',
              data: {},
              timestamp: Date.now()
            }));
            break;
          case 'new_bid':
            await handleNewBid(data);
            break;
          case 'auction_ending':
            // Handle auction ending notifications
            break;
          case 'underwrite_completed':
            await handleUnderwriteCompleted(data);
            break;
          case 'new_message':
            await handleNewMessage(data);
            break;
          case 'auction_created':
            await handleAuctionCreated(data);
            break;
          case 'bid_accepted':
            await handleBidAccepted(data);
            break;
          case 'deal_confirmed':
            await handleDealConfirmed(data);
            break;
          case 'collection_scheduled':
            await handleCollectionScheduled(data);
            break;
          case 'collection_confirmed':
            await handleCollectionConfirmed(data);
            break;
          case 'date_extended':
            await handleDateExtended(data);
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Handle disconnection with improved debugging
    ws.on('close', (code, reason) => {
      // Log detailed close information
      console.log(`WebSocket connection closed: code=${code}, reason=${reason || 'unknown'}, clean=${code === 1000 || code === 1001}`);
      
      // Provide code meaning
      let codeMeaning = 'Unknown';
      switch (code) {
        case 1000: codeMeaning = 'Normal Closure'; break;
        case 1001: codeMeaning = 'Going Away'; break;
        case 1002: codeMeaning = 'Protocol Error'; break;
        case 1003: codeMeaning = 'Unsupported Data'; break;
        case 1005: codeMeaning = 'No Status Received'; break;
        case 1006: codeMeaning = 'Abnormal Closure'; break;
        case 1007: codeMeaning = 'Invalid Frame Payload Data'; break;
        case 1008: codeMeaning = 'Policy Violation'; break;
        case 1009: codeMeaning = 'Message Too Big'; break;
        case 1010: codeMeaning = 'Mandatory Extension'; break;
        case 1011: codeMeaning = 'Internal Server Error'; break;
        case 1012: codeMeaning = 'Service Restart'; break;
        case 1013: codeMeaning = 'Try Again Later'; break;
        case 1014: codeMeaning = 'Bad Gateway'; break;
        case 1015: codeMeaning = 'TLS Handshake'; break;
      }
      console.log(`WebSocket close code ${code} meaning: ${codeMeaning}`);
      
      // Remove client from map
      Array.from(clients.entries()).forEach(([userId, client]) => {
        if (client === ws) {
          clients.delete(userId);
          console.log(`User ${userId} disconnected from WebSocket`);
        }
      });
    });
  });
  
  return wss;
}

// Send message to specific user
export function sendToUser(userId: number, message: WSMessage) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

// Broadcast message to all connected clients
export function broadcast(message: WSMessage, excludeUserId?: number) {
  Array.from(clients.entries()).forEach(([userId, client]) => {
    if (excludeUserId && userId === excludeUserId) return;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Handle new bid event
async function handleNewBid(message: WSMessage) {
  const { auctionId, dealerId, bidId, amount } = message.data;
  
  try {
    // Get auction details
    const auction = await storage.getAuction(auctionId);
    if (!auction) return;
    
    const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
    if (!motorcycle) return;
    
    // Notify seller about new bid
    const sellerNotificationContent = `New bid received on your underwrite`;
    await storage.createNotification({
      userId: auction.dealerId,
      type: 'bid',
      content: sellerNotificationContent,
      relatedId: auctionId
    });
    
    // Notify bidder about their placed bid
    const bidderNotificationContent = `Your bid on ${motorcycle.make} ${motorcycle.model} has been placed`;
    await storage.createNotification({
      userId: dealerId,
      type: 'bid_placed',
      content: bidderNotificationContent,
      relatedId: auctionId
    });
    
    // Send real-time notification to seller and update their stats
    sendToUser(auction.dealerId, {
      type: 'new_bid',
      data: {
        auctionId,
        dealerId,
        bidId,
        amount,
        motorcycle
      },
      timestamp: Date.now()
    });
    
    // Send real-time notification to bidder about their placed bid
    sendToUser(dealerId, {
      type: 'bid_placed',
      data: {
        auctionId,
        dealerId,
        bidId,
        amount,
        motorcycle
      },
      timestamp: Date.now()
    });
    
    // Invalidate seller's dashboard stats to update bid count
    sendToUser(auction.dealerId, {
      type: 'refresh_stats',
      data: {},
      timestamp: Date.now()
    });
    
    // Invalidate bidder's dashboard stats to update their placed bids
    sendToUser(dealerId, {
      type: 'refresh_stats',
      data: {},
      timestamp: Date.now()
    });
    
    // Don't broadcast bid amount to others - keeping it blind
    broadcast({
      type: 'auction_updated',
      data: {
        auctionId
      },
      timestamp: Date.now()
    }, dealerId); // exclude the trader who placed the bid
  } catch (error) {
    console.error('Error handling new bid:', error);
  }
}

// Handle underwrite completed event
async function handleUnderwriteCompleted(message: WSMessage) {
  const { auctionId } = message.data;
  
  try {
    const auction = await storage.getAuction(auctionId);
    if (!auction) return;
    
    const highestBid = await storage.getHighestBidForAuction(auctionId);
    const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
    
    if (highestBid) {
      // Update auction with winning bid and move to pending collection
      await storage.updateAuction(auctionId, {
        status: 'pending_collection',
        winningBidId: highestBid.id,
        winningBidderId: highestBid.dealerId
      });
      
      // Notify dealer
      await storage.createNotification({
        userId: auction.dealerId,
        type: 'underwrite_completed',
        content: `Your underwrite for ${motorcycle?.make} ${motorcycle?.model} has ended with a winning bid of £${highestBid.amount}`,
        relatedId: auctionId
      });
      
      // Notify winning bidder
      await storage.createNotification({
        userId: highestBid.dealerId,
        type: 'underwrite_completed',
        content: `Congratulations! You won the underwrite for ${motorcycle?.make} ${motorcycle?.model} with a bid of £${highestBid.amount}`,
        relatedId: auctionId
      });
      
      // Send real-time notifications
      sendToUser(auction.dealerId, {
        type: 'underwrite_completed',
        data: {
          auctionId,
          winningBid: highestBid.amount,
          winningBidderId: highestBid.dealerId
        },
        timestamp: Date.now()
      });
      
      sendToUser(highestBid.dealerId, {
        type: 'underwrite_completed',
        data: {
          auctionId,
          winningBid: highestBid.amount,
          motorcycle
        },
        timestamp: Date.now()
      });
    } else {
      // No bids, auction ended without sale
      await storage.updateAuction(auctionId, {
        status: 'completed'
      });
      
      // Notify dealer
      await storage.createNotification({
        userId: auction.dealerId,
        type: 'underwrite_completed',
        content: `Your underwrite for ${motorcycle?.make} ${motorcycle?.model} has ended with no bids`,
        relatedId: auctionId
      });
      
      sendToUser(auction.dealerId, {
        type: 'underwrite_completed',
        data: {
          auctionId,
          noBids: true
        },
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error handling underwrite completed:', error);
  }
}

// Handle new message event
async function handleNewMessage(message: WSMessage) {
  const { senderId, receiverId, content, auctionId } = message.data;
  
  try {
    // Store message - make sure to match the schema type
    const newMessage = await storage.createMessage({
      senderId: senderId,
      receiverId: receiverId,
      content: content,
      auctionId: auctionId || null
    });
    
    // Create notification
    const sender = await storage.getUser(senderId);
    await storage.createNotification({
      userId: receiverId,
      type: 'message',
      content: `New message from ${sender?.companyName}`,
      relatedId: newMessage.id
    });
    
    // Send real-time notification
    sendToUser(receiverId, {
      type: 'new_message',
      data: {
        messageId: newMessage.id,
        senderId,
        senderName: sender?.companyName,
        content,
        auctionId,
        timestamp: newMessage.createdAt
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error handling new message:', error);
  }
}

// Handle underwrite created event
async function handleAuctionCreated(message: WSMessage) {
  const { auctionId, dealerId } = message.data;
  
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) return;
    
    // Broadcast to all bidders
    await Promise.all(Array.from(clients.entries()).map(async ([userId, client]) => {
      try {
        const user = await storage.getUser(userId);
        if (user && user.role === 'bidder' && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'underwrite_created',
            data: {
              auction
            },
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error(`Error sending underwrite_created to user ${userId}:`, error);
      }
    }));
  } catch (error) {
    console.error('Error handling underwrite created:', error);
  }
}

// Handle bid accepted event
async function handleBidAccepted(message: WSMessage) {
  const { auctionId, dealerId, bidderId, motorcycleId } = message.data;
  
  try {
    console.log(`Processing bid acceptance for auction ${auctionId}, from dealer ${dealerId} to bidder ${bidderId}, motorcycle ${motorcycleId}`);
    
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) {
      console.error(`Cannot find auction with ID ${auctionId} for bid acceptance`);
      return;
    }
    
    // Get motorcycle ID from message or auction
    const motoId = motorcycleId || auction.motorcycle.id;
    
    // Double check the motorcycle exists
    const currentMotorcycle = await storage.getMotorcycle(motoId);
    if (!currentMotorcycle) {
      console.error(`Cannot find motorcycle with ID ${motoId} for bid acceptance`);
      return;
    }
    
    console.log(`Motorcycle ${motoId} current status: ${currentMotorcycle.status}`);
    
    // Update motorcycle status to pending collection
    const updatedMotorcycle = await storage.updateMotorcycle(motoId, {
      status: 'pending_collection'
    });
    
    if (!updatedMotorcycle) {
      console.error(`Failed to update motorcycle ${motoId} status for bid acceptance`);
    } else {
      console.log(`Updated motorcycle ${motoId} status to 'pending_collection'`);
    }
    
    // Verify the status was updated
    const verifiedMotorcycle = await storage.getMotorcycle(motoId);
    console.log(`Verified motorcycle ${motoId} status after update: ${verifiedMotorcycle?.status}`);
    
    // If for some reason the status wasn't updated properly, try again
    if (verifiedMotorcycle && verifiedMotorcycle.status !== 'pending_collection') {
      console.log(`Retrying motorcycle ${motoId} status update - current status: ${verifiedMotorcycle.status}`);
      await storage.updateMotorcycle(motoId, {
        status: 'pending_collection'
      });
    }
    
    // Update auction status to pending collection if not already
    if (auction.status !== 'pending_collection') {
      await storage.updateAuction(auctionId, {
        status: 'pending_collection'
      });
      console.log(`Updated auction ${auctionId} status to 'pending_collection'`);
    }
    
    // Notify the bidder
    await storage.createNotification({
      userId: bidderId,
      type: 'bid_accepted',
      content: `Your bid on ${auction.motorcycle.make} ${auction.motorcycle.model} has been accepted by the dealer.`,
      relatedId: auctionId
    });

    // Create updated motorcycle object with the new status - this ensures all clients have the same format
    const updatedMotorcycleData = {
      ...auction.motorcycle,
      status: 'pending_collection'
    };
    
    console.log('Sending detailed motorcycle data with status update:', updatedMotorcycleData);
    
    // Send WebSocket notification to bidder with detailed motorcycle info and proper status
    sendToUser(bidderId, {
      type: 'bid_accepted',
      data: {
        auctionId,
        dealerId,
        motorcycleId: auction.motorcycle.id,
        motorcycle: updatedMotorcycleData,
        amount: auction.currentBid,
        make: auction.motorcycle.make,
        model: auction.motorcycle.model,
        year: auction.motorcycle.year
      },
      timestamp: Date.now()
    });
    
    // Also notify the dealer (seller) to ensure their UI updates with the same motorcycle data structure
    sendToUser(dealerId, {
      type: 'bid_accepted_confirm',
      data: {
        auctionId,
        bidderId,
        motorcycleId: auction.motorcycle.id,
        motorcycle: updatedMotorcycleData,
        amount: auction.currentBid,
        auction: {
          id: auctionId,
          status: 'pending_collection'
        }
      },
      timestamp: Date.now()
    });
    
    // Broadcast status change to all users with complete motorcycle data
    broadcast({
      type: 'auction_status_changed',
      data: {
        auctionId,
        newStatus: 'pending_collection',
        motorcycleId: auction.motorcycle.id,
        motorcycle: updatedMotorcycleData
      },
      timestamp: Date.now()
    });
    
    console.log(`Bid acceptance processed successfully for auction ${auctionId}`);
  } catch (error) {
    console.error('Error handling bid accepted:', error);
  }
}

// Handle deal confirmation event
async function handleDealConfirmed(message: WSMessage) {
  const { auctionId, dealerId, bidderId } = message.data;
  
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) return;
    
    // Notify the dealer
    await storage.createNotification({
      userId: dealerId,
      type: 'deal_confirmed',
      content: `The buyer has confirmed the deal for ${auction.motorcycle.make} ${auction.motorcycle.model}. Please schedule a collection date.`,
      relatedId: auctionId
    });

    sendToUser(dealerId, {
      type: 'deal_confirmed',
      data: {
        auctionId,
        bidderId,
        motorcycle: auction.motorcycle
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error handling deal confirmed:', error);
  }
}

// Handle collection scheduled event
async function handleCollectionScheduled(message: WSMessage) {
  const { auctionId, dealerId, bidderId, collectionDate } = message.data;
  
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) return;
    
    // Notify the bidder
    await storage.createNotification({
      userId: bidderId,
      type: 'collection_scheduled',
      content: `Collection for ${auction.motorcycle.make} ${auction.motorcycle.model} has been scheduled for ${new Date(collectionDate).toLocaleDateString()}.`,
      relatedId: auctionId
    });

    sendToUser(bidderId, {
      type: 'collection_scheduled',
      data: {
        auctionId,
        dealerId,
        motorcycle: auction.motorcycle,
        collectionDate
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error handling collection scheduled:', error);
  }
}

// Handle collection confirmation event
async function handleCollectionConfirmed(message: WSMessage) {
  const { auctionId, dealerId, bidderId } = message.data;
  
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) return;
    
    // Notify the dealer
    await storage.createNotification({
      userId: dealerId,
      type: 'collection_confirmed',
      content: `The buyer has confirmed collection of ${auction.motorcycle.make} ${auction.motorcycle.model}. The transaction is now complete.`,
      relatedId: auctionId
    });

    sendToUser(dealerId, {
      type: 'collection_confirmed',
      data: {
        auctionId,
        bidderId,
        motorcycle: auction.motorcycle
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error handling collection confirmed:', error);
  }
}

// Handle date extended event
async function handleDateExtended(message: WSMessage) {
  const { auctionId, motorcycleId, sellerId, bidderId, newAvailabilityDate } = message.data;
  
  try {
    // Retrieve auction and motorcycle details
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) {
      console.error('Missing auction data for date extension');
      return;
    }
    
    const formattedDate = new Date(newAvailabilityDate).toLocaleDateString();
    
    // Create notification for buyer
    if (bidderId) {
      await storage.createNotification({
        userId: bidderId,
        type: 'date_extended',
        content: `The seller has extended the availability date for ${auction.motorcycle.make} ${auction.motorcycle.model} to ${formattedDate}.`,
        relatedId: auctionId
      });
      
      sendToUser(bidderId, {
        type: 'date_extended',
        data: {
          auctionId,
          sellerId,
          motorcycle: auction.motorcycle,
          newAvailabilityDate
        },
        timestamp: Date.now()
      });
    }
    
    console.log(`Date extension notification sent for auction ${auctionId}`);
  } catch (error) {
    console.error('Error handling date extension:', error);
  }
}
