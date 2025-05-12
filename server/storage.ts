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
      serviceHistory: 'Full Honda dealer service history',
      tyreCondition: 'Excellent - fitted 1,000 miles ago',
      description: 'Excellent condition CBR650R with full service history. Recent service completed at Honda dealership. New tires fitted 1,000 miles ago. Includes tail tidy, tank pad, and frame sliders. Minor scuff on right fairing. All keys and documents present.',
      dateAvailable: 'Immediate',
      regNumber: 'LP21 KFG',
      auctionDuration: '1day',
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
      serviceHistory: 'Full Ducati dealer service history',
      tyreCondition: 'Good - approximately 70% remaining',
      description: 'Stunning Ducati Panigale V4 in immaculate condition. One owner from new with full Ducati service history. Termignoni exhaust system and many carbon fiber upgrades. Must be seen!',
      dateAvailable: 'Immediate',
      regNumber: 'LD70 VXR',
      auctionDuration: '1week',
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
      serviceHistory: 'Full BMW dealer service history, major service completed last month',
      tyreCondition: 'Excellent - approximately 90% remaining',
      description: 'BMW R1250GS Adventure in excellent condition. Full service history, with recent major service. Fitted with BMW panniers, crash bars, and GPS mount. Perfect for touring or commuting.',
      dateAvailable: 'Next Week',
      regNumber: 'MA22 BMW',
      auctionDuration: '2weeks',
      images: [
        'https://pixabay.com/get/g36c0c8195618dc8b8b493fde8b7fa55befbe5d77d353ca2785647f9b1ea0dfe83f7a0e5f00d4322a2b83d6e24f9a753f873d7a297503dae896041edd74b0e639_1280.jpg'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle3.id, motorcycle3);
    
    // Create a second dealer
    const dealer2: User = {
      id: this.userId++,
      username: 'motorsGalore',
      password: await hashPassword('password123'),
      email: 'sales@motorsgalore.com',
      role: 'dealer',
      companyName: 'Motors Galore Ltd',
      phone: '07765432109',
      address: '789 Park Lane',
      city: 'Birmingham',
      postcode: 'B1 1AB',
      rating: 5,
      totalRatings: 27,
      createdAt: new Date()
    };
    this.users.set(dealer2.id, dealer2);
    
    // Add more diverse motorcycle options
    const motorcycle4: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer2.id,
      make: 'Triumph',
      model: 'Street Triple RS',
      year: 2022,
      mileage: 3450,
      color: 'Silver',
      condition: 'Excellent',
      engineSize: '765cc',
      serviceHistory: 'Full Triumph dealer service history, under warranty until 2025',
      tyreCondition: 'Excellent - nearly new',
      description: 'Nearly new Triumph Street Triple RS with Arrow exhaust. Full service history and still under manufacturer warranty until 2025. Quickshifter and autoblipper fitted. Tail tidy and frame sliders included.',
      dateAvailable: 'Immediate',
      regNumber: 'LB22 TRP',
      auctionDuration: '1week',
      images: [
        'https://images.unsplash.com/photo-1547549082-6bc09f2049ae'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle4.id, motorcycle4);
    
    const motorcycle5: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer2.id,
      make: 'Kawasaki',
      model: 'Z900',
      year: 2021,
      mileage: 6720,
      color: 'Green',
      condition: 'Good',
      engineSize: '948cc',
      power: '125bhp',
      description: 'Kawasaki Z900 with Akrapovic exhaust and K&N air filter. Great condition with some cosmetic mods including tinted screen and LED indicators. Recent service and new tires.',
      images: [
        'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle5.id, motorcycle5);
    
    const motorcycle6: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer.id,
      make: 'Yamaha',
      model: 'MT-09 SP',
      year: 2020,
      mileage: 8900,
      color: 'Blue/Silver',
      condition: 'Good',
      engineSize: '889cc',
      power: '117bhp',
      description: 'Yamaha MT-09 SP with Öhlins rear shock and upgraded front suspension. Akrapovic exhaust, USB charging port, and heated grips fitted. Full service history and two keys.',
      images: [
        'https://images.unsplash.com/photo-1571646750134-f19967f97042'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle6.id, motorcycle6);
    
    const motorcycle7: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer2.id,
      make: 'Harley-Davidson',
      model: 'Street Glide Special',
      year: 2019,
      mileage: 15200,
      color: 'Black',
      condition: 'Excellent',
      engineSize: '1868cc',
      power: '93bhp',
      description: 'Beautiful Harley-Davidson Street Glide Special with lots of chrome upgrades. Stage 1 tuning, Vance & Hines exhaust, and comfortable touring seat. Perfect for long rides with outstanding comfort.',
      images: [
        'https://images.unsplash.com/photo-1558980394-4c7c9299fe96'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle7.id, motorcycle7);
    
    const motorcycle8: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer.id,
      make: 'KTM',
      model: '1290 Super Duke R',
      year: 2021,
      mileage: 5600,
      color: 'Orange',
      condition: 'Excellent',
      engineSize: '1301cc',
      power: '180bhp',
      description: 'KTM 1290 Super Duke R "The Beast" in stunning condition. Akrapovic exhaust, PowerParts upgrades, and recently serviced. Incredible performance and handling with all rider modes fully functional.',
      images: [
        'https://images.unsplash.com/photo-1562582138-15793fb8031a'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle8.id, motorcycle8);
    
    const motorcycle9: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer2.id,
      make: 'Suzuki',
      model: 'GSX-R1000R',
      year: 2020,
      mileage: 7800,
      color: 'Blue/White',
      condition: 'Good',
      engineSize: '999cc',
      power: '202bhp',
      description: 'Suzuki GSX-R1000R in excellent condition. Recently serviced with new chain and sprockets. Yoshimura exhaust, frame sliders, and rear paddock stand included. Track-ready with all stock parts included.',
      images: [
        'https://images.unsplash.com/photo-1563051424-5af0e5617eeb'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle9.id, motorcycle9);
    
    const motorcycle10: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer.id,
      make: 'Ducati',
      model: 'Multistrada V4S',
      year: 2022,
      mileage: 4200,
      color: 'Red',
      condition: 'Excellent',
      engineSize: '1158cc',
      power: '170bhp',
      description: 'Top-spec Ducati Multistrada V4S with full luggage, radar cruise control, and heated grips. Almost new condition with full service history and remaining manufacturer warranty. Full luggage set and all accessories included.',
      images: [
        'https://images.unsplash.com/photo-1626240130051-68871c71e405'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle10.id, motorcycle10);
    
    // Create active auctions
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    
    const fourHoursFromNow = new Date();
    fourHoursFromNow.setHours(fourHoursFromNow.getHours() + 4);
    
    const eightHoursFromNow = new Date();
    eightHoursFromNow.setHours(eightHoursFromNow.getHours() + 8);
    
    const twelveHoursFromNow = new Date();
    twelveHoursFromNow.setHours(twelveHoursFromNow.getHours() + 12);
    
    const twentyFourHoursFromNow = new Date();
    twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);
    
    const fortyEightHoursFromNow = new Date();
    fortyEightHoursFromNow.setHours(fortyEightHoursFromNow.getHours() + 48);
    
    // Create auctions for original motorcycles
    const auction1: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle1.id,
      dealerId: dealer.id,
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
      startTime: new Date(Date.now() - 10800000), // 3 hours ago
      endTime: eightHoursFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 10800000)
    };
    this.auctions.set(auction3.id, auction3);
    
    // Create auctions for new motorcycles
    const auction4: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle4.id,
      dealerId: dealer2.id,
      startTime: new Date(Date.now() - 5400000), // 1.5 hours ago
      endTime: twelveHoursFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 5400000)
    };
    this.auctions.set(auction4.id, auction4);
    
    const auction5: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle5.id,
      dealerId: dealer2.id,
      startTime: new Date(Date.now() - 14400000), // 4 hours ago
      endTime: twentyFourHoursFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 14400000)
    };
    this.auctions.set(auction5.id, auction5);
    
    const auction6: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle6.id,
      dealerId: dealer.id,
      startTime: new Date(Date.now() - 18000000), // 5 hours ago
      endTime: fortyEightHoursFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 18000000)
    };
    this.auctions.set(auction6.id, auction6);
    
    const auction7: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle7.id,
      dealerId: dealer2.id,
      startTime: new Date(Date.now() - 21600000), // 6 hours ago
      endTime: twentyFourHoursFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 21600000)
    };
    this.auctions.set(auction7.id, auction7);
    
    const auction8: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle8.id,
      dealerId: dealer.id,
      startTime: new Date(Date.now() - 25200000), // 7 hours ago
      endTime: fortyEightHoursFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 25200000)
    };
    this.auctions.set(auction8.id, auction8);
    
    const auction9: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle9.id,
      dealerId: dealer2.id,
      startTime: new Date(Date.now() - 28800000), // 8 hours ago
      endTime: twentyFourHoursFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 28800000)
    };
    this.auctions.set(auction9.id, auction9);
    
    const auction10: Auction = {
      id: this.auctionId++,
      motorcycleId: motorcycle10.id,
      dealerId: dealer.id,
      startTime: new Date(Date.now() - 32400000), // 9 hours ago
      endTime: fortyEightHoursFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      createdAt: new Date(Date.now() - 32400000)
    };
    this.auctions.set(auction10.id, auction10);
    
    // Create bids for auction 1
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
    
    // Create bids for auction 2
    const bid5: Bid = {
      id: this.bidId++,
      auctionId: auction2.id,
      traderId: trader.id,
      amount: 14200,
      createdAt: new Date(Date.now() - 5400000) // 1.5 hours ago
    };
    this.bids.set(bid5.id, bid5);
    
    const bid6: Bid = {
      id: this.bidId++,
      auctionId: auction2.id,
      traderId: trader.id,
      amount: 14350,
      createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    };
    this.bids.set(bid6.id, bid6);
    
    // Create bids for auction 3
    const bid7: Bid = {
      id: this.bidId++,
      auctionId: auction3.id,
      traderId: trader.id,
      amount: 12100,
      createdAt: new Date(Date.now() - 7200000) // 2 hours ago
    };
    this.bids.set(bid7.id, bid7);
    
    // Create bids for auction 4
    const bid8: Bid = {
      id: this.bidId++,
      auctionId: auction4.id,
      traderId: trader.id,
      amount: 8650,
      createdAt: new Date(Date.now() - 5000000) // ~1.4 hours ago
    };
    this.bids.set(bid8.id, bid8);
    
    const bid9: Bid = {
      id: this.bidId++,
      auctionId: auction4.id,
      traderId: trader.id,
      amount: 8800,
      createdAt: new Date(Date.now() - 4000000) // ~1.1 hours ago
    };
    this.bids.set(bid9.id, bid9);
    
    const bid10: Bid = {
      id: this.bidId++,
      auctionId: auction4.id,
      traderId: trader.id,
      amount: 8950,
      createdAt: new Date(Date.now() - 2000000) // ~33 minutes ago
    };
    this.bids.set(bid10.id, bid10);
    
    // Create bids for auction 5
    const bid11: Bid = {
      id: this.bidId++,
      auctionId: auction5.id,
      traderId: trader.id,
      amount: 7300,
      createdAt: new Date(Date.now() - 12600000) // 3.5 hours ago
    };
    this.bids.set(bid11.id, bid11);
    
    // Create bids for auction 7
    const bid12: Bid = {
      id: this.bidId++,
      auctionId: auction7.id,
      traderId: trader.id,
      amount: 15700,
      createdAt: new Date(Date.now() - 19800000) // 5.5 hours ago
    };
    this.bids.set(bid12.id, bid12);
    
    const bid13: Bid = {
      id: this.bidId++,
      auctionId: auction7.id,
      traderId: trader.id,
      amount: 15900,
      createdAt: new Date(Date.now() - 16200000) // 4.5 hours ago
    };
    this.bids.set(bid13.id, bid13);
    
    // Create bids for auction 8
    const bid14: Bid = {
      id: this.bidId++,
      auctionId: auction8.id,
      traderId: trader.id,
      amount: 13650,
      createdAt: new Date(Date.now() - 21600000) // 6 hours ago
    };
    this.bids.set(bid14.id, bid14);
    
    // Create bids for auction 9
    const bid15: Bid = {
      id: this.bidId++,
      auctionId: auction9.id,
      traderId: trader.id,
      amount: 11200,
      createdAt: new Date(Date.now() - 27000000) // 7.5 hours ago
    };
    this.bids.set(bid15.id, bid15);
    
    const bid16: Bid = {
      id: this.bidId++,
      auctionId: auction9.id,
      traderId: trader.id,
      amount: 11350,
      createdAt: new Date(Date.now() - 25200000) // 7 hours ago
    };
    this.bids.set(bid16.id, bid16);
    
    const bid17: Bid = {
      id: this.bidId++,
      auctionId: auction9.id,
      traderId: trader.id,
      amount: 11500,
      createdAt: new Date(Date.now() - 21600000) // 6 hours ago
    };
    this.bids.set(bid17.id, bid17);
    
    // Create bids for auction 10
    const bid18: Bid = {
      id: this.bidId++,
      auctionId: auction10.id,
      traderId: trader.id,
      amount: 18200,
      createdAt: new Date(Date.now() - 30600000) // 8.5 hours ago
    };
    this.bids.set(bid18.id, bid18);
    
    const bid19: Bid = {
      id: this.bidId++,
      auctionId: auction10.id,
      traderId: trader.id,
      amount: 18500,
      createdAt: new Date(Date.now() - 27000000) // 7.5 hours ago
    };
    this.bids.set(bid19.id, bid19);
    
    // Create notifications for dealer 1
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
    
    const notification2: Notification = {
      id: this.notificationId++,
      userId: dealer.id,
      type: 'bid',
      content: 'New bid received on Ducati Panigale V4',
      relatedId: auction2.id,
      read: false,
      createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    };
    this.notifications.set(notification2.id, notification2);
    
    const notification3: Notification = {
      id: this.notificationId++,
      userId: dealer.id,
      type: 'bid',
      content: 'New bid received on BMW R1250GS Adventure',
      relatedId: auction3.id,
      read: false,
      createdAt: new Date(Date.now() - 7200000) // 2 hours ago
    };
    this.notifications.set(notification3.id, notification3);
    
    const notification4: Notification = {
      id: this.notificationId++,
      userId: dealer.id,
      type: 'auction_ending',
      content: 'Your auction for Honda CBR650R is ending soon',
      relatedId: auction1.id,
      read: false,
      createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
    };
    this.notifications.set(notification4.id, notification4);
    
    const notification5: Notification = {
      id: this.notificationId++,
      userId: dealer.id,
      type: 'message',
      content: 'New message from Mike at Fast Wheels Trading',
      relatedId: trader.id,
      read: true,
      createdAt: new Date(Date.now() - 10800000) // 3 hours ago
    };
    this.notifications.set(notification5.id, notification5);
    
    // Create notifications for dealer 2
    const notification6: Notification = {
      id: this.notificationId++,
      userId: dealer2.id,
      type: 'bid',
      content: 'New bid received on Triumph Street Triple RS',
      relatedId: auction4.id,
      read: false,
      createdAt: new Date(Date.now() - 2000000) // ~33 minutes ago
    };
    this.notifications.set(notification6.id, notification6);
    
    const notification7: Notification = {
      id: this.notificationId++,
      userId: dealer2.id,
      type: 'bid',
      content: 'New bid received on Kawasaki Z900',
      relatedId: auction5.id,
      read: false,
      createdAt: new Date(Date.now() - 12600000) // 3.5 hours ago
    };
    this.notifications.set(notification7.id, notification7);
    
    const notification8: Notification = {
      id: this.notificationId++,
      userId: dealer2.id,
      type: 'bid',
      content: 'New bid received on Harley-Davidson Street Glide Special',
      relatedId: auction7.id,
      read: true,
      createdAt: new Date(Date.now() - 16200000) // 4.5 hours ago
    };
    this.notifications.set(notification8.id, notification8);
    
    // Create notifications for trader
    const notification9: Notification = {
      id: this.notificationId++,
      userId: trader.id,
      type: 'auction_created',
      content: 'New auction created: Ducati Multistrada V4S',
      relatedId: auction10.id,
      read: false,
      createdAt: new Date(Date.now() - 32400000) // 9 hours ago
    };
    this.notifications.set(notification9.id, notification9);
    
    const notification10: Notification = {
      id: this.notificationId++,
      userId: trader.id,
      type: 'auction_created',
      content: 'New auction created: KTM 1290 Super Duke R',
      relatedId: auction8.id,
      read: true,
      createdAt: new Date(Date.now() - 25200000) // 7 hours ago
    };
    this.notifications.set(notification10.id, notification10);
    
    const notification11: Notification = {
      id: this.notificationId++,
      userId: trader.id,
      type: 'auction_ending',
      content: 'Auction ending soon: Honda CBR650R',
      relatedId: auction1.id,
      read: false,
      createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
    };
    this.notifications.set(notification11.id, notification11);
  }
}

export const storage = new MemStorage();
