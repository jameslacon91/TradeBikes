import { 
  User, InsertUser, 
  Motorcycle, InsertMotorcycle,
  Auction, InsertAuction,
  Bid, InsertBid,
  Message, InsertMessage,
  Notification, InsertNotification
} from '@shared/schema';
import MemoryStore from 'memorystore';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Helpers for password hashing
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

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
  
  // Session store
  sessionStore: session.Store;
}

// AuctionWithDetails is used to combine auction data with its associated motorcycle and bids
export interface AuctionWithDetails extends Auction {
  motorcycle: Motorcycle;
  bids: Bid[];
  currentBid?: number;
  totalBids: number;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private motorcycles: Map<number, Motorcycle>;
  private auctions: Map<number, Auction>;
  private bids: Map<number, Bid>;
  private messages: Map<number, Message>;
  private notifications: Map<number, Notification>;
  
  readonly sessionStore: session.Store;
  
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
    
    // Create memory store for session management
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    // Seed sample data for development
    this.seedSampleData();
  }

  // Seed sample data for development
  private async seedSampleData() {
    // This is for development only and will be removed in production
    if (process.env.NODE_ENV === 'production') return;
    
    // Create dealer accounts
    const dealerPassword = await hashPassword('password123');
    
    const dealer1: User = {
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
    this.users.set(dealer1.id, dealer1);
    
    const dealer2: User = {
      id: this.userId++,
      username: 'janedealer',
      password: dealerPassword,
      email: 'jane@example.com',
      role: 'dealer',
      companyName: 'Classic Moto Dealership',
      phone: '07123456790',
      address: '456 High Road',
      city: 'Birmingham',
      postcode: 'B1 1AA',
      rating: 4.5,
      totalRatings: 22,
      createdAt: new Date()
    };
    this.users.set(dealer2.id, dealer2);
    
    const dealer3: User = {
      id: this.userId++,
      username: 'motorsgalore',
      password: dealerPassword,
      email: 'info@motorsgalore.com',
      role: 'dealer',
      companyName: 'Motors Galore Ltd',
      phone: '07123456791',
      address: '789 Park Lane',
      city: 'Edinburgh',
      postcode: 'EH1 1AA',
      rating: 5,
      totalRatings: 30,
      createdAt: new Date()
    };
    this.users.set(dealer3.id, dealer3);
    
    // Create trader accounts
    const traderPassword = await hashPassword('password123');
    
    const trader1: User = {
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
    this.users.set(trader1.id, trader1);
    
    const trader2: User = {
      id: this.userId++,
      username: 'sarahtrader',
      password: traderPassword,
      email: 'sarah@example.com',
      role: 'trader',
      companyName: 'Sarah\'s Motorcycle Exchange',
      phone: '07712345678',
      address: '789 Market St',
      city: 'Leeds',
      postcode: 'LS1 1AA',
      rating: 4,
      totalRatings: 15,
      createdAt: new Date()
    };
    this.users.set(trader2.id, trader2);
    
    const trader3: User = {
      id: this.userId++,
      username: 'davidtrader',
      password: traderPassword,
      email: 'david@example.com',
      role: 'trader',
      companyName: 'Premier Bike Traders',
      phone: '07823456789',
      address: '23 Station Road',
      city: 'Glasgow',
      postcode: 'G1 2AA',
      rating: 4.5,
      totalRatings: 12,
      createdAt: new Date()
    };
    this.users.set(trader3.id, trader3);
    
    console.log('Sample users seeded successfully');
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    
    const user: User = { 
      id,
      ...insertUser,
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
      id,
      ...insertMotorcycle,
      createdAt: new Date()
    };
    
    this.motorcycles.set(id, motorcycle);
    return motorcycle;
  }
  
  async getMotorcycle(id: number): Promise<Motorcycle | undefined> {
    return this.motorcycles.get(id);
  }
  
  async getMotorcyclesByDealerId(dealerId: number): Promise<Motorcycle[]> {
    const result: Motorcycle[] = [];
    for (const motorcycle of this.motorcycles.values()) {
      if (motorcycle.dealerId === dealerId) {
        result.push(motorcycle);
      }
    }
    return result;
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
    // Ensure startTime is always a Date, default to now if not provided
    const startTime = insertAuction.startTime || new Date();
    
    const auction: Auction = { 
      id,
      ...insertAuction,
      startTime,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
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
    
    let currentBid: number | undefined = undefined;
    if (bids.length > 0) {
      currentBid = Math.max(...bids.map(bid => bid.amount));
    }
    
    return {
      ...auction,
      motorcycle,
      bids,
      currentBid,
      totalBids: bids.length
    };
  }
  
  async getActiveAuctions(): Promise<AuctionWithDetails[]> {
    const now = new Date();
    const result: AuctionWithDetails[] = [];
    
    for (const auction of this.auctions.values()) {
      if (auction.status === 'active' && now < auction.endTime) {
        const details = await this.getAuctionWithDetails(auction.id);
        if (details) {
          result.push(details);
        }
      }
    }
    
    // Sort by end time (ascending) so soonest ending auctions are first
    return result.sort((a, b) => {
      if (!a.endTime || !b.endTime) return 0;
      return a.endTime.getTime() - b.endTime.getTime();
    });
  }
  
  async getAuctionsByDealerId(dealerId: number): Promise<AuctionWithDetails[]> {
    const result: AuctionWithDetails[] = [];
    
    for (const auction of this.auctions.values()) {
      if (auction.dealerId === dealerId) {
        const details = await this.getAuctionWithDetails(auction.id);
        if (details) {
          result.push(details);
        }
      }
    }
    
    // Sort by creation date (descending)
    return result.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
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
      id,
      ...insertBid,
      createdAt: new Date()
    };
    
    this.bids.set(id, bid);
    
    // Update the auction's highestBidderId
    const auction = await this.getAuction(insertBid.auctionId);
    if (auction) {
      const highestBid = await this.getHighestBidForAuction(insertBid.auctionId);
      if (highestBid) {
        await this.updateAuction(auction.id, { highestBidderId: highestBid.traderId });
      }
    }
    
    return bid;
  }
  
  async getBidsByAuctionId(auctionId: number): Promise<Bid[]> {
    const result: Bid[] = [];
    for (const bid of this.bids.values()) {
      if (bid.auctionId === auctionId) {
        result.push(bid);
      }
    }
    // Sort by amount (descending)
    return result.sort((a, b) => b.amount - a.amount);
  }
  
  async getHighestBidForAuction(auctionId: number): Promise<Bid | undefined> {
    const bids = await this.getBidsByAuctionId(auctionId);
    if (bids.length === 0) return undefined;
    
    return bids.reduce((highest, current) => {
      return current.amount > highest.amount ? current : highest;
    }, bids[0]);
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    
    const message: Message = { 
      id,
      ...insertMessage,
      createdAt: new Date()
    };
    
    this.messages.set(id, message);
    return message;
  }
  
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    const result: Message[] = [];
    for (const message of this.messages.values()) {
      if (
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
      ) {
        result.push(message);
      }
    }
    // Sort by creation date (ascending) for chronological order
    return result.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    
    const notification: Notification = { 
      id,
      ...insertNotification,
      read: false,
      createdAt: new Date()
    };
    
    this.notifications.set(id, notification);
    return notification;
  }
  
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    const result: Notification[] = [];
    for (const notification of this.notifications.values()) {
      if (notification.userId === userId) {
        result.push(notification);
      }
    }
    // Sort by creation date (descending) so newest notifications appear first
    return result.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    notification.read = true;
    return notification;
  }

  // Helper methods
  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    return comparePasswords(supplied, stored);
  }
}

export const storage = new MemStorage();