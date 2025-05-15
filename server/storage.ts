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
  getActiveAuctions(currentUserId?: number | null): Promise<AuctionWithDetails[]>;
  getAuctionsByDealerId(dealerId: number): Promise<AuctionWithDetails[]>;
  updateAuction(id: number, auction: Partial<Auction>): Promise<Auction | undefined>;
  
  // Bid methods
  createBid(bid: InsertBid): Promise<Bid>;
  getBid(id: number): Promise<Bid | undefined>;
  getBidsByAuctionId(auctionId: number): Promise<Bid[]>;
  getBidsByDealerId(dealerId: number): Promise<Bid[]>;
  getHighestBidForAuction(auctionId: number): Promise<Bid | undefined>;
  getAuctionsWithBidsByDealer(dealerId: number): Promise<AuctionWithDetails[]>;
  
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
    
    // Create bidder accounts (all users are dealers now, but these were originally traders)
    const bidderPassword = await hashPassword('password123');
    
    const trader1: User = {
      id: this.userId++,
      username: 'miketrader',
      password: bidderPassword,
      email: 'mike@example.com',
      role: 'dealer', // Changed from 'trader' to 'dealer'
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
      password: bidderPassword,
      email: 'sarah@example.com',
      role: 'dealer', // Changed from 'trader' to 'dealer'
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
      password: bidderPassword,
      email: 'david@example.com',
      role: 'dealer', // Changed from 'trader' to 'dealer'
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
    
    // Additional test users
    const trader4: User = {
      id: this.userId++,
      username: 'samdealer',
      password: bidderPassword,
      email: 'sam@example.com',
      role: 'dealer',
      companyName: 'Sam\'s Superbikes',
      phone: '07866554433',
      address: '45 Motorway Lane',
      city: 'Leeds',
      postcode: 'LS1 5TY',
      rating: 5,
      totalRatings: 22,
      favoriteDealers: [1, 2],
      createdAt: new Date()
    };
    this.users.set(trader4.id, trader4);
    
    const trader5: User = {
      id: this.userId++,
      username: 'lucydealer',
      password: bidderPassword,
      email: 'lucy@example.com',
      role: 'dealer',
      companyName: 'Lucy\'s Luxury Bikes',
      phone: '07988776655',
      address: '12 Premium Drive',
      city: 'Bristol',
      postcode: 'BS8 4RQ',
      rating: 4.5,
      totalRatings: 18,
      favoriteDealers: [3, 5],
      createdAt: new Date()
    };
    this.users.set(trader5.id, trader5);
    
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
      status: 'pending_collection', // Change status to pending_collection for MikeTrader to see
      soldDate: new Date().toISOString(), // Add sold date
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
    
    // Additional motorcycles for new users
    const motorcycle6: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: trader4.id, // Sam's Superbikes
      make: 'Triumph',
      model: 'Speed Triple 1200 RS',
      year: 2023,
      mileage: 3450,
      color: 'Sapphire Black',
      condition: 'Excellent',
      engineSize: '1160cc',
      serviceHistory: 'Full Triumph service history',
      tyreCondition: 'Excellent - under 2,000 miles',
      description: 'Nearly new Speed Triple with all the extras. Heated grips, quickshifter, and Arrow exhaust. Stunning condition throughout with full service history. First MOT not due until March next year.',
      dateAvailable: 'Immediate',
      regNumber: 'WK23 TRS',
      auctionDuration: '1week',
      images: [
        'https://images.unsplash.com/photo-1580341124464-8c6fb68d9664'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle6.id, motorcycle6);
    
    const motorcycle7: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: trader5.id, // Lucy's Luxury Bikes
      make: 'BMW',
      model: 'R 1250 GS Adventure',
      year: 2022,
      mileage: 8790,
      color: 'Triple Black',
      condition: 'Very Good',
      engineSize: '1254cc',
      serviceHistory: 'Full BMW dealer history',
      tyreCondition: 'Good - 50% remaining',
      description: 'Stunning R 1250 GS Adventure with full luggage and touring pack. Includes heated seats, heated grips, dynamic ESA, riding modes pro, and much more. Minor scuff on left pannier from previous owner.',
      dateAvailable: 'Immediate',
      regNumber: 'BY22 BMW',
      auctionDuration: '3days',
      images: [
        'https://images.unsplash.com/photo-1558555808-d053245e175c'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle7.id, motorcycle7);
    
    const motorcycle8: Motorcycle = {
      id: this.motorcycleId++,
      dealerId: dealer3.id, // Scott Motors
      make: 'Harley-Davidson',
      model: 'Fat Boy 114',
      year: 2021,
      mileage: 5230,
      color: 'Vivid Black',
      condition: 'Excellent',
      engineSize: '1868cc',
      serviceHistory: 'Full H-D dealer history',
      tyreCondition: 'Excellent',
      description: 'Beautiful Fat Boy with Screamin\' Eagle stage 1 tune and Vance & Hines exhaust. Meticulously maintained and stored in heated garage. Includes sissy bar, luggage rack, and windshield.',
      dateAvailable: 'Immediate',
      regNumber: 'HD21 FAT',
      auctionDuration: '1week',
      images: [
        'https://images.unsplash.com/photo-1572116469696-31de0f17cc34'
      ],
      createdAt: new Date()
    };
    this.motorcycles.set(motorcycle8.id, motorcycle8);
    
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
      startTime: new Date(now.getTime() - oneHour * 12), // 12 hours ago
      endTime: new Date(now.getTime() - oneHour * 3), // 3 hours ago (auction ended)
      status: 'deal_confirmed',
      winningBidId: 3, // Bid ID 3 - the highest bid
      winningBidderId: 4, // MikeTrader is ID 4
      bidAccepted: true,
      dealConfirmed: true,
      collectionConfirmed: false,
      collectionDate: new Date(now.getTime() + oneDay * 2).toISOString(), // 2 days from now
      highestBidderId: 4, // MikeTrader is ID 4
      visibilityType: 'all',
      visibilityRadius: null,
      createdAt: new Date(now.getTime() - oneHour * 12),
      completedAt: new Date(now.getTime() - oneHour * 3).toISOString()
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
      winningBidderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      visibilityType: 'favorites',
      visibilityRadius: null,
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
    
    // Create auctions for new motorcycles
    const auction6: Auction = { 
      id: this.auctionId++,
      motorcycleId: motorcycle6.id,
      dealerId: trader4.id, // Sam's Superbikes
      startTime: new Date(now.getTime() - oneHour * 8), // 8 hours ago
      endTime: oneWeekFromNow,
      status: 'active',
      winningBidId: null,
      winningBidderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      visibilityType: 'all',
      visibilityRadius: null,
      createdAt: new Date(now.getTime() - oneHour * 8)
    };
    this.auctions.set(auction6.id, auction6);
    
    const auction7: Auction = { 
      id: this.auctionId++,
      motorcycleId: motorcycle7.id,
      dealerId: trader5.id, // Lucy's Luxury Bikes
      startTime: new Date(now.getTime() - oneHour * 6), // 6 hours ago
      endTime: twoDaysFromNow,
      status: 'active',
      winningBidId: null,
      winningBidderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      visibilityType: 'radius',
      visibilityRadius: 100, // 100 miles radius
      createdAt: new Date(now.getTime() - oneHour * 6)
    };
    this.auctions.set(auction7.id, auction7);
    
    const auction8: Auction = { 
      id: this.auctionId++,
      motorcycleId: motorcycle8.id,
      dealerId: dealer3.id, // Scott Motors
      startTime: new Date(now.getTime() - oneHour * 10), // 10 hours ago
      endTime: oneWeekFromNow,
      status: 'active',
      winningBidId: null,
      winningBidderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      visibilityType: 'favorites',
      visibilityRadius: null,
      createdAt: new Date(now.getTime() - oneHour * 10)
    };
    this.auctions.set(auction8.id, auction8);
    
    // Create sample bids
    const bid1: Bid = { 
      id: this.bidId++,
      auctionId: auction1.id,
      dealerId: 4, // miketrader ID hardcoded
      amount: 6500,
      createdAt: new Date(now.getTime() - oneHour * 4) // 4 hours ago
    };
    this.bids.set(bid1.id, bid1);
    
    const bid2: Bid = { 
      id: this.bidId++,
      auctionId: auction1.id,
      dealerId: trader2.id,
      amount: 6800,
      createdAt: new Date(now.getTime() - oneHour * 3) // 3 hours ago
    };
    this.bids.set(bid2.id, bid2);
    
    const bid3: Bid = { 
      id: this.bidId++,
      auctionId: auction1.id,
      dealerId: 4, // miketrader ID hardcoded
      amount: 7200, // winning bid - increased amount
      createdAt: new Date(now.getTime() - oneHour * 2) // 2 hours ago
    };
    this.bids.set(bid3.id, bid3);
    
    const bid4: Bid = { 
      id: this.bidId++,
      auctionId: auction1.id,
      dealerId: trader3.id,
      amount: 7200,
      createdAt: new Date(now.getTime() - oneHour * 1) // 1 hour ago
    };
    this.bids.set(bid4.id, bid4);
    
    // Add bids to other auctions
    const bid5: Bid = { 
      id: this.bidId++,
      auctionId: auction2.id,
      dealerId: trader1.id,
      amount: 15500,
      createdAt: new Date(now.getTime() - oneHour * 9) // 9 hours ago
    };
    this.bids.set(bid5.id, bid5);
    
    const bid6: Bid = { 
      id: this.bidId++,
      auctionId: auction2.id,
      dealerId: trader2.id,
      amount: 16000,
      createdAt: new Date(now.getTime() - oneHour * 7) // 7 hours ago
    };
    this.bids.set(bid6.id, bid6);
    
    // Add bids for auctions from other dealers
    const bid7: Bid = { 
      id: this.bidId++,
      auctionId: auction4.id,
      dealerId: trader1.id,
      amount: 8200,
      createdAt: new Date(now.getTime() - oneHour * 10) // 10 hours ago
    };
    this.bids.set(bid7.id, bid7);
    
    const bid8: Bid = { 
      id: this.bidId++,
      auctionId: auction4.id,
      dealerId: trader3.id,
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
    
    // Add explicit notification for pending collection for MikeTrader
    const notificationPendingCollection: Notification = {
      id: this.notificationId++,
      userId: 4, // MikeTrader ID 4
      type: 'collection_pending',
      content: 'Your winning bid for Honda CBR650R has been accepted. The motorcycle is ready for collection.',
      relatedId: auction1.id,
      read: false,
      createdAt: new Date(now.getTime() - oneHour * 1) // 1 hour ago
    };
    this.notifications.set(notificationPendingCollection.id, notificationPendingCollection);
    
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
    // Case-insensitive username matching
    const lowercaseUsername = username.toLowerCase();
    console.log(`Looking for user with case-insensitive username: ${username}`);
    
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === lowercaseUsername) {
        console.log(`Found user with case-insensitive match: ${username} -> ${user.username}`);
        return user;
      }
    }
    console.log(`No user found with username: ${username}`);
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
    
    // Set default values for optional fields
    const defaults = {
      model: insertMotorcycle.model || '',
      year: insertMotorcycle.year || new Date().getFullYear(),
      mileage: insertMotorcycle.mileage || 0,
      color: insertMotorcycle.color || 'Unknown',
      condition: insertMotorcycle.condition || 'Good',
      engineSize: insertMotorcycle.engineSize || '',
      description: insertMotorcycle.description || '',
      serviceHistory: insertMotorcycle.serviceHistory || '',
      tyreCondition: insertMotorcycle.tyreCondition || '',
      dateAvailable: insertMotorcycle.dateAvailable || '',
      regNumber: insertMotorcycle.regNumber || '',
      auctionDuration: insertMotorcycle.auctionDuration || '1week',
      images: insertMotorcycle.images || []
    };
    
    const motorcycle: Motorcycle = { 
      id,
      dealerId: insertMotorcycle.dealerId,
      make: insertMotorcycle.make || 'Unknown',
      ...defaults,
      createdAt: new Date()
    };
    
    this.motorcycles.set(id, motorcycle);
    return motorcycle;
  }
  
  async getMotorcycle(id: number): Promise<Motorcycle | undefined> {
    const motorcycle = this.motorcycles.get(id);
    
    if (!motorcycle) {
      console.log(`getMotorcycle: Motorcycle with ID ${id} not found`);
      return undefined;
    }
    
    // Log motorcycle status for tracking
    console.log(`getMotorcycle: Found motorcycle ${id} with status: ${motorcycle.status}`);
    
    // Special handling for motorcycles that should be in pending_collection
    if (motorcycle.status !== 'pending_collection') {
      // Check if there's an auction for this motorcycle that's in pending_collection state
      for (const auction of this.auctions.values()) {
        if (auction.motorcycleId === id && auction.status === 'pending_collection' && auction.bidAccepted) {
          console.log(`Found inconsistency: Motorcycle ${id} has status ${motorcycle.status} but its auction ${auction.id} is in pending_collection state`);
          console.log(`Auto-correcting motorcycle ${id} status to pending_collection`);
          motorcycle.status = 'pending_collection';
          this.motorcycles.set(id, motorcycle);
          break;
        }
      }
    }
    
    return motorcycle;
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
    if (!motorcycle) {
      console.error(`Failed to update motorcycle with ID ${id}: Not found in storage`);
      return undefined;
    }
    
    // Log before update
    if (motorcycleData.status) {
      console.log(`Updating motorcycle ${id} status: ${motorcycle.status} -> ${motorcycleData.status}`);
    }
    
    const updatedMotorcycle = { ...motorcycle, ...motorcycleData };
    
    // Ensure proper persistence of status changes
    if (motorcycleData.status === 'pending_collection') {
      console.log(`Setting motorcycle ${id} status to pending_collection - CRITICAL STATE CHANGE`);
      // Force status to be updated explicitly to ensure it's set correctly
      updatedMotorcycle.status = 'pending_collection';
    }
    
    // Update the stored motorcycle
    this.motorcycles.set(id, updatedMotorcycle);
    
    // Verify update was successful
    const verifyMotorcycle = this.motorcycles.get(id);
    if (verifyMotorcycle && motorcycleData.status) {
      console.log(`Verified motorcycle ${id} status after update: ${verifyMotorcycle.status}`);
      if (verifyMotorcycle.status !== motorcycleData.status) {
        console.error(`Status mismatch after update! Expected: ${motorcycleData.status}, Got: ${verifyMotorcycle.status}`);
        // Try once more to ensure the status is set
        verifyMotorcycle.status = motorcycleData.status;
        this.motorcycles.set(id, verifyMotorcycle);
      }
    }
    
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
    if (!auction) {
      console.log(`getAuctionWithDetails: Auction with ID ${id} not found`);
      return undefined;
    }
    
    console.log(`getAuctionWithDetails: Found auction ${id} with status: ${auction.status}`);
    
    const motorcycle = this.motorcycles.get(auction.motorcycleId);
    if (!motorcycle) {
      console.log(`getAuctionWithDetails: Could not find motorcycle ${auction.motorcycleId} for auction ${id}`);
      return undefined;
    }
    
    // Ensure motorcycle status is consistent with auction status when bid is accepted
    if (auction.status === 'pending_collection' && auction.bidAccepted && motorcycle.status !== 'pending_collection') {
      console.log(`Status inconsistency detected: Auction ${id} is pending_collection but motorcycle ${motorcycle.id} has status ${motorcycle.status}`);
      console.log(`Auto-fixing motorcycle ${motorcycle.id} status to pending_collection`);
      
      motorcycle.status = 'pending_collection';
      this.motorcycles.set(motorcycle.id, motorcycle);
    }
    
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
  
  async getActiveAuctions(currentUserId: number | null = null): Promise<AuctionWithDetails[]> {
    const now = new Date();
    const result: AuctionWithDetails[] = [];
    
    // Get current user if logged in
    const currentUser = currentUserId ? await this.getUser(currentUserId) : null;
    
    for (const auction of this.auctions.values()) {
      if (auction.status === 'active' && now < auction.endTime) {
        // Check visibility restrictions
        const isVisible = await this.isAuctionVisibleToUser(auction, currentUser);
        
        if (isVisible) {
          const details = await this.getAuctionWithDetails(auction.id);
          if (details) {
            result.push(details);
          }
        }
      }
    }
    
    // Sort by end time (ascending) so soonest ending auctions are first
    return result.sort((a, b) => {
      if (!a.endTime || !b.endTime) return 0;
      return a.endTime.getTime() - b.endTime.getTime();
    });
  }
  
  // Helper method to check if an auction is visible to a specific user
  private async isAuctionVisibleToUser(auction: Auction, user: User | null | undefined): Promise<boolean> {
    // If user is not logged in, only show 'all' visibility auctions
    if (!user) {
      return auction.visibilityType === 'all';
    }
    
    // Auction owner can always see their own auctions
    if (auction.dealerId === user.id) {
      return true;
    }
    
    // Check visibility settings
    switch (auction.visibilityType) {
      case 'all':
        // Visible to all users
        return true;
        
      case 'favorites':
        // Check if auction owner has current user in their favorites
        const sellerUser = await this.getUser(auction.dealerId);
        if (!sellerUser || !sellerUser.favoriteDealers) {
          return false;
        }
        return sellerUser.favoriteDealers.includes(user.id);
        
      case 'radius':
        // For simplicity in this demo, we'll implement a mock distance calculation
        // In a real app, you would use geocoding and calculate actual distances
        // TODO: Implement proper distance calculation using dealer addresses
        if (!auction.visibilityRadius) {
          return false;
        }
        
        // Mock implementation: if radius is > 100, show to all
        // If radius is <= 100, randomly determine visibility
        return auction.visibilityRadius > 100 || (user.id % 2 === 0);
        
      default:
        return false;
    }
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
        await this.updateAuction(auction.id, { highestBidderId: highestBid.dealerId });
      }
    }
    
    return bid;
  }
  
  async getBid(id: number): Promise<Bid | undefined> {
    return this.bids.get(id);
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
  
  async getBidsByDealerId(dealerId: number): Promise<Bid[]> {
    const result: Bid[] = [];
    for (const bid of this.bids.values()) {
      if (bid.dealerId === dealerId) {
        result.push(bid);
      }
    }
    
    // Sort by creation date (newest first)
    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }
  
  async getAuctionsWithBidsByDealer(dealerId: number): Promise<AuctionWithDetails[]> {
    console.log(`Getting auctions with bids for dealer ${dealerId}`);
    
    // Get all bids placed by this dealer
    const dealerBids = await this.getBidsByDealerId(dealerId);
    
    // Get unique auction IDs from these bids
    const auctionIds = new Set<number>();
    for (const bid of dealerBids) {
      auctionIds.add(bid.auctionId);
    }
    
    console.log(`Found ${dealerBids.length} bids from dealer ${dealerId} on ${auctionIds.size} auctions`);
    
    // Get detailed auction data for each auction with bids
    const auctions: AuctionWithDetails[] = [];
    
    // First process auctions where dealer placed bids
    for (const auctionId of auctionIds) {
      const auctionDetails = await this.getAuctionWithDetails(auctionId);
      if (auctionDetails) {
        console.log(`Auction ${auctionId} details: status=${auctionDetails.status}, bidAccepted=${auctionDetails.bidAccepted}, winningBidderId=${auctionDetails.winningBidderId}`);
        
        // Check if this dealer has won this auction
        if (auctionDetails.winningBidderId === dealerId) {
          console.log(`Dealer ${dealerId} is the winning bidder for auction ${auctionId}`);
          
          // If bid is accepted, ensure the motorcycle status is consistent
          if (auctionDetails.bidAccepted) {
            console.log(`Dealer ${dealerId}'s bid was accepted for auction ${auctionId}`);
            
            // Make sure motorcycle status matches auction status
            const motorcycle = await this.getMotorcycle(auctionDetails.motorcycleId);
            if (motorcycle && motorcycle.status !== 'pending_collection' && auctionDetails.status === 'pending_collection') {
              console.log(`Found inconsistency: Motorcycle ${auctionDetails.motorcycleId} has status ${motorcycle.status}, but auction ${auctionId} is pending_collection`);
              console.log(`Auto-correcting motorcycle ${auctionDetails.motorcycleId} status to pending_collection`);
              
              // Auto-correct the motorcycle status
              await this.updateMotorcycle(auctionDetails.motorcycleId, { 
                status: 'pending_collection' 
              });
              
              // Update the motorcycle in the auction details to reflect the change
              auctionDetails.motorcycle.status = 'pending_collection';
            }
          }
        }
        
        auctions.push(auctionDetails);
      }
    }
    
    // Also add any auctions where this dealer is explicitly set as the winning bidder
    // even if we don't have their bid record
    for (const auction of this.auctions.values()) {
      if (auction.winningBidderId === dealerId) {
        const auctionAlreadyAdded = auctions.some(a => a.id === auction.id);
        if (!auctionAlreadyAdded) {
          console.log(`Dealer ${dealerId} is winning bidder on auction ${auction.id}, adding to results`);
          const auctionDetails = await this.getAuctionWithDetails(auction.id);
          if (auctionDetails) {
            // If bid is accepted, ensure the motorcycle status is consistent
            if (auctionDetails.bidAccepted) {
              // Make sure motorcycle status matches auction status
              const motorcycle = await this.getMotorcycle(auctionDetails.motorcycleId);
              if (motorcycle && motorcycle.status !== 'pending_collection' && auctionDetails.status === 'pending_collection') {
                console.log(`Found inconsistency: Motorcycle ${auctionDetails.motorcycleId} has status ${motorcycle.status}, but auction ${auction.id} is pending_collection`);
                console.log(`Auto-correcting motorcycle ${auctionDetails.motorcycleId} status to pending_collection`);
                
                // Auto-correct the motorcycle status
                await this.updateMotorcycle(auctionDetails.motorcycleId, { 
                  status: 'pending_collection' 
                });
                
                // Update the motorcycle in the auction details to reflect the change
                auctionDetails.motorcycle.status = 'pending_collection';
              }
            }
            
            auctions.push(auctionDetails);
          }
        }
      }
    }
    
    console.log(`Returning ${auctions.length} auctions for dealer ${dealerId}`);
    return auctions;
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