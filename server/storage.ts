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
  getAllUsers(): Map<number, User>;
  
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
    const MemoryStoreFactory = MemoryStore(session);
    this.sessionStore = new MemoryStoreFactory({
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
      favoriteDealers: [],
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
      favoriteDealers: [1], // Favorite dealer1
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
      favoriteDealers: [1, 2], // Favorite dealer1 and dealer2
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
      favoriteDealers: [1, 3], // Favorite dealer1 and dealer3
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
      favoriteDealers: [2], // Favorite dealer2
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
      favoriteDealers: [1, 2, 3], // Favorite all dealers
      createdAt: new Date()
    };
    this.users.set(trader3.id, trader3);
    
    // Create sample motorcycles for dealers
    const motorcycle1: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer1.id,
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
        'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle1.id, motorcycle1);
    
    const motorcycle2: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer1.id,
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
        'https://images.unsplash.com/photo-1571646750134-28e774f5db09'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle2.id, motorcycle2);
    
    const motorcycle3: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer2.id,
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
        'https://images.unsplash.com/photo-1558980394-dbb977039a2e'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle3.id, motorcycle3);
    
    // Add more motorcycles for dealer2
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
        'https://images.unsplash.com/photo-1564855326639-c7de58ba929b'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle4.id, motorcycle4);
    
    const motorcycle5: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer3.id,
      make: 'Kawasaki',
      model: 'Z900',
      year: 2021,
      mileage: 6720,
      color: 'Green',
      condition: 'Good',
      engineSize: '948cc',
      serviceHistory: 'Serviced regularly at Kawasaki main dealer',
      tyreCondition: 'Good - approximately 70% remaining',
      description: 'Kawasaki Z900 in excellent condition. Akrapovic exhaust system, tail tidy, and aftermarket levers. Regularly serviced and well maintained. Two keys and all documentation included.',
      dateAvailable: 'End of the month',
      regNumber: 'MA71 KWS',
      auctionDuration: '2weeks',
      images: [
        'https://images.unsplash.com/photo-1591637333472-41c9c4c4c651'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle5.id, motorcycle5);
    
    // Generate sample auctions
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const twoDays = 2 * oneDay;
    const oneWeek = 7 * oneDay;
    const twoWeeks = 14 * oneDay;
    
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + oneDay);
    const twoDaysFromNow = new Date(now.getTime() + twoDays);
    const oneWeekFromNow = new Date(now.getTime() + oneWeek);
    const twoWeeksFromNow = new Date(now.getTime() + twoWeeks);
    
    // Create sample auctions
    const auction1: Auction = { 
      id: this.auctionId++,
      motorcycleId: motorcycle1.id,
      dealerId: dealer1.id,
      startTime: new Date(now.getTime() - oneHour * 5), // 5 hours ago
      endTime: oneDayFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      createdAt: new Date(now.getTime() - oneHour * 5)
    };
    this.auctions.set(auction1.id, auction1);
    
    const auction2: Auction = { 
      id: this.auctionId++,
      motorcycleId: motorcycle2.id,
      dealerId: dealer1.id,
      startTime: new Date(now.getTime() - oneHour * 10), // 10 hours ago
      endTime: oneWeekFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      createdAt: new Date(now.getTime() - oneHour * 10)
    };
    this.auctions.set(auction2.id, auction2);
    
    const auction3: Auction = { 
      id: this.auctionId++,
      motorcycleId: motorcycle3.id,
      dealerId: dealer2.id,
      startTime: new Date(now.getTime() - oneHour * 24), // 1 day ago
      endTime: twoWeeksFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      createdAt: new Date(now.getTime() - oneHour * 24)
    };
    this.auctions.set(auction3.id, auction3);
    
    // Create auctions for other dealers
    const auction4: Auction = { 
      id: this.auctionId++,
      motorcycleId: motorcycle4.id,
      dealerId: dealer2.id,
      startTime: new Date(now.getTime() - oneHour * 12), // 12 hours ago
      endTime: oneWeekFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      createdAt: new Date(now.getTime() - oneHour * 12)
    };
    this.auctions.set(auction4.id, auction4);
    
    const auction5: Auction = { 
      id: this.auctionId++,
      motorcycleId: motorcycle5.id,
      dealerId: dealer3.id,
      startTime: new Date(now.getTime() - oneHour * 36), // 1.5 days ago
      endTime: twoWeeksFromNow,
      status: 'active',
      winningBidId: null,
      winningTraderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      createdAt: new Date(now.getTime() - oneHour * 36)
    };
    this.auctions.set(auction5.id, auction5);
    
    // Create sample bids
    const bid1: Bid = { 
      id: this.bidId++,
      auctionId: auction1.id,
      traderId: trader1.id,
      amount: 6500,
      createdAt: new Date(now.getTime() - oneHour * 4) // 4 hours ago
    };
    this.bids.set(bid1.id, bid1);
    
    const bid2: Bid = { 
      id: this.bidId++,
      auctionId: auction1.id,
      traderId: trader2.id,
      amount: 6800,
      createdAt: new Date(now.getTime() - oneHour * 3) // 3 hours ago
    };
    this.bids.set(bid2.id, bid2);
    
    const bid3: Bid = { 
      id: this.bidId++,
      auctionId: auction1.id,
      traderId: trader1.id,
      amount: 7000,
      createdAt: new Date(now.getTime() - oneHour * 2) // 2 hours ago
    };
    this.bids.set(bid3.id, bid3);
    
    const bid4: Bid = { 
      id: this.bidId++,
      auctionId: auction1.id,
      traderId: trader3.id,
      amount: 7200,
      createdAt: new Date(now.getTime() - oneHour * 1) // 1 hour ago
    };
    this.bids.set(bid4.id, bid4);
    
    // Add bids to other auctions
    const bid5: Bid = { 
      id: this.bidId++,
      auctionId: auction2.id,
      traderId: trader1.id,
      amount: 15500,
      createdAt: new Date(now.getTime() - oneHour * 9) // 9 hours ago
    };
    this.bids.set(bid5.id, bid5);
    
    const bid6: Bid = { 
      id: this.bidId++,
      auctionId: auction2.id,
      traderId: trader2.id,
      amount: 16000,
      createdAt: new Date(now.getTime() - oneHour * 7) // 7 hours ago
    };
    this.bids.set(bid6.id, bid6);
    
    // Add bids for auctions from other dealers
    const bid7: Bid = { 
      id: this.bidId++,
      auctionId: auction4.id,
      traderId: trader1.id,
      amount: 8200,
      createdAt: new Date(now.getTime() - oneHour * 10) // 10 hours ago
    };
    this.bids.set(bid7.id, bid7);
    
    const bid8: Bid = { 
      id: this.bidId++,
      auctionId: auction4.id,
      traderId: trader3.id,
      amount: 8500,
      createdAt: new Date(now.getTime() - oneHour * 8) // 8 hours ago
    };
    this.bids.set(bid8.id, bid8);
    
    // Create sample notifications
    const notification1: Notification = {
      id: this.notificationId++,
      userId: dealer1.id,
      type: 'bid',
      content: 'New bid of £7,200 received on your Honda CBR650R auction',
      relatedId: auction1.id,
      read: false,
      createdAt: new Date(now.getTime() - oneHour * 1) // 1 hour ago
    };
    this.notifications.set(notification1.id, notification1);
    
    const notification2: Notification = {
      id: this.notificationId++,
      userId: trader3.id,
      type: 'auction_ending',
      content: 'Auction for Honda CBR650R is ending soon',
      relatedId: auction1.id,
      read: false,
      createdAt: new Date(now.getTime() - oneHour * 2) // 2 hours ago
    };
    this.notifications.set(notification2.id, notification2);
    
    const notification3: Notification = {
      id: this.notificationId++,
      userId: dealer1.id,
      type: 'bid',
      content: 'New bid of £16,000 received on your Ducati Panigale V4 auction',
      relatedId: auction2.id,
      read: true,
      createdAt: new Date(now.getTime() - oneHour * 7) // 7 hours ago
    };
    this.notifications.set(notification3.id, notification3);
    
    const notification4: Notification = {
      id: this.notificationId++,
      userId: trader2.id,
      type: 'auction_created',
      content: 'New auction created for BMW R1250GS Adventure',
      relatedId: auction3.id,
      read: false,
      createdAt: new Date(now.getTime() - oneHour * 24) // 1 day ago
    };
    this.notifications.set(notification4.id, notification4);
    
    const notification5: Notification = {
      id: this.notificationId++,
      userId: dealer2.id,
      type: 'bid',
      content: 'New bid of £8,500 received on your Triumph Street Triple RS auction',
      relatedId: auction4.id,
      read: false,
      createdAt: new Date(now.getTime() - oneHour * 8) // 8 hours ago
    };
    this.notifications.set(notification5.id, notification5);
    
    // Create an auction in completed state with bid accepted
    const motorcycleCompleted: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer1.id,
      make: 'Yamaha',
      model: 'MT-09',
      year: 2021,
      mileage: 5120,
      color: 'Blue',
      condition: 'Excellent',
      engineSize: '889cc',
      serviceHistory: 'Full Yamaha service history',
      tyreCondition: 'Good - approximately 75% remaining',
      description: 'Excellent Yamaha MT-09 with full service history. All standard except for a tail tidy. Perfect naked bike for daily riding.',
      dateAvailable: 'End of the week',
      regNumber: 'AB21 YMH',
      auctionDuration: '1week',
      images: [
        'https://images.unsplash.com/photo-1635073910167-20261559f0b3'
      ],
      createdAt: new Date(now.getTime() - oneDay * 10) // 10 days ago
    };
    this.motorcycles.set(motorcycleCompleted.id, motorcycleCompleted);
    
    const completedBidId = this.bidId++;
    const auctionCompleted: Auction = { 
      id: this.auctionId++,
      motorcycleId: motorcycleCompleted.id,
      dealerId: dealer1.id,
      startTime: new Date(now.getTime() - oneDay * 10), // 10 days ago
      endTime: new Date(now.getTime() - oneDay * 3), // 3 days ago
      status: 'completed',
      winningBidId: completedBidId,
      winningTraderId: trader1.id,
      bidAccepted: true,
      dealConfirmed: true,
      collectionConfirmed: false,
      collectionDate: new Date(now.getTime() + oneDay * 2), // 2 days from now
      highestBidderId: trader1.id,
      createdAt: new Date(now.getTime() - oneDay * 10)
    };
    this.auctions.set(auctionCompleted.id, auctionCompleted);
    
    const completedBid: Bid = { 
      id: completedBidId,
      auctionId: auctionCompleted.id,
      traderId: trader1.id,
      amount: 8900,
      createdAt: new Date(now.getTime() - oneDay * 4) // 4 days ago
    };
    this.bids.set(completedBid.id, completedBid);
    
    // Create notifications for the completed auction flow
    const notificationBidAccepted: Notification = {
      id: this.notificationId++,
      userId: trader1.id,
      type: 'bid_accepted',
      content: 'Your bid of £8,900 for Yamaha MT-09 has been accepted by the dealer',
      relatedId: auctionCompleted.id,
      read: true,
      createdAt: new Date(now.getTime() - oneDay * 3) // 3 days ago
    };
    this.notifications.set(notificationBidAccepted.id, notificationBidAccepted);
    
    const notificationDealConfirmed: Notification = {
      id: this.notificationId++,
      userId: dealer1.id,
      type: 'deal_confirmed',
      content: 'The trader has confirmed the deal for Yamaha MT-09',
      relatedId: auctionCompleted.id,
      read: true,
      createdAt: new Date(now.getTime() - oneDay * 2) // 2 days ago
    };
    this.notifications.set(notificationDealConfirmed.id, notificationDealConfirmed);
    
    const notificationCollection: Notification = {
      id: this.notificationId++,
      userId: trader1.id,
      type: 'collection_scheduled',
      content: 'Collection of Yamaha MT-09 scheduled for ' + new Date(now.getTime() + oneDay * 2).toLocaleDateString(),
      relatedId: auctionCompleted.id,
      read: false,
      createdAt: new Date(now.getTime() - oneDay * 1) // 1 day ago
    };
    this.notifications.set(notificationCollection.id, notificationCollection);
    
    console.log('Sample data has been seeded successfully');
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  getAllUsers(): Map<number, User> {
    return this.users;
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