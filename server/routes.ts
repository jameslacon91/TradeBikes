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

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// Role-based authorization middleware
const hasRole = (role: string) => (req: any, res: any, next: any) => {
  if (req.user.role === role) {
    return next();
  }
  res.status(403).json({ message: "Not authorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = setupWebSocket(httpServer);

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
      if (req.user.role === "dealer") {
        const motorcycles = await storage.getMotorcyclesByDealerId(req.user.id);
        res.json(motorcycles);
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
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

      // Notify potential traders via WebSocket
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
      const activeAuctions = await storage.getActiveAuctions();
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
  app.post("/api/motorcycles", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const validationResult = insertMotorcycleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid motorcycle data", errors: validationResult.error.format() });
      }
      
      // Add dealer ID from logged in user
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
  app.post("/api/auctions", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const validationResult = insertAuctionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid auction data", errors: validationResult.error.format() });
      }
      
      const { motorcycleId, startingPrice, reservePrice, startTime, endTime } = validationResult.data;
      
      // Verify motorcycle exists and belongs to dealer
      const motorcycle = await storage.getMotorcycle(motorcycleId);
      if (!motorcycle) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }
      
      if (motorcycle.dealerId !== req.user.id) {
        return res.status(403).json({ message: "You can only create auctions for your own motorcycles" });
      }
      
      // Create auction
      const auction = await storage.createAuction({
        motorcycleId,
        dealerId: req.user.id,
        startingPrice,
        reservePrice,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "active",
        winningBidId: null,
        winningTraderId: null
      });
      
      res.status(201).json(auction);
    } catch (error) {
      next(error);
    }
  });

  // Bids
  app.post("/api/bids", isAuthenticated, hasRole("trader"), async (req, res, next) => {
    try {
      const validationResult = insertBidSchema.safeParse(req.body);
      if (!validationResult.success) {
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
        traderId: req.user.id,
        amount
      });
      
      // Notify via WebSocket
      const wsMessage: WSMessage = {
        type: "new_bid",
        data: { 
          auctionId, 
          traderId: req.user.id,
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

  app.get("/api/bids/auction/:auctionId", async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.auctionId, 10);
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

  // Dashboard data
  app.get("/api/dashboard", isAuthenticated, async (req, res, next) => {
    try {
      if (req.user.role === "dealer") {
        const auctions = await storage.getAuctionsByDealerId(req.user.id);
        
        // Calculate statistics
        const activeListings = auctions.filter(a => a.status === "active").length;
        let totalBids = 0;
        auctions.forEach(auction => {
          totalBids += auction.bids.length;
        });
        
        const pendingCompletion = auctions.filter(
          a => a.status === "completed" && a.winningBidId && !a.winningTraderId
        ).length;
        
        // Calculate revenue (sum of winning bids for completed auctions)
        let revenue = 0;
        auctions
          .filter(a => a.status === "completed" && a.winningBidId)
          .forEach(auction => {
            revenue += auction.currentBid || 0;
          });
        
        res.json({
          activeListings,
          totalBids,
          pendingCompletion,
          revenue,
          trendUp: true,
          trendValue: 2
        });
      } else if (req.user.role === "trader") {
        // Get all bids by trader
        let totalBids = 0;
        let wonAuctions = 0;
        let pendingCollection = 0;
        let amountSpent = 0;
        
        // Here we would typically query for trader-specific stats
        // Since we're using in-memory storage, we'll need to iterate through auctions
        const allAuctions = await storage.getActiveAuctions();
        const traderBids = new Map();
        
        allAuctions.forEach(auction => {
          auction.bids.forEach(bid => {
            if (bid.traderId === req.user.id) {
              if (!traderBids.has(auction.id)) {
                traderBids.set(auction.id, []);
              }
              traderBids.get(auction.id).push(bid);
              totalBids++;
            }
          });
          
          if (auction.status === "completed" && auction.winningTraderId === req.user.id) {
            wonAuctions++;
            // In a real app, we would track if the bike has been collected
            pendingCollection++;
            if (auction.currentBid) {
              amountSpent += auction.currentBid;
            }
          }
        });
        
        res.json({
          activeBids: traderBids.size,
          totalBids,
          wonAuctions,
          pendingCollection,
          amountSpent,
          trendUp: true,
          trendValue: 3
        });
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
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
