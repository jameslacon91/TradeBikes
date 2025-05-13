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
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// Role-based authorization middleware
// Since all users are dealers now, this simply passes through, but is kept for future role differentiation
const hasRole = (role: string) => (req: Request, res: Response, next: NextFunction) => {
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
      const validationResult = insertAuctionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid auction data", errors: validationResult.error.format() });
      }

      const auction = await storage.createAuction({
        ...validationResult.data,
        dealerId: req.user.id
      });

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
  app.post("/api/auctions", isAuthenticated, hasRole("dealer"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = insertAuctionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid auction data", errors: validationResult.error.format() });
      }
      
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { motorcycleId, startTime, endTime, visibilityType, visibilityRadius } = validationResult.data;
      
      // Verify motorcycle exists and belongs to dealer
      const motorcycle = await storage.getMotorcycle(motorcycleId);
      if (!motorcycle) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }
      
      if (motorcycle.dealerId !== req.user.id) {
        return res.status(403).json({ message: "You can only create auctions for your own motorcycles" });
      }
      
      // Parse dates properly if they're provided as strings
      const startTimeDate = startTime ? new Date(startTime) : new Date();
      const endTimeDate = new Date(endTime);
      
      // Create auction with visibility options
      const auction = await storage.createAuction({
        motorcycleId,
        dealerId: req.user.id,
        startTime: startTimeDate,
        endTime: endTimeDate,
        visibilityType: visibilityType || 'all', // Default to showing all dealers
        visibilityRadius: visibilityType === 'radius' ? visibilityRadius : null
      });
      
      res.status(201).json(auction);
    } catch (error) {
      next(error);
    }
  });

  // Bids
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
      
      // Check if bid is higher than current highest bid
      const highestBid = await storage.getHighestBidForAuction(auctionId);
      if (highestBid && amount <= highestBid.amount) {
        return res.status(400).json({ message: "Bid must be higher than current highest bid" });
      }
      
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
      const validationResult = insertMessageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid message data", errors: validationResult.error.format() });
      }

      const { receiverId, content, auctionId } = validationResult.data;
      
      // Create message
      const message = await storage.createMessage({
        senderId: req.user.id,
        receiverId,
        content,
        auctionId
      });
      
      // Notify receiver via WebSocket
      const wsMessage: WSMessage = {
        type: "new_message",
        data: { 
          senderId: req.user.id, 
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

  app.get("/api/messages/:userId", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const messages = await storage.getMessagesBetweenUsers(req.user.id, userId);
      res.json(messages);
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
      
      // Update the auction end time to now and mark as completed
      const now = new Date();
      const updatedAuction = await storage.updateAuction(auctionId, {
        endTime: now,
        status: "completed"
      });
      
      // Send WebSocket notification
      const wsMessage: WSMessage = {
        type: "auction_completed",
        data: {
          auctionId: auction.id,
          message: "The auction has been ended early by the seller",
        },
        timestamp: new Date().toISOString()
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
      
      const updatedAuction = await storage.updateAuction(auctionId, {
        bidAccepted: true,
        winningBidId: bidId,
        winningBidderId: bid.dealerId,
        status: "completed"
      });

      // Fetch updated motorcycle with potential availability date
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      
      // Send notification via WebSocket to the winning bidder
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
          year: motorcycle?.year || 0
        },
        timestamp: Date.now()
      };
      
      sendToUser(bid.dealerId, wsMessage);
      
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
      
      const updatedAuction = await storage.updateAuction(auctionId, {
        dealConfirmed: true
      });

      // Send notification via WebSocket to the seller
      const wsMessage: WSMessage = {
        type: "deal_confirmed",
        data: {
          auctionId: auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: req.user.id
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
      
      const updatedAuction = await storage.updateAuction(auctionId, {
        collectionConfirmed: true
      });

      // Send notification via WebSocket to the seller
      const wsMessage: WSMessage = {
        type: "collection_confirmed",
        data: {
          auctionId: auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: req.user.id
        },
        timestamp: Date.now()
      };
      
      sendToUser(auction.dealerId, wsMessage);
      
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

  // Dashboard data
  app.get("/api/dashboard", isAuthenticated, async (req, res, next) => {
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
        
        if (myBids.length > 0) {
          // Check for active bids
          if (auction.status === "active") {
            activeBids += myBids.length;
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
              
              // Calculate amount spent
              amountSpent += winningBid.amount;
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
  app.get("/api/favorite-dealers", isAuthenticated, async (req, res, next) => {
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
  
  app.post("/api/favorite-dealers", isAuthenticated, async (req, res, next) => {
    try {
      const { dealerId } = req.body;
      if (!dealerId) {
        return res.status(400).json({ message: "dealerId is required" });
      }
      
      // Check if dealer exists
      const dealer = await storage.getUser(dealerId);
      if (!dealer) {
        return res.status(404).json({ message: "Dealer not found" });
      }
      
      // Get current user
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Initialize favorites array if it doesn't exist
      const currentFavorites = user.favoriteDealers || [];
      
      // Check if already in favorites
      if (currentFavorites.includes(dealerId)) {
        return res.status(400).json({ message: "Dealer already in favorites" });
      }
      
      // Add to favorites
      const updatedUser = await storage.updateUser(req.user.id, {
        favoriteDealers: [...currentFavorites, dealerId]
      });
      
      res.status(200).json({ message: "Dealer added to favorites" });
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/favorite-dealers/:dealerId", isAuthenticated, async (req, res, next) => {
    try {
      const dealerId = parseInt(req.params.dealerId, 10);
      
      // Get current user
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if favorites exist
      if (!user.favoriteDealers || !user.favoriteDealers.includes(dealerId)) {
        return res.status(400).json({ message: "Dealer not in favorites" });
      }
      
      // Remove from favorites
      const updatedUser = await storage.updateUser(req.user.id, {
        favoriteDealers: user.favoriteDealers.filter(id => id !== dealerId)
      });
      
      res.status(200).json({ message: "Dealer removed from favorites" });
    } catch (error) {
      next(error);
    }
  });

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

  return httpServer;
}
