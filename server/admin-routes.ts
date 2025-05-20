import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Middleware to verify if user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Not authorized. Admin access required." });
  }
  
  next();
};

// Register admin routes
export function setupAdminRoutes(app: Express) {
  // Get all dealers
  app.get("/api/admin/dealers", isAdmin, async (req: Request, res: Response) => {
    try {
      // Get all users from storage
      const usersMap = storage.getAllUsers();
      const users = Array.from(usersMap.values());
      
      // Remove sensitive information
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching dealers:", error);
      res.status(500).json({ message: "Failed to fetch dealers" });
    }
  });

  // Get all motorcycles
  app.get("/api/admin/motorcycles", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = storage.getAllUsers();
      const allMotorcycles = [];
      
      // Collect motorcycles from all dealers
      for (const [userId, user] of users) {
        const motorcycles = await storage.getMotorcyclesByDealerId(userId);
        allMotorcycles.push(...motorcycles);
      }
      
      res.json(allMotorcycles);
    } catch (error) {
      console.error("Error fetching motorcycles:", error);
      res.status(500).json({ message: "Failed to fetch motorcycles" });
    }
  });

  // Get all auctions
  app.get("/api/admin/auctions", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = storage.getAllUsers();
      const allAuctions = [];
      
      // Collect auctions from all dealers
      for (const [userId, user] of users) {
        const auctions = await storage.getAuctionsByDealerId(userId);
        allAuctions.push(...auctions);
      }
      
      res.json(allAuctions);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      res.status(500).json({ message: "Failed to fetch auctions" });
    }
  });

  // Get all messages (only headers, not content for privacy)
  app.get("/api/admin/messages", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = storage.getAllUsers();
      const messageStats = [];
      
      // Collect message stats for all users
      for (const [userId, user] of users) {
        const unreadCount = await storage.getUnreadMessageCount(userId);
        messageStats.push({
          userId,
          username: user.username,
          unreadCount
        });
      }
      
      res.json(messageStats);
    } catch (error) {
      console.error("Error fetching message stats:", error);
      res.status(500).json({ message: "Failed to fetch message stats" });
    }
  });
}