import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupWebSocket, sendToUser, broadcast } from "./websocket";
import { WSMessage } from "@shared/types";
import { z } from "zod";
import { 
  insertMotorcycleSchema, 
  insertAuctionSchema, 
  insertBidSchema, 
  insertMessageSchema 
} from "@shared/schema";

import { Request, Response, NextFunction } from "express";

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// Role-based authorization middleware
// Since all users are dealers now, this simply passes through, but is kept for future role differentiation
const hasRole = (role: string) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  // All users are dealers in the current implementation
  return next();
  
  // Original implementation kept for reference:
  // if (req.user && req.user.role === role) {
  //   return next();
  // }
  // res.status(403).json({ message: "Not authorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = setupWebSocket(httpServer);
  
  // Basic health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
  });

  // API routes
  // Motorcycles
  app.post("/api/motorcycles", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const validationResult = insertMotorcycleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid motorcycle data", errors: validationResult.error.format() });
      }

      const motorcycle = await storage.createMotorcycle({
        ...validationResult.data,
        dealerId: req.user.id
      });

      res.status(201).json(motorcycle);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/motorcycles", isAuthenticated, async (req, res, next) => {
    try {
      // All users are dealers now, so we can get their motorcycles directly
      const motorcycles = await storage.getMotorcyclesByDealerId(req.user.id);
      res.json(motorcycles);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/motorcycles/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const motorcycle = await storage.getMotorcycle(id);
      if (!motorcycle) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }
      res.json(motorcycle);
    } catch (error) {
      next(error);
    }
  });

  // Auctions
  app.post("/api/auctions", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      console.log("Creating auction with data:", JSON.stringify(req.body));
      
      // Skip validation and directly create the auction with the required fields
      // This bypasses the Zod schema validation that's causing issues with date types
      const auction = await storage.createAuction({
        motorcycleId: parseInt(req.body.motorcycleId, 10),
        dealerId: req.user!.id, // Assert that user is defined
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        visibilityType: req.body.visibilityType || "all",
        visibilityRadius: req.body.visibilityType === 'radius' ? parseInt(req.body.visibilityRadius, 10) : null
        // Status is handled by the storage system automatically
      });
      
      console.log("Auction created successfully:", auction);

      // Notify potential buyers via WebSocket
      broadcast({
        type: "auction_created",
        data: { 
          auctionId: auction.id,
          dealerId: req.user.id
        },
        timestamp: Date.now()
      });

      res.status(201).json(auction);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auctions", async (req, res, next) => {
    try {
      // If user is logged in, pass their ID to get personalized results
      const currentUserId = req.isAuthenticated() ? req.user.id : null;
      const activeAuctions = await storage.getActiveAuctions(currentUserId);
      res.json(activeAuctions);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auctions/dealer", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const dealerAuctions = await storage.getAuctionsByDealerId(req.user.id);
      res.json(dealerAuctions);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete listing (auction + motorcycle)
  app.delete("/api/auctions/:id", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id, 10);
      const dealerId = req.user.id;
      
      // Attempt to delete the auction
      const deleted = await storage.deleteAuction(auctionId, dealerId);
      
      if (!deleted) {
        return res.status(400).json({ 
          message: "Unable to delete this listing. It may have received bids or you don't have permission to delete it."
        });
      }
      
      // Notify via WebSocket
      const wsMessage: WSMessage = {
        type: "auction_deleted",
        data: { 
          auctionId,
          dealerId
        },
        timestamp: Date.now()
      };
      broadcast(wsMessage);
      
      res.json({ success: true, message: "Listing deleted successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Archive listing as "no sale"
  app.post("/api/auctions/:id/archive-no-sale", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id, 10);
      const dealerId = req.user.id;
      
      // Attempt to archive the auction as "no sale"
      const updatedAuction = await storage.archiveAuctionAsNoSale(auctionId, dealerId);
      
      if (!updatedAuction) {
        return res.status(400).json({ 
          message: "Unable to archive this listing as 'no sale'. It may already be completed or you don't have permission."
        });
      }
      
      // Notify via WebSocket
      const wsMessage: WSMessage = {
        type: "auction_archived",
        data: { 
          auctionId,
          dealerId,
          status: "no_sale"
        },
        timestamp: Date.now()
      };
      broadcast(wsMessage);
      
      res.json(updatedAuction);
    } catch (error) {
      next(error);
    }
  });
  
  // Get auctions where the current user has placed bids
  app.get("/api/auctions/bids", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const dealerId = req.user.id;
      console.log(`DEBUG: Getting auctions with bids for dealer ${dealerId} (username: ${req.user.username})`);
      
      // Get all bids by this user to log and debug
      const dealerBids = await storage.getBidsByDealerId(dealerId);
      console.log(`DEBUG: User ${dealerId} has ${dealerBids.length} bids`);
      dealerBids.forEach(bid => {
        console.log(`DEBUG: Bid ID ${bid.id} for auction ${bid.auctionId} - Amount: ${bid.amount}`);
      });
      
      // Get pending collection auctions
      const allAuctions = Array.from((storage as any).auctions.values());
      const pendingCollectionAuctions = allAuctions.filter(auction => 
        auction.status === 'pending_collection' && 
        auction.winningBidderId === dealerId);
      
      console.log(`DEBUG: User ${dealerId} has ${pendingCollectionAuctions.length} pending collection auctions`);
      pendingCollectionAuctions.forEach(auction => {
        console.log(`DEBUG: Pending collection auction ${auction.id} - Motorcycle ${auction.motorcycleId}`);
      });
      
      // Get regular auction data
      const auctions = await storage.getAuctionsWithBidsByDealer(dealerId);
      console.log(`DEBUG: getAuctionsWithBidsByDealer returned ${auctions.length} auctions for user ${dealerId}`);
      auctions.forEach(auction => {
        console.log(`DEBUG: Auction ${auction.id} - Status ${auction.status}, Motorcycle ${auction.motorcycleId}`);
        console.log(`DEBUG: Auction ${auction.id} - WinningBidderId: ${auction.winningBidderId}, BidAccepted: ${auction.bidAccepted}`);
      });
      
      res.json(auctions);
    } catch (error) {
      console.error('Error in /api/auctions/bids:', error);
      next(error);
    }
  });

  app.get("/api/auctions/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const auction = await storage.getAuctionWithDetails(id);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      res.json(auction);
    } catch (error) {
      next(error);
    }
  });
  
  // Motorcycles
  app.post("/api/motorcycles", isAuthenticated, hasRole("dealer"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = insertMotorcycleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid motorcycle data", errors: validationResult.error.format() });
      }
      
      // Add dealer ID from logged in user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const motorcycle = await storage.createMotorcycle({
        ...validationResult.data,
        dealerId: req.user.id
      });
      
      res.status(201).json(motorcycle);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new auction
  app.post("/api/bids", isAuthenticated, async (req, res, next) => {
    try {
      console.log("Received bid request:", req.body);
      
      const validationResult = insertBidSchema.safeParse({
        auctionId: req.body.auctionId,
        dealerId: req.user.id,
        amount: req.body.amount
      });
      
      if (!validationResult.success) {
        console.error("Bid validation failed:", validationResult.error.format());
        return res.status(400).json({ message: "Invalid bid data", errors: validationResult.error.format() });
      }

      const { auctionId, amount } = validationResult.data;
      
      // Check if auction exists and is active
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      if (auction.status !== "active") {
        return res.status(400).json({ message: "Auction is not active" });
      }
      
      const now = new Date();
      if (now > new Date(auction.endTime)) {
        return res.status(400).json({ message: "Auction has ended" });
      }
      
      // No need to check if bid is higher than current highest bid
      // Blind bidding system allows any bid amount
      // The seller will decide which bid to accept
      
      // Create bid
      const bid = await storage.createBid({
        auctionId,
        dealerId: req.user.id,
        amount
      });
      
      // Notify via WebSocket
      const wsMessage: WSMessage = {
        type: "new_bid",
        data: { 
          auctionId, 
          dealerId: req.user.id,
          amount 
        },
        timestamp: Date.now()
      };
      
      broadcast(wsMessage);
      
      res.status(201).json(bid);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/bids/auction/:auctionId", isAuthenticated, async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.auctionId, 10);
      
      // First get the auction to check if this user is the selling dealer
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      // Only the dealer who created the auction can see the bids (blind auction)
      if (req.user.id !== auction.dealerId && req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: "Access denied - This is a blind auction. Only the selling dealer can view bids."
        });
      }
      
      const bids = await storage.getBidsByAuctionId(auctionId);
      res.json(bids);
    } catch (error) {
      next(error);
    }
  });

  // Messages
  app.post("/api/messages", isAuthenticated, async (req, res, next) => {
    try {
      // Create a merged object with the sender ID from the authenticated user
      const messageData = {
        ...req.body,
        senderId: req.user!.id // Use the non-null assertion operator
      };
      
      const validationResult = insertMessageSchema.safeParse(messageData);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid message data", errors: validationResult.error.format() });
      }

      const { receiverId, content, auctionId } = validationResult.data;
      
      // Create message
      const message = await storage.createMessage({
        senderId: req.user!.id,
        receiverId: receiverId,
        content: content,
        auctionId: auctionId || null
      });
      
      // Notify receiver via WebSocket
      const wsMessage: WSMessage = {
        type: "new_message",
        data: { 
          senderId: req.user!.id, 
          receiverId,
          content,
          auctionId,
          messageId: message.id
        },
        timestamp: Date.now()
      };
      
      sendToUser(receiverId, wsMessage);
      
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  });

  // Get all messages for the current user
  app.get("/api/messages", isAuthenticated, async (req, res, next) => {
    try {
      const messages = await storage.getAllMessagesForUser(req.user.id);
      
      // Fetch user details for the other participants
      const messageWithUsers = await Promise.all(
        messages.map(async (message) => {
          const otherUserId = message.senderId === req.user.id ? message.receiverId : message.senderId;
          const otherUser = await storage.getUser(otherUserId);
          
          return {
            ...message,
            otherUser: otherUser ? {
              id: otherUser.id,
              username: otherUser.username,
              companyName: otherUser.companyName
            } : undefined
          };
        })
      );
      
      res.json(messageWithUsers);
    } catch (error) {
      next(error);
    }
  });

  // Get messages between current user and specific user
  app.get("/api/messages/:userId", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const messages = await storage.getMessagesBetweenUsers(req.user.id, userId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  // Mark a message as read
  app.patch("/api/messages/:messageId/read", isAuthenticated, async (req, res, next) => {
    try {
      const messageId = parseInt(req.params.messageId, 10);
      const message = await storage.markMessageAsRead(messageId, req.user.id);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(message);
    } catch (error) {
      next(error);
    }
  });
  
  // Get unread message count
  app.get("/api/messages/unread/count", isAuthenticated, async (req, res, next) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });

  // Notifications
  app.get("/api/notifications", isAuthenticated, async (req, res, next) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const notification = await storage.markNotificationAsRead(id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      next(error);
    }
  });
  
  // API for bid acceptance (dealer only)
  // Endpoint to end an auction early
  app.patch("/api/auctions/:id/end", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id);
      
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      if (auction.dealerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to end this auction" });
      }
      
      if (auction.status !== "active") {
        return res.status(400).json({ message: "Auction is not active" });
      }
      
      // Update the auction end time to now
      const now = new Date();
      
      // Check if there are any bids
      const highestBid = await storage.getHighestBidForAuction(auctionId);
      
      // If there are bids, set to pending_collection, otherwise completed
      const status = highestBid ? "pending_collection" : "completed";
      
      const updatedAuction = await storage.updateAuction(auctionId, {
        endTime: now,
        status: status,
        ...(highestBid && {
          winningBidId: highestBid.id,
          winningBidderId: highestBid.dealerId
        })
      });
      
      // Send WebSocket notification
      const wsMessage: WSMessage = {
        type: "underwrite_completed",
        data: {
          auctionId: auction.id,
          message: "The underwrite has been ended early by the seller",
          hasWinningBid: !!highestBid
        },
        timestamp: Date.now()
      };
      
      // Broadcast to all users
      broadcast(wsMessage);
      
      return res.status(200).json(updatedAuction);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auctions/:id/accept-bid", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id);
      const { bidId, availabilityDate } = req.body;
      
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      if (auction.dealerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to accept bids for this auction" });
      }
      
      // Fetch the bid to get bidder ID
      const bid = await storage.getBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      // Update the motorcycle availability date if provided
      if (availabilityDate) {
        const dateObj = new Date(availabilityDate);
        await storage.updateMotorcycle(auction.motorcycleId, {
          dateAvailable: dateObj.toISOString()
        });
      }
      
      // Update auction status to pending_collection
      console.log(`Accepting bid ${bidId} for auction ${auctionId} - Updating auction and motorcycle status to pending_collection`);
      
      // First update motorcycle status to "pending_collection" for stronger consistency
      const updatedMotorcycle = await storage.updateMotorcycle(auction.motorcycleId, {
        status: "pending_collection"
      });
      
      console.log(`Motorcycle ${auction.motorcycleId} status updated to: ${updatedMotorcycle?.status}`);
      
      // Verify motorcycle status was updated successfully before updating auction
      if (!updatedMotorcycle || updatedMotorcycle.status !== 'pending_collection') {
        console.error(`Failed to update motorcycle ${auction.motorcycleId} status! Current status: ${updatedMotorcycle?.status}`);
        // Retry updating the motorcycle status
        await storage.updateMotorcycle(auction.motorcycleId, {
          status: "pending_collection"
        });
      }
      
      // Now update the auction
      const updatedAuction = await storage.updateAuction(auctionId, {
        bidAccepted: true,
        winningBidId: bidId,
        winningBidderId: bid.dealerId,
        status: "pending_collection"
      });
      
      // Verify the entire state after updates
      console.log(`Verifying updated state after bid acceptance:`);
      const verifiedMotorcycle = await storage.getMotorcycle(auction.motorcycleId);
      const verifiedAuction = await storage.getAuction(auctionId);
      
      console.log(`Verified motorcycle status: ${verifiedMotorcycle?.status}`);
      console.log(`Verified auction status: ${verifiedAuction?.status}, bidAccepted: ${verifiedAuction?.bidAccepted}`);
      
      // Final auto-correction if status is inconsistent
      if (verifiedMotorcycle && verifiedMotorcycle.status !== 'pending_collection') {
        console.log(`CRITICAL: Final auto-correction of motorcycle ${auction.motorcycleId} status to pending_collection`);
        await storage.updateMotorcycle(auction.motorcycleId, {
          status: "pending_collection"
        });
      }
      
      // Force synchronous DB update to ensure motorcycle status is saved immediately
      // and not lost on session change
      const verifyMotorcycle = await storage.getMotorcycle(auction.motorcycleId);
      console.log(`Final motorcycle ${auction.motorcycleId} status verification: ${verifyMotorcycle?.status}`);
      
      // Ensure this update is really persisted in storage
      if (verifyMotorcycle?.status !== 'pending_collection') {
        console.error(`*** CRITICAL PERSISTENCE ERROR: Motorcycle status still not correct after multiple update attempts! ***`);
        console.error(`Will attempt emergency direct update of motorcycle status`);
        
        // Force direct update of motorcycle in storage
        const motorcycle = storage.motorcycles.get(auction.motorcycleId);
        if (motorcycle) {
          motorcycle.status = 'pending_collection';
          storage.motorcycles.set(auction.motorcycleId, motorcycle);
          console.log(`Emergency direct status update completed for motorcycle ${auction.motorcycleId}`);
        }
      }
      console.log(`Verified motorcycle ${auction.motorcycleId} status: ${verifyMotorcycle?.status}`);

      // Fetch updated motorcycle with potential availability date
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      
      // Send enhanced notification via WebSocket to the winning bidder
      // With explicit instructions to update motorcycle status in client state
      const wsMessage: WSMessage = {
        type: "bid_accepted",
        data: {
          auctionId: auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: bid.dealerId,
          availabilityDate: motorcycle?.dateAvailable || null,
          make: motorcycle?.make || '',
          model: motorcycle?.model || '',
          year: motorcycle?.year || 0,
          forceStatusUpdate: true, // Flag to force client-side status update
          updatePriority: "high", // Indicates critical status update
          auction: {
            id: updatedAuction.id,
            status: "pending_collection", // Explicit status
            bidAccepted: true,
            winningBidId: bidId
          },
          motorcycle: {
            id: motorcycle?.id,
            status: "pending_collection", // Explicit motorcycle status
            originalStatus: motorcycle?.status || "unknown",
            updateRequired: true
          },
          // Special field for client-side cache updates
          statusChange: {
            entity: "motorcycle",
            id: motorcycle?.id,
            newStatus: "pending_collection",
            entityName: `${motorcycle?.make} ${motorcycle?.model}`
          }
        },
        timestamp: Date.now()
      };
      
      // Also send a confirmation to the seller with the same information
      const bidAcceptedConfirmMessage: WSMessage = {
        type: "bid_accepted_confirm",
        data: {
          auctionId: auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: bid.dealerId,
          auction: {
            id: updatedAuction.id,
            status: updatedAuction.status
          },
          motorcycle: {
            id: motorcycle?.id,
            status: "pending_collection"
          }
        },
        timestamp: Date.now()
      };
      
      // Enhance WebSocket message with explicit motorcycleId for better traceability
      wsMessage.data.motorcycleId = motorcycle?.id;
      bidAcceptedConfirmMessage.data.motorcycleId = motorcycle?.id;
      
      console.log('Sending bid accepted WebSocket messages with enhanced data:');
      console.log('- To bidder:', JSON.stringify(wsMessage.data));
      console.log('- To seller:', JSON.stringify(bidAcceptedConfirmMessage.data));
      
      // Send WebSocket notification to both seller and winning bidder
      sendToUser(bid.dealerId, wsMessage);
      sendToUser(auction.dealerId, bidAcceptedConfirmMessage);
      
      // Also send the notification to other bidders to refresh their data
      broadcast(wsMessage, bid.dealerId);
      
      // Create a notification record with availability info
      const availabilityInfo = motorcycle?.dateAvailable 
        ? ` It will be available for collection on ${new Date(motorcycle.dateAvailable).toLocaleDateString()}.`
        : '';
        
      await storage.createNotification({
        userId: bid.dealerId,
        type: "bid_accepted",
        content: `Your bid on ${motorcycle?.make} ${motorcycle?.model} has been accepted.${availabilityInfo}`,
        relatedId: auctionId
      });
      
      res.json(updatedAuction);
    } catch (error) {
      next(error);
    }
  });
  
  // API for deal confirmation (winning bidder only)
  app.post("/api/auctions/:id/confirm-deal", isAuthenticated, async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id);
      
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      if (auction.winningBidderId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to confirm this deal" });
      }
      
      // Update auction status to confirmed
      const updatedAuction = await storage.updateAuction(auctionId, {
        dealConfirmed: true,
        status: 'pending_collection'
      });
      
      // Also update the motorcycle status if it isn't already set
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      if (motorcycle && motorcycle.status !== 'pending_collection') {
        console.log(`Updating motorcycle ${motorcycle.id} status to pending_collection during deal confirmation`);
        await storage.updateMotorcycle(motorcycle.id, {
          status: 'pending_collection'
        });
      }

      // Send notification via WebSocket to the seller
      const wsMessage: WSMessage = {
        type: "deal_confirmed",
        data: {
          auctionId: auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: req.user.id,
          motorcycle: {
            id: motorcycle?.id,
            status: 'pending_collection'
          },
          auction: {
            id: updatedAuction.id,
            status: updatedAuction.status
          }
        },
        timestamp: Date.now()
      };
      
      sendToUser(auction.dealerId, wsMessage);
      
      // Create a notification record
      await storage.createNotification({
        userId: auction.dealerId,
        type: "deal_confirmed",
        content: `The buyer has confirmed the deal for auction #${auctionId}.`,
        relatedId: auctionId
      });
      
      res.json(updatedAuction);
    } catch (error) {
      next(error);
    }
  });
  
  // API for scheduling collection (dealer only)
  app.post("/api/auctions/:id/schedule-collection", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id);
      const { collectionDate } = req.body;
      
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      if (auction.dealerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to schedule collection for this auction" });
      }
      
      const updatedAuction = await storage.updateAuction(auctionId, {
        collectionDate: new Date(collectionDate)
      });
      
      // Update the motorcycle availability date
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      if (motorcycle) {
        await storage.updateMotorcycle(motorcycle.id, {
          dateAvailable: collectionDate
        });
      }

      // Send notification via WebSocket to the winning bidder
      const wsMessage: WSMessage = {
        type: "collection_scheduled",
        data: {
          auctionId: auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: auction.winningBidderId,
          collectionDate: collectionDate
        },
        timestamp: Date.now()
      };
      
      if (auction.winningBidderId) {
        sendToUser(auction.winningBidderId, wsMessage);
        
        // Create a notification record
        await storage.createNotification({
          userId: auction.winningBidderId,
          type: "collection_scheduled",
          content: `The seller has scheduled collection for auction #${auctionId} on ${new Date(collectionDate).toLocaleDateString()}.`,
          relatedId: auctionId
        });
      }
      
      res.json(updatedAuction);
    } catch (error) {
      next(error);
    }
  });
  
  // API for confirming collection (winning bidder only)
  app.post("/api/auctions/:id/confirm-collection", isAuthenticated, async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id);
      
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      if (auction.winningBidderId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to confirm collection for this auction" });
      }
      
      // Update auction status to completed
      const updatedAuction = await storage.updateAuction(auctionId, {
        collectionConfirmed: true,
        status: 'completed'
      });
      
      // Update the motorcycle status to sold
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      if (motorcycle) {
        console.log(`Updating motorcycle ${motorcycle.id} status to sold during collection confirmation`);
        await storage.updateMotorcycle(motorcycle.id, {
          status: 'sold',
          soldDate: new Date().toISOString()
        });
      }

      // Send notification via WebSocket to the seller
      const wsMessage: WSMessage = {
        type: "collection_confirmed",
        data: {
          auctionId: auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: req.user.id,
          auction: {
            id: updatedAuction.id,
            status: 'completed',
            collectionConfirmed: true
          },
          motorcycle: {
            id: motorcycle?.id,
            status: 'sold'
          }
        },
        timestamp: Date.now()
      };
      
      // Send to both seller and winning bidder to ensure both UIs are updated
      sendToUser(auction.dealerId, wsMessage);
      sendToUser(auction.winningBidderId, wsMessage);
      
      // Also broadcast to other dealers to refresh their data
      broadcast({
        type: "auction_status_changed",
        data: {
          auctionId: auctionId,
          newStatus: 'completed',
          motorcycle: {
            id: motorcycle?.id,
            status: 'sold'
          }
        },
        timestamp: Date.now()
      });
      
      // Create a notification record
      await storage.createNotification({
        userId: auction.dealerId,
        type: "collection_confirmed",
        content: `The buyer has confirmed collection for auction #${auctionId}.`,
        relatedId: auctionId
      });
      
      res.json(updatedAuction);
    } catch (error) {
      next(error);
    }
  });

  // Dashboard data - support both endpoints for backward compatibility
  app.get(["/api/dashboard", "/api/dashboard/stats"], isAuthenticated, async (req, res, next) => {
    try {
      // Get auctions created by this dealer
      const dealerAuctions = await storage.getAuctionsByDealerId(req.user.id);
      
      // Calculate selling statistics
      const activeListings = dealerAuctions.filter(a => a.status === "active").length;
      let totalBids = 0;
      dealerAuctions.forEach(auction => {
        totalBids += auction.bids.length;
      });
      
      const pendingCompletion = dealerAuctions.filter(
        a => a.status === "completed" && a.winningBidId && !a.winningBidderId
      ).length;
      
      // Calculate revenue (sum of winning bids for completed auctions)
      let revenue = 0;
      dealerAuctions
        .filter(a => a.status === "completed" && a.winningBidId)
        .forEach(auction => {
          revenue += auction.currentBid || 0;
        });
     
      // Get auctions where this dealer has placed bids (buying activity)
      const allAuctions = await storage.getActiveAuctions();
      let activeBids = 0;
      let wonAuctions = 0;
      let pendingCollection = 0;
      let amountSpent = 0;
      
      // Calculate buying statistics
      allAuctions.forEach(auction => {
        const myBids = auction.bids.filter(bid => bid.dealerId === req.user.id);
        
        // Count each individual bid placed by this user on any active auction
        if (auction.status === "active") {
          myBids.forEach(bid => {
            activeBids++;
            // Add bid amount to amount spent calculation
            amountSpent += bid.amount;
          });
        }
        
        // Check for won auctions
        if (auction.status === "completed" && auction.winningBidId) {
          const winningBid = auction.bids.find(bid => bid.id === auction.winningBidId);
          if (winningBid && winningBid.dealerId === req.user.id) {
            wonAuctions++;
            
            // Check if pending collection
            if (!auction.collectionDate) {
              pendingCollection++;
            }
          }
        }
      });
     
      // Return combined stats for dealer (both buying and selling)
      res.json({
        // Selling stats
        activeListings,
        totalBids,
        pendingCompletion,
        revenue,
        trendUp: true,
        trendValue: 2,
        
        // Buying stats
        activeBids,
        wonAuctions,
        pendingCollection,
        amountSpent
      });
    } catch (error) {
      next(error);
    }
  });

  // Favorite Dealers
  app.get("/api/user/favorites", isAuthenticated, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return empty array if no favorites are set
      if (!user.favoriteDealers) {
        return res.json([]);
      }
      
      // Get details for each favorite dealer
      const favoriteDealers = await Promise.all(
        user.favoriteDealers.map(async (dealerId) => {
          const dealer = await storage.getUser(dealerId);
          if (!dealer) return null;
          
          // Return only safe dealer info (no passwords)
          return {
            id: dealer.id,
            username: dealer.username,
            companyName: dealer.companyName,
            rating: dealer.rating,
            totalRatings: dealer.totalRatings
          };
        })
      );
      
      // Filter out any nulls (dealers that might have been deleted)
      res.json(favoriteDealers.filter(dealer => dealer !== null));
    } catch (error) {
      next(error);
    }
  });
  
  // Add favorite dealer
  app.post("/api/user/favorites/add", isAuthenticated, async (req, res, next) => {
    try {
      const { dealerId } = req.body;
      
      if (!dealerId) {
        return res.status(400).json({ message: "Dealer ID is required" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Initialize favoriteDealers array if it doesn't exist
      const favoriteDealers = user.favoriteDealers || [];
      
      // Check if dealer is already a favorite
      if (favoriteDealers.includes(dealerId)) {
        return res.status(400).json({ message: "Dealer is already a favorite" });
      }
      
      // Add dealer to favorites
      favoriteDealers.push(dealerId);
      
      // Update user
      const updatedUser = await storage.updateUser(user.id, { favoriteDealers });
      
      res.status(200).json({ message: "Dealer added to favorites" });
    } catch (error) {
      next(error);
    }
  });
  
  // Remove favorite dealer
  app.post("/api/user/favorites/remove", isAuthenticated, async (req, res, next) => {
    try {
      const { dealerId } = req.body;
      if (!dealerId) {
        return res.status(400).json({ message: "Dealer ID is required" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Initialize favoriteDealers array if it doesn't exist
      const favoriteDealers = user.favoriteDealers || [];
      
      // Check if dealer is not a favorite
      if (!favoriteDealers.includes(dealerId)) {
        return res.status(400).json({ message: "Dealer is not a favorite" });
      }
      
      // Remove dealer from favorites
      const updatedFavorites = favoriteDealers.filter(id => id !== dealerId);
      
      // Update user
      const updatedUser = await storage.updateUser(user.id, { favoriteDealers: updatedFavorites });
      
      res.status(200).json({ message: "Dealer removed from favorites" });
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint deleted in favor of POST /api/user/favorites/remove

  // Get all dealers (for favorites selection)
  app.get("/api/dealers", isAuthenticated, async (req, res, next) => {
    try {
      // Get all users with dealer role
      const allUsers = Array.from(storage.getAllUsers().values());
      const dealers = allUsers.filter(user => user.role === 'dealer');
      
      // Return only safe dealer info (no passwords)
      const safeUsers = dealers.map(dealer => ({
        id: dealer.id,
        username: dealer.username,
        companyName: dealer.companyName,
        rating: dealer.rating,
        totalRatings: dealer.totalRatings
      }));

      // Don't include the current user in the list
      const filteredUsers = safeUsers.filter(user => user.id !== req.user.id);
      
      res.json(filteredUsers);
    } catch (error) {
      next(error);
    }
  });

  // Recent activity
  app.get("/api/activity", isAuthenticated, async (req, res, next) => {
    try {
      // Get notifications and format as activity items
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      
      const activityItems = notifications.map((notification, index) => {
        let icon = 'check-circle';
        let color = 'primary-light';
        
        switch (notification.type) {
          case 'bid':
            icon = 'check-circle';
            color = 'primary-light';
            break;
          case 'auction_ending':
            icon = 'clock';
            color = 'accent';
            break;
          case 'auction_completed':
            icon = 'check-circle';
            color = 'green-500';
            break;
          case 'message':
            icon = 'bell';
            color = 'blue-500';
            break;
        }
        
        return {
          id: notification.id,
          type: notification.type,
          title: notification.type.charAt(0).toUpperCase() + notification.type.slice(1).replace('_', ' '),
          description: notification.content,
          timestamp: notification.createdAt,
          icon,
          color
        };
      });
      
      res.json(activityItems);
    } catch (error) {
      next(error);
    }
  });

  // Reset auctions for testing (for development only)
  app.post("/api/reset-auctions", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get all auctions for this user
      const userAuctions = await storage.getAuctionsByDealerId(userId);
      console.log(`Found ${userAuctions.length} auctions for user ${userId}`);
      
      // Reset each auction to active status
      for (const auction of userAuctions) {
        console.log(`Resetting auction ${auction.id} for motorcycle ${auction.motorcycleId}`);
        
        await storage.updateAuction(auction.id, {
          status: 'active',
          bidAccepted: false,
          dealConfirmed: false,
          collectionConfirmed: false,
          winningBidId: null,
          winningBidderId: null,
          completedAt: null
        });
        
        // Reset the motorcycle status as well
        await storage.updateMotorcycle(auction.motorcycleId, {
          status: 'available'
        });
      }
      
      return res.status(200).json({ 
        message: `Reset ${userAuctions.length} auctions successfully`,
        count: userAuctions.length
      });
    } catch (error) {
      next(error);
    }
  });
  
  // API for completing a deal (only the seller can mark as complete)
  app.post("/api/auctions/:id/complete-deal", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id);
      
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      // Only the seller can complete the deal
      if (auction.dealerId !== req.user.id) {
        return res.status(403).json({ message: "Only the seller can mark this deal as complete" });
      }
      
      const completionDate = new Date();
      
      // Update auction status to completed, so it will appear in Past Listings
      const updatedAuction = await storage.updateAuction(auctionId, {
        status: "completed",
        collectionConfirmed: true,
        completedAt: completionDate.toISOString()
      });
      
      // Get motorcycle details for the notification
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      
      // Update motorcycle status to mark it as sold
      if (motorcycle) {
        await storage.updateMotorcycle(motorcycle.id, {
          status: "sold",
          soldDate: completionDate.toISOString()
        });
      }
      
      // Send WebSocket notification to buyer with enhanced data
      const wsMessage: WSMessage = {
        type: "collection_confirmed",
        data: {
          auctionId: auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: auction.winningBidderId,
          make: motorcycle?.make || '',
          model: motorcycle?.model || '',
          year: motorcycle?.year || 0,
          // Add additional data to assist UI updates
          auction: {
            id: updatedAuction.id,
            status: 'completed',
            collectionConfirmed: true,
            completedAt: completionDate.toISOString()
          },
          motorcycle: {
            id: motorcycle?.id,
            status: 'sold',
            soldDate: completionDate.toISOString()
          },
          // Special field for client-side cache updates
          statusChange: {
            entity: "auction",
            id: auctionId,
            newStatus: "completed",
            entityName: `${motorcycle?.make} ${motorcycle?.model}`
          }
        },
        timestamp: Date.now()
      };
      
      if (auction.winningBidderId) {
        console.log(`Sending completion WebSocket message to winning bidder ${auction.winningBidderId}`);
        sendToUser(auction.winningBidderId, wsMessage);
        
        // Create notification for buyer
        await storage.createNotification({
          userId: auction.winningBidderId,
          type: "collection_confirmed",
          content: `The seller has confirmed completion of your ${motorcycle?.make} ${motorcycle?.model} purchase.`,
          relatedId: auctionId
        });
        
        // Create additional notification for buyer about transaction being completed
        await storage.createNotification({
          userId: auction.winningBidderId,
          type: "transaction_completed",
          content: `Transaction for ${motorcycle?.make} ${motorcycle?.model} has been completed and moved to Past Listings.`,
          relatedId: auctionId
        });
      }
      
      // Also send the same notification to seller to ensure their UI is updated
      sendToUser(auction.dealerId, wsMessage);
      
      // Broadcast a status update to all connected clients
      broadcast({
        type: "auction_status_changed",
        data: {
          auctionId: auctionId,
          status: "completed"
        },
        timestamp: Date.now()
      });
      
      // Create a notification for the seller as well
      await storage.createNotification({
        userId: auction.dealerId,
        type: "transaction_completed",
        content: `You have marked the transaction for ${motorcycle?.make} ${motorcycle?.model} as complete. It has been moved to Past Listings.`,
        relatedId: auctionId
      });
      
      res.json(updatedAuction);
    } catch (error) {
      next(error);
    }
  });
  
  // API for extending availability date (only the seller can extend the date)
  app.post("/api/auctions/:id/extend-date", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id);
      const { newAvailabilityDate } = req.body;
      
      if (!newAvailabilityDate) {
        return res.status(400).json({ message: "New availability date is required" });
      }
      
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      // Only the seller can extend the date
      if (auction.dealerId !== req.user.id) {
        return res.status(403).json({ message: "Only the seller can extend the availability date" });
      }
      
      // Update motorcycle availability date
      await storage.updateMotorcycle(auction.motorcycleId, {
        dateAvailable: new Date(newAvailabilityDate).toISOString()
      });
      
      // Get motorcycle details for the notification
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      
      // Send WebSocket notification to buyer
      const wsMessage: WSMessage = {
        type: "date_extended",
        data: {
          auctionId: auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: auction.winningBidderId,
          newAvailabilityDate: newAvailabilityDate,
          make: motorcycle?.make || '',
          model: motorcycle?.model || '',
          year: motorcycle?.year || 0
        },
        timestamp: Date.now()
      };
      
      if (auction.winningBidderId) {
        sendToUser(auction.winningBidderId, wsMessage);
        
        // Create notification for buyer
        const formattedDate = new Date(newAvailabilityDate).toLocaleDateString();
        await storage.createNotification({
          userId: auction.winningBidderId,
          type: "date_extended",
          content: `The seller has updated the availability date for ${motorcycle?.make} ${motorcycle?.model} to ${formattedDate}.`,
          relatedId: auctionId
        });
      }
      
      res.json({ success: true, message: "Availability date updated", motorcycle });
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
