import { users, motorcycles, auctions, bids, messages, notifications } from "@shared/schema";
import type { 
  User, InsertUser, 
  Motorcycle, InsertMotorcycle,
  Auction, InsertAuction,
  Bid, InsertBid,
  Message, InsertMessage,
  Notification, InsertNotification
} from "@shared/schema";
import { AuctionWithDetails } from "@shared/types";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Password hashing functions
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Motorcycle methods
  createMotorcycle(motorcycle: InsertMotorcycle): Promise<Motorcycle>;
  getMotorcycle(id: number): Promise<Motorcycle | undefined>;
  getMotorcyclesByDealerId(dealerId: number): Promise<Motorcycle[]>;
  updateMotorcycle(id: number, motorcycle: Partial<Motorcycle>): Promise<Motorcycle | undefined>;
  
  // Auction methods
  createAuction(auction: InsertAuction): Promise<Auction>;
  getAuction(id: number): Promise<Auction | undefined>;
  getAuctionWithDetails(id: number): Promise<AuctionWithDetails | undefined>;
  getActiveAuctions(): Promise<AuctionWithDetails[]>;
  getAuctionsByDealerId(dealerId: number): Promise<AuctionWithDetails[]>;
  updateAuction(id: number, auction: Partial<Auction>): Promise<Auction | undefined>;
  
  // Bid methods
  createBid(bid: InsertBid): Promise<Bid>;
  getBidsByAuctionId(auctionId: number): Promise<Bid[]>;
  getHighestBidForAuction(auctionId: number): Promise<Bid | undefined>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Helper methods
  comparePasswords(supplied: string, stored: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private motorcycles: Map<number, Motorcycle>;
  private auctions: Map<number, Auction>;
  private bids: Map<number, Bid>;
  private messages: Map<number, Message>;
  private notifications: Map<number, Notification>;
  
  private userId: number;
  private motorcycleId: number;
  private auctionId: number;
  private bidId: number;
  private messageId: number;
  private notificationId: number;

  constructor() {
    this.users = new Map();
    this.motorcycles = new Map();
    this.auctions = new Map();
    this.bids = new Map();
    this.messages = new Map();
    this.notifications = new Map();
    
    this.userId = 1;
    this.motorcycleId = 1;
    this.auctionId = 1;
    this.bidId = 1;
    this.messageId = 1;
    this.notificationId = 1;
    
    // Seed some sample data for development
    this.seedSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const hashedPassword = await hashPassword(insertUser.password);
    const user: User = { 
      ...insertUser, 
      id, 
      password: hashedPassword,
      rating: 0,
      totalRatings: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Motorcycle methods
  async createMotorcycle(insertMotorcycle: InsertMotorcycle): Promise<Motorcycle> {
    const id = this.motorcycleId++;
    const motorcycle: Motorcycle = { 
      ...insertMotorcycle, 
      id, 
      createdAt: new Date()
    };
    this.motorcycles.set(id, motorcycle);
    return motorcycle;
  }

  async getMotorcycle(id: number): Promise<Motorcycle | undefined> {
    return this.motorcycles.get(id);
  }

  async getMotorcyclesByDealerId(dealerId: number): Promise<Motorcycle[]> {
    return Array.from(this.motorcycles.values()).filter(
      (motorcycle) => motorcycle.dealerId === dealerId,
    );
  }

  async updateMotorcycle(id: number, motorcycleData: Partial<Motorcycle>): Promise<Motorcycle | undefined> {
    const motorcycle = this.motorcycles.get(id);
    if (!motorcycle) return undefined;
    
    const updatedMotorcycle = { ...motorcycle, ...motorcycleData };
    this.motorcycles.set(id, updatedMotorcycle);
    return updatedMotorcycle;
  }

  // Auction methods
  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const id = this.auctionId++;
    const auction: Auction = { 
      ...insertAuction, 
      id, 
      status: "active",
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date()
    };
    this.auctions.set(id, auction);
    return auction;
  }

  async getAuction(id: number): Promise<Auction | undefined> {
    return this.auctions.get(id);
  }

  async getAuctionWithDetails(id: number): Promise<AuctionWithDetails | undefined> {
    const auction = this.auctions.get(id);
    if (!auction) return undefined;
    
    const motorcycle = this.motorcycles.get(auction.motorcycleId);
    if (!motorcycle) return undefined;
    
    const bids = await this.getBidsByAuctionId(id);
    const highestBid = await this.getHighestBidForAuction(id);
    
    return {
      ...auction,
      motorcycle,
      bids,
      currentBid: highestBid?.amount,
      totalBids: bids.length
    };
  }

  async getActiveAuctions(): Promise<AuctionWithDetails[]> {
    const now = new Date();
    const activeAuctions = Array.from(this.auctions.values()).filter(
      (auction) => auction.status === "active" && new Date(auction.endTime) > now
    );
    
    return Promise.all(
      activeAuctions.map(async (auction) => {
        const motorcycle = this.motorcycles.get(auction.motorcycleId);
        const bids = await this.getBidsByAuctionId(auction.id);
        const highestBid = await this.getHighestBidForAuction(auction.id);
        
        return {
          ...auction,
          motorcycle: motorcycle!,
          bids,
          currentBid: highestBid?.amount,
          totalBids: bids.length
        };
      })
    );
  }

  async getAuctionsByDealerId(dealerId: number): Promise<AuctionWithDetails[]> {
    const dealerAuctions = Array.from(this.auctions.values()).filter(
      (auction) => auction.dealerId === dealerId
    );
    
    return Promise.all(
      dealerAuctions.map(async (auction) => {
        const motorcycle = this.motorcycles.get(auction.motorcycleId);
        const bids = await this.getBidsByAuctionId(auction.id);
        const highestBid = await this.getHighestBidForAuction(auction.id);
        
        return {
          ...auction,
          motorcycle: motorcycle!,
          bids,
          currentBid: highestBid?.amount,
          totalBids: bids.length
        };
      })
    );
  }

  async updateAuction(id: number, auctionData: Partial<Auction>): Promise<Auction | undefined> {
    const auction = this.auctions.get(id);
    if (!auction) return undefined;
    
    const updatedAuction = { ...auction, ...auctionData };
    this.auctions.set(id, updatedAuction);
    return updatedAuction;
  }

  // Bid methods
  async createBid(insertBid: InsertBid): Promise<Bid> {
    const id = this.bidId++;
    const bid: Bid = { 
      ...insertBid, 
      id, 
      createdAt: new Date()
    };
    this.bids.set(id, bid);
    return bid;
  }

  async getBidsByAuctionId(auctionId: number): Promise<Bid[]> {
    return Array.from(this.bids.values())
      .filter(bid => bid.auctionId === auctionId)
      .sort((a, b) => b.amount - a.amount); // Sort by highest bid first
  }

  async getHighestBidForAuction(auctionId: number): Promise<Bid | undefined> {
    const bids = await this.getBidsByAuctionId(auctionId);
    return bids.length > 0 ? bids[0] : undefined;
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      read: false,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      read: false,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // Helper methods
  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    return comparePasswords(supplied, stored);
  }

  // Seed sample data for development
  private async seedSampleData() {
    // This is for development only and will be removed in production
    if (process.env.NODE_ENV === 'production') return;
    
    // Create a dealer account
    const dealerPassword = await hashPassword('password123');
    const dealer: User = {
      id: this.userId++,
      username: 'johndealer',
      password: dealerPassword,
      email: 'john@example.com',
      role: 'dealer',
      companyName: 'Johns Motorcycles',
      phone: '07123456789',
      address: '123 Bike Street',
      city: 'London',
      postcode: 'E1 6AN',
      rating: 4,
      totalRatings: 15,
      createdAt: new Date()
    };
    this.users.set(dealer.id, dealer);
    
    // Create a trader account
    const traderPassword = await hashPassword('password123');
    const trader: User = {
      id: this.userId++,
      username: 'miketrader',
      password: traderPassword,
      email: 'mike@example.com',
      role: 'trader',
      companyName: 'Mikes Trading Co',
      phone: '07987654321',
      address: '456 Trade Avenue',
      city: 'Manchester',
      postcode: 'M1 2WD',
      rating: 5,
      totalRatings: 8,
      createdAt: new Date()
    };
    this.users.set(trader.id, trader);
    
    // Create motorcycles
    const motorcycle1: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer.id,
      make: 'Honda',
      model: 'CBR650R',
      year: 2021,
      mileage: 8245,
      color: 'Matt Black',
      condition: 'Excellent',
      engineSize: '649cc',
      power: '94bhp',
      description: 'Excellent condition CBR650R with full service history. Recent service completed at Honda dealership. New tires fitted 1,000 miles ago. Includes tail tidy, tank pad, and frame sliders. Minor scuff on right fairing. All keys and documents present.',
      images: [
        'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87',
        'https://images.unsplash.com/photo-1558981359-219d6364c9c8',
        'https://images.unsplash.com/photo-1558981852-426c6c22a060',
        'https://images.unsplash.com/photo-1558981806-ec527fa84c39'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle1.id, motorcycle1);
    
    const motorcycle2: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer.id,
      make: 'Ducati',
      model: 'Panigale V4',
      year: 2020,
      mileage: 3120,
      color: 'Red',
      condition: 'Excellent',
      engineSize: '1103cc',
      power: '214bhp',
      description: 'Stunning Ducati Panigale V4 in immaculate condition. One owner from new with full Ducati service history. Termignoni exhaust system and many carbon fiber upgrades. Must be seen!',
      images: [
        'https://pixabay.com/get/g921a4328472c7e5e94708bfc521011586531e76fad4f1e17b3b2c842cadc7ae5a8c250ae07751e6ef489860fb2dc8399dc6d23e8dda15d66442febb8c9c2c9d6_1280.jpg'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle2.id, motorcycle2);
    
    const motorcycle3: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer.id,
      make: 'BMW',
      model: 'R1250GS Adventure',
      year: 2022,
      mileage: 6780,
      color: 'Silver',
      condition: 'Excellent',
      engineSize: '1254cc',
      power: '136bhp',
      description: 'BMW R1250GS Adventure in excellent condition. Full service history, with recent major service. Fitted with BMW panniers, crash bars, and GPS mount. Perfect for touring or commuting.',
      images: [
        'https://pixabay.com/get/g36c0c8195618dc8b8b493fde8b7fa55befbe5d77d353ca2785647f9b1ea0dfe83f7a0e5f00d4322a2b83d6e24f9a753f873d7a297503dae896041edd74b0e639_1280.jpg'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle3.id, motorcycle3);
    
    // Create active auctions
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    
    const fourHoursFromNow = new Date();
    fourHoursFromNow.setHours(fourHoursFromNow.getHours() + 4);
    
    const eightHoursFromNow = new Date();
    eightHoursFromNow.setHours(eightHoursFromNow.getHours() + 8);
    
    const auction1: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle1.id,
      dealerId: dealer.id,
      startingPrice: 5000,
      reservePrice: 5500,
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: oneHourFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 3600000)
    };
    this.auctions.set(auction1.id, auction1);
    
    const auction2: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle2.id,
      dealerId: dealer.id,
      startingPrice: 14000,
      reservePrice: 15000,
      startTime: new Date(Date.now() - 7200000), // 2 hours ago
      endTime: fourHoursFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 7200000)
    };
    this.auctions.set(auction2.id, auction2);
    
    const auction3: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle3.id,
      dealerId: dealer.id,
      startingPrice: 12000,
      reservePrice: 12500,
      startTime: new Date(Date.now() - 10800000), // 3 hours ago
      endTime: eightHoursFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 10800000)
    };
    this.auctions.set(auction3.id, auction3);
    
    // Create some bids
    const bid1: Bid = {
      id: this.bidId++,
      auctionId: auction1.id,
      traderId: trader.id,
      amount: 5650,
      createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    };
    this.bids.set(bid1.id, bid1);
    
    const bid2: Bid = {
      id: this.bidId++,
      auctionId: auction1.id,
      traderId: trader.id,
      amount: 5750,
      createdAt: new Date(Date.now() - 2700000) // 45 minutes ago
    };
    this.bids.set(bid2.id, bid2);
    
    const bid3: Bid = {
      id: this.bidId++,
      auctionId: auction1.id,
      traderId: trader.id,
      amount: 5800,
      createdAt: new Date(Date.now() - 1500000) // 25 minutes ago
    };
    this.bids.set(bid3.id, bid3);
    
    const bid4: Bid = {
      id: this.bidId++,
      auctionId: auction1.id,
      traderId: trader.id,
      amount: 5850,
      createdAt: new Date(Date.now() - 600000) // 10 minutes ago
    };
    this.bids.set(bid4.id, bid4);
    
    // Create notification
    const notification1: Notification = {
      id: this.notificationId++,
      userId: dealer.id,
      type: 'bid',
      content: 'New bid received on Honda CBR650R',
      relatedId: auction1.id,
      read: false,
      createdAt: new Date(Date.now() - 600000) // 10 minutes ago
    };
    this.notifications.set(notification1.id, notification1);
  }
}

export const storage = new MemStorage();
