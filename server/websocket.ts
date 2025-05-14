import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { WSMessage } from '@shared/types';

// Map to store connected clients by user ID
const clients = new Map<number, WebSocket>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as WSMessage;
        const userId = data.data?.userId;
        
        // Store connection if user ID is provided
        if (userId) {
          clients.set(userId, ws);
        }
        
        // Process message based on type
        switch (data.type) {
          case 'register':
            // Handle user registration
            if (data.data?.userId) {
              clients.set(data.data.userId, ws);
              console.log(`User ${data.data.userId} registered with WebSocket`);
            }
            break;
          case 'new_bid':
            await handleNewBid(data);
            break;
          case 'auction_ending':
            // Handle auction ending notifications
            break;
          case 'auction_completed':
            await handleAuctionCompleted(data);
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
    
    // Handle disconnection
    ws.on('close', () => {
      // Remove client from map
      for (const [userId, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(userId);
          break;
        }
      }
      console.log('WebSocket connection closed');
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
  clients.forEach((client, userId) => {
    if (excludeUserId && userId === excludeUserId) return;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Handle new bid event
async function handleNewBid(message: WSMessage) {
  const { auctionId, traderId, amount } = message.data;
  
  try {
    // Get auction details
    const auction = await storage.getAuction(auctionId);
    if (!auction) return;
    
    // Notify dealer about new bid
    const notificationContent = `New bid of £${amount} received on your auction`;
    await storage.createNotification({
      userId: auction.dealerId,
      type: 'bid',
      content: notificationContent,
      relatedId: auctionId
    });
    
    // Send real-time notification to dealer
    sendToUser(auction.dealerId, {
      type: 'new_bid',
      data: {
        auctionId,
        traderId,
        amount,
        motorcycle: await storage.getMotorcycle(auction.motorcycleId)
      },
      timestamp: Date.now()
    });
    
    // Broadcast bid update to all other traders
    broadcast({
      type: 'new_bid',
      data: {
        auctionId,
        amount
      },
      timestamp: Date.now()
    }, traderId); // exclude the trader who placed the bid
  } catch (error) {
    console.error('Error handling new bid:', error);
  }
}

// Handle auction completed event
async function handleAuctionCompleted(message: WSMessage) {
  const { auctionId } = message.data;
  
  try {
    const auction = await storage.getAuction(auctionId);
    if (!auction) return;
    
    const highestBid = await storage.getHighestBidForAuction(auctionId);
    const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
    
    if (highestBid) {
      // Update auction with winning bid
      await storage.updateAuction(auctionId, {
        status: 'completed',
        winningBidId: highestBid.id,
        winningBidderId: highestBid.dealerId
      });
      
      // Notify dealer
      await storage.createNotification({
        userId: auction.dealerId,
        type: 'auction_completed',
        content: `Your underwrite for ${motorcycle?.make} ${motorcycle?.model} has ended with a winning bid of £${highestBid.amount}`,
        relatedId: auctionId
      });
      
      // Notify winning bidder
      await storage.createNotification({
        userId: highestBid.dealerId,
        type: 'auction_completed',
        content: `Congratulations! You won the underwrite for ${motorcycle?.make} ${motorcycle?.model} with a bid of £${highestBid.amount}`,
        relatedId: auctionId
      });
      
      // Send real-time notifications
      sendToUser(auction.dealerId, {
        type: 'auction_completed',
        data: {
          auctionId,
          winningBid: highestBid.amount,
          winningBidderId: highestBid.dealerId
        },
        timestamp: Date.now()
      });
      
      sendToUser(highestBid.dealerId, {
        type: 'auction_completed',
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
        type: 'auction_completed',
        content: `Your underwrite for ${motorcycle?.make} ${motorcycle?.model} has ended with no bids`,
        relatedId: auctionId
      });
      
      sendToUser(auction.dealerId, {
        type: 'auction_completed',
        data: {
          auctionId,
          noBids: true
        },
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error handling auction completed:', error);
  }
}

// Handle new message event
async function handleNewMessage(message: WSMessage) {
  const { senderId, receiverId, content, auctionId } = message.data;
  
  try {
    // Store message
    const newMessage = await storage.createMessage({
      senderId,
      receiverId,
      content,
      auctionId
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

// Handle auction created event
async function handleAuctionCreated(message: WSMessage) {
  const { auctionId, dealerId } = message.data;
  
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) return;
    
    // Broadcast to all traders
    for (const [userId, client] of clients.entries()) {
      try {
        const user = await storage.getUser(userId);
        if (user && user.role === 'trader' && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'auction_created',
            data: {
              auction
            },
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error(`Error sending auction_created to user ${userId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error handling auction created:', error);
  }
}

// Handle bid accepted event
async function handleBidAccepted(message: WSMessage) {
  const { auctionId, dealerId, bidderId } = message.data;
  
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) return;
    
    // Notify the bidder
    await storage.createNotification({
      userId: bidderId,
      type: 'bid_accepted',
      content: `Your bid on ${auction.motorcycle.make} ${auction.motorcycle.model} has been accepted by the dealer.`,
      relatedId: auctionId
    });

    sendToUser(bidderId, {
      type: 'bid_accepted',
      data: {
        auctionId,
        dealerId,
        motorcycle: auction.motorcycle,
        amount: auction.currentBid
      },
      timestamp: Date.now()
    });
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
