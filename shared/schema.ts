import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (all users are dealers who can both sell and buy)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("dealer"), // All users are dealers
  companyName: text("company_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  postcode: text("postcode"),
  rating: integer("rating").default(0), // 0-5 rating
  totalRatings: integer("total_ratings").default(0),
  favoriteDealers: integer("favorite_dealers").array(), // Array of dealer IDs marked as favorites
  createdAt: timestamp("created_at").defaultNow(),
});

// Motorcycle listings
export const motorcycles = pgTable("motorcycles", {
  id: serial("id").primaryKey(),
  dealerId: integer("dealer_id").notNull(), // foreign key to users
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  mileage: integer("mileage").notNull(),
  color: text("color").notNull(),
  condition: text("condition").notNull(), // e.g. Excellent, Good, Fair, Poor
  engineSize: text("engine_size"), // e.g. 650cc
  description: text("description"),
  serviceHistory: text("service_history"),
  tyreCondition: text("tyre_condition"),
  dateAvailable: text("date_available"),
  regNumber: text("reg_number"),
  auctionDuration: text("auction_duration"), // "1day", "1week", "2weeks", "1month"
  images: text("images").array(), // URLs of uploaded images
  status: text("status").default("available"), // available, pending, sold
  soldDate: text("sold_date"), // Date when the motorcycle was sold
  createdAt: timestamp("created_at").defaultNow(),
});

// Auctions
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  motorcycleId: integer("motorcycle_id").notNull(), // foreign key to motorcycles
  dealerId: integer("dealer_id").notNull(), // foreign key to users (seller)
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("pending"), // pending, active, completed, cancelled
  winningBidId: integer("winning_bid_id"), // foreign key to bids
  winningBidderId: integer("winning_bidder_id"), // foreign key to users (winning dealer/buyer)
  bidAccepted: boolean("bid_accepted").default(false), // seller has accepted the winning bid
  dealConfirmed: boolean("deal_confirmed").default(false), // both parties confirmed the deal
  collectionConfirmed: boolean("collection_confirmed").default(false), // buyer has confirmed collection
  collectionDate: timestamp("collection_date"), // scheduled collection date
  highestBidderId: integer("highest_bidder_id"), // current highest bidder
  // New visibility options
  visibilityType: text("visibility_type").notNull().default("all"), // all, favorites, radius
  visibilityRadius: integer("visibility_radius"), // radius in miles (used when visibilityType is 'radius')
  completedAt: text("completed_at"), // Date when the deal was completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Bids
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(), // foreign key to auctions
  dealerId: integer("dealer_id").notNull(), // foreign key to users (the bidder)
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages between users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(), // foreign key to users
  receiverId: integer("receiver_id").notNull(), // foreign key to users
  auctionId: integer("auction_id"), // optional reference to an auction
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // foreign key to users
  type: text("type").notNull(), // e.g. "bid", "auction_ending", "auction_won"
  content: text("content").notNull(),
  relatedId: integer("related_id"), // related entity ID (auction, bid, etc.)
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true,
  rating: true,
  totalRatings: true 
});

export const insertMotorcycleSchema = createInsertSchema(motorcycles)
  .omit({ 
    id: true, 
    createdAt: true 
  })
  .extend({
    // Only make is required, rest are optional
    make: z.string().min(1, "Make is required"),
    model: z.string().optional(),
    year: z.number().int().positive("Year must be a positive number").optional(),
    mileage: z.number().int().nonnegative("Mileage must be a non-negative number").optional(),
    color: z.string().optional(),
    condition: z.string().optional(),
    engineSize: z.string().optional(),
    description: z.string().optional(),
    serviceHistory: z.string().optional(),
    tyreCondition: z.string().optional(),
    dateAvailable: z.string().optional(),
    regNumber: z.string().optional(),
    auctionDuration: z.string().optional(),
    images: z.array(z.string()).optional()
  });

export const insertAuctionSchema = createInsertSchema(auctions)
  .omit({ 
    id: true,
    createdAt: true,
    status: true,
    winningBidId: true,
    winningBidderId: true,
    bidAccepted: true,
    dealConfirmed: true,
    collectionConfirmed: true,
    highestBidderId: true
  })
  .extend({
    // Accept both string and Date types for dates
    startTime: z.union([
      z.string().transform(val => new Date(val)),
      z.date()
    ]),
    endTime: z.union([
      z.string().transform(val => new Date(val)),
      z.date()
    ])
  });

export const insertBidSchema = createInsertSchema(bids).omit({ 
  id: true, 
  createdAt: true 
});

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true,
  read: true,
  // Do not omit senderId - it's needed for message creation
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true,
  read: true 
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Motorcycle = typeof motorcycles.$inferSelect;
export type InsertMotorcycle = z.infer<typeof insertMotorcycleSchema>;

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;

export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
