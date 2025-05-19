// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import MemoryStore from "memorystore";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
var MemStorage = class {
  // Make maps public so they can be accessed directly by diagnostic scripts
  users;
  motorcycles;
  auctions;
  bids;
  messages;
  notifications;
  sessionStore;
  userId;
  motorcycleId;
  auctionId;
  bidId;
  messageId;
  notificationId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.motorcycles = /* @__PURE__ */ new Map();
    this.auctions = /* @__PURE__ */ new Map();
    this.bids = /* @__PURE__ */ new Map();
    this.messages = /* @__PURE__ */ new Map();
    this.notifications = /* @__PURE__ */ new Map();
    this.userId = 1;
    this.motorcycleId = 1;
    this.auctionId = 1;
    this.bidId = 1;
    this.messageId = 1;
    this.notificationId = 1;
    const MemoryStoreFactory = MemoryStore(session);
    this.sessionStore = new MemoryStoreFactory({
      checkPeriod: 864e5
      // Prune expired entries every 24h
    });
    this.seedSampleData();
  }
  // Seed sample data for development
  async seedSampleData() {
    if (process.env.NODE_ENV === "production") return;
    const dealerPassword = await hashPassword("password123");
    const dealer1 = {
      id: this.userId++,
      username: "johndealer",
      password: dealerPassword,
      email: "john@example.com",
      role: "dealer",
      companyName: "Johns Motorcycles",
      phone: "07123456789",
      address: "123 Bike Street",
      city: "London",
      postcode: "E1 6AN",
      rating: 4,
      totalRatings: 15,
      favoriteDealers: [],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(dealer1.id, dealer1);
    const dealer2 = {
      id: this.userId++,
      username: "janedealer",
      password: dealerPassword,
      email: "jane@example.com",
      role: "dealer",
      companyName: "Classic Moto Dealership",
      phone: "07123456790",
      address: "456 High Road",
      city: "Birmingham",
      postcode: "B1 1AA",
      rating: 4.5,
      totalRatings: 22,
      favoriteDealers: [1],
      // Favorite dealer1
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(dealer2.id, dealer2);
    const dealer3 = {
      id: this.userId++,
      username: "motorsgalore",
      password: dealerPassword,
      email: "info@motorsgalore.com",
      role: "dealer",
      companyName: "Motors Galore Ltd",
      phone: "07123456791",
      address: "789 Park Lane",
      city: "Edinburgh",
      postcode: "EH1 1AA",
      rating: 5,
      totalRatings: 30,
      favoriteDealers: [1, 2],
      // Favorite dealer1 and dealer2
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(dealer3.id, dealer3);
    const bidderPassword = await hashPassword("password123");
    const mikeId = 4;
    const trader1 = {
      id: mikeId,
      // Fixed the ID to 4 since several records reference this
      username: "miketrader",
      password: bidderPassword,
      email: "mike@example.com",
      role: "dealer",
      // Changed from 'trader' to 'dealer'
      companyName: "Mikes Trading Co",
      phone: "07987654321",
      address: "456 Trade Avenue",
      city: "Manchester",
      postcode: "M1 2WD",
      rating: 5,
      totalRatings: 8,
      favoriteDealers: [1, 3],
      // Favorite dealer1 and dealer3
      createdAt: /* @__PURE__ */ new Date()
    };
    if (this.userId <= mikeId) {
      this.userId = mikeId + 1;
    }
    ;
    this.users.set(trader1.id, trader1);
    const trader2 = {
      id: this.userId++,
      username: "sarahtrader",
      password: bidderPassword,
      email: "sarah@example.com",
      role: "dealer",
      // Changed from 'trader' to 'dealer'
      companyName: "Sarah's Motorcycle Exchange",
      phone: "07712345678",
      address: "789 Market St",
      city: "Leeds",
      postcode: "LS1 1AA",
      rating: 4,
      totalRatings: 15,
      favoriteDealers: [2],
      // Favorite dealer2
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(trader2.id, trader2);
    const trader3 = {
      id: this.userId++,
      username: "davidtrader",
      password: bidderPassword,
      email: "david@example.com",
      role: "dealer",
      // Changed from 'trader' to 'dealer'
      companyName: "Premier Bike Traders",
      phone: "07823456789",
      address: "23 Station Road",
      city: "Glasgow",
      postcode: "G1 2AA",
      rating: 4.5,
      totalRatings: 12,
      favoriteDealers: [1, 2, 3],
      // Favorite all dealers
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(trader3.id, trader3);
    const trader4 = {
      id: this.userId++,
      username: "samdealer",
      password: bidderPassword,
      email: "sam@example.com",
      role: "dealer",
      companyName: "Sam's Superbikes",
      phone: "07866554433",
      address: "45 Motorway Lane",
      city: "Leeds",
      postcode: "LS1 5TY",
      rating: 5,
      totalRatings: 22,
      favoriteDealers: [1, 2],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(trader4.id, trader4);
    const trader5 = {
      id: this.userId++,
      username: "lucydealer",
      password: bidderPassword,
      email: "lucy@example.com",
      role: "dealer",
      companyName: "Lucy's Luxury Bikes",
      phone: "07988776655",
      address: "12 Premium Drive",
      city: "Bristol",
      postcode: "BS8 4RQ",
      rating: 4.5,
      totalRatings: 18,
      favoriteDealers: [3, 5],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(trader5.id, trader5);
    const motorcycle1 = {
      id: this.motorcycleId++,
      dealerId: dealer1.id,
      make: "Honda",
      model: "CBR650R",
      year: 2021,
      mileage: 8245,
      color: "Matt Black",
      condition: "Excellent",
      engineSize: "649cc",
      serviceHistory: "Full Honda dealer service history",
      tyreCondition: "Excellent - fitted 1,000 miles ago",
      description: "Excellent condition CBR650R with full service history. Recent service completed at Honda dealership. New tires fitted 1,000 miles ago. Includes tail tidy, tank pad, and frame sliders. Minor scuff on right fairing. All keys and documents present.",
      dateAvailable: "Immediate",
      regNumber: "LP21 KFG",
      auctionDuration: "1day",
      status: "pending_collection",
      // Change status to pending_collection for MikeTrader to see
      soldDate: (/* @__PURE__ */ new Date()).toISOString(),
      // Add sold date
      images: [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87"
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(motorcycle1.id, motorcycle1);
    const motorcycle2 = {
      id: this.motorcycleId++,
      dealerId: dealer1.id,
      make: "Ducati",
      model: "Panigale V4",
      year: 2020,
      mileage: 3120,
      color: "Red",
      condition: "Excellent",
      engineSize: "1103cc",
      serviceHistory: "Full Ducati dealer service history",
      tyreCondition: "Good - approximately 70% remaining",
      description: "Stunning Ducati Panigale V4 in immaculate condition. One owner from new with full Ducati service history. Termignoni exhaust system and many carbon fiber upgrades. Must be seen!",
      dateAvailable: "Immediate",
      regNumber: "LD70 VXR",
      auctionDuration: "1week",
      images: [
        "https://images.unsplash.com/photo-1571646750134-28e774f5db09"
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(motorcycle2.id, motorcycle2);
    const motorcycle3 = {
      id: this.motorcycleId++,
      dealerId: dealer2.id,
      make: "BMW",
      model: "R1250GS Adventure",
      year: 2022,
      mileage: 6780,
      color: "Silver",
      condition: "Excellent",
      engineSize: "1254cc",
      serviceHistory: "Full BMW dealer service history, major service completed last month",
      tyreCondition: "Excellent - approximately 90% remaining",
      description: "BMW R1250GS Adventure in excellent condition. Full service history, with recent major service. Fitted with BMW panniers, crash bars, and GPS mount. Perfect for touring or commuting.",
      dateAvailable: "Next Week",
      regNumber: "MA22 BMW",
      auctionDuration: "2weeks",
      images: [
        "https://images.unsplash.com/photo-1558980394-dbb977039a2e"
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(motorcycle3.id, motorcycle3);
    const motorcycle4 = {
      id: this.motorcycleId++,
      dealerId: dealer2.id,
      make: "Triumph",
      model: "Street Triple RS",
      year: 2022,
      mileage: 3450,
      color: "Silver",
      condition: "Excellent",
      engineSize: "765cc",
      serviceHistory: "Full Triumph dealer service history, under warranty until 2025",
      tyreCondition: "Excellent - nearly new",
      description: "Nearly new Triumph Street Triple RS with Arrow exhaust. Full service history and still under manufacturer warranty until 2025. Quickshifter and autoblipper fitted. Tail tidy and frame sliders included.",
      dateAvailable: "Immediate",
      regNumber: "LB22 TRP",
      auctionDuration: "1week",
      images: [
        "https://images.unsplash.com/photo-1564855326639-c7de58ba929b"
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(motorcycle4.id, motorcycle4);
    const motorcycle5 = {
      id: this.motorcycleId++,
      dealerId: dealer3.id,
      make: "Kawasaki",
      model: "Z900",
      year: 2021,
      mileage: 6720,
      color: "Green",
      condition: "Good",
      engineSize: "948cc",
      serviceHistory: "Serviced regularly at Kawasaki main dealer",
      tyreCondition: "Good - approximately 70% remaining",
      description: "Kawasaki Z900 in excellent condition. Akrapovic exhaust system, tail tidy, and aftermarket levers. Regularly serviced and well maintained. Two keys and all documentation included.",
      dateAvailable: "End of the month",
      regNumber: "MA71 KWS",
      auctionDuration: "2weeks",
      images: [
        "https://images.unsplash.com/photo-1591637333472-41c9c4c4c651"
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(motorcycle5.id, motorcycle5);
    const motorcycle6 = {
      id: this.motorcycleId++,
      dealerId: trader4.id,
      // Sam's Superbikes
      make: "Triumph",
      model: "Speed Triple 1200 RS",
      year: 2023,
      mileage: 3450,
      color: "Sapphire Black",
      condition: "Excellent",
      engineSize: "1160cc",
      serviceHistory: "Full Triumph service history",
      tyreCondition: "Excellent - under 2,000 miles",
      description: "Nearly new Speed Triple with all the extras. Heated grips, quickshifter, and Arrow exhaust. Stunning condition throughout with full service history. First MOT not due until March next year.",
      dateAvailable: "Immediate",
      regNumber: "WK23 TRS",
      auctionDuration: "1week",
      images: [
        "https://images.unsplash.com/photo-1580341124464-8c6fb68d9664"
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(motorcycle6.id, motorcycle6);
    const motorcycle7 = {
      id: this.motorcycleId++,
      dealerId: trader5.id,
      // Lucy's Luxury Bikes
      make: "BMW",
      model: "R 1250 GS Adventure",
      year: 2022,
      mileage: 8790,
      color: "Triple Black",
      condition: "Very Good",
      engineSize: "1254cc",
      serviceHistory: "Full BMW dealer history",
      tyreCondition: "Good - 50% remaining",
      description: "Stunning R 1250 GS Adventure with full luggage and touring pack. Includes heated seats, heated grips, dynamic ESA, riding modes pro, and much more. Minor scuff on left pannier from previous owner.",
      dateAvailable: "Immediate",
      regNumber: "BY22 BMW",
      auctionDuration: "3days",
      images: [
        "https://images.unsplash.com/photo-1558555808-d053245e175c"
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(motorcycle7.id, motorcycle7);
    const motorcycle8 = {
      id: this.motorcycleId++,
      dealerId: dealer3.id,
      // Scott Motors
      make: "Harley-Davidson",
      model: "Fat Boy 114",
      year: 2021,
      mileage: 5230,
      color: "Vivid Black",
      condition: "Excellent",
      engineSize: "1868cc",
      serviceHistory: "Full H-D dealer history",
      tyreCondition: "Excellent",
      description: "Beautiful Fat Boy with Screamin' Eagle stage 1 tune and Vance & Hines exhaust. Meticulously maintained and stored in heated garage. Includes sissy bar, luggage rack, and windshield.",
      dateAvailable: "Immediate",
      regNumber: "HD21 FAT",
      auctionDuration: "1week",
      images: [
        "https://images.unsplash.com/photo-1572116469696-31de0f17cc34"
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(motorcycle8.id, motorcycle8);
    const oneHour = 60 * 60 * 1e3;
    const oneDay = 24 * oneHour;
    const twoDays = 2 * oneDay;
    const oneWeek = 7 * oneDay;
    const twoWeeks = 14 * oneDay;
    const now = /* @__PURE__ */ new Date();
    const oneDayFromNow = new Date(now.getTime() + oneDay);
    const twoDaysFromNow = new Date(now.getTime() + twoDays);
    const oneWeekFromNow = new Date(now.getTime() + oneWeek);
    const twoWeeksFromNow = new Date(now.getTime() + twoWeeks);
    const auction1 = {
      id: this.auctionId++,
      motorcycleId: motorcycle1.id,
      dealerId: dealer1.id,
      startTime: new Date(now.getTime() - oneHour * 12),
      // 12 hours ago
      endTime: new Date(now.getTime() - oneHour * 3),
      // 3 hours ago (auction ended)
      status: "pending_collection",
      winningBidId: 3,
      // Bid ID 3 - the highest bid
      winningBidderId: 4,
      // MikeTrader is ID 4
      bidAccepted: true,
      dealConfirmed: true,
      collectionConfirmed: false,
      collectionDate: new Date(now.getTime() + oneDay * 2).toISOString(),
      // 2 days from now
      highestBidderId: 4,
      // MikeTrader is ID 4
      visibilityType: "all",
      visibilityRadius: null,
      createdAt: new Date(now.getTime() - oneHour * 12),
      completedAt: new Date(now.getTime() - oneHour * 3).toISOString()
    };
    this.auctions.set(auction1.id, auction1);
    const auction2 = {
      id: this.auctionId++,
      motorcycleId: motorcycle2.id,
      dealerId: dealer1.id,
      startTime: new Date(now.getTime() - oneHour * 10),
      // 10 hours ago
      endTime: oneWeekFromNow,
      status: "active",
      winningBidId: null,
      winningBidderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      visibilityType: "favorites",
      visibilityRadius: null,
      createdAt: new Date(now.getTime() - oneHour * 10)
    };
    this.auctions.set(auction2.id, auction2);
    const auction3 = {
      id: this.auctionId++,
      motorcycleId: motorcycle3.id,
      dealerId: dealer2.id,
      startTime: new Date(now.getTime() - oneHour * 24),
      // 1 day ago
      endTime: twoWeeksFromNow,
      status: "active",
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
    const auction4 = {
      id: this.auctionId++,
      motorcycleId: motorcycle4.id,
      dealerId: dealer2.id,
      startTime: new Date(now.getTime() - oneHour * 12),
      // 12 hours ago
      endTime: oneWeekFromNow,
      status: "active",
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
    const auction5 = {
      id: this.auctionId++,
      motorcycleId: motorcycle5.id,
      dealerId: dealer3.id,
      startTime: new Date(now.getTime() - oneHour * 36),
      // 1.5 days ago
      endTime: twoWeeksFromNow,
      status: "active",
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
    const auction6 = {
      id: this.auctionId++,
      motorcycleId: motorcycle6.id,
      dealerId: trader4.id,
      // Sam's Superbikes
      startTime: new Date(now.getTime() - oneHour * 8),
      // 8 hours ago
      endTime: oneWeekFromNow,
      status: "active",
      winningBidId: null,
      winningBidderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      visibilityType: "all",
      visibilityRadius: null,
      createdAt: new Date(now.getTime() - oneHour * 8)
    };
    this.auctions.set(auction6.id, auction6);
    const auction7 = {
      id: this.auctionId++,
      motorcycleId: motorcycle7.id,
      dealerId: trader5.id,
      // Lucy's Luxury Bikes
      startTime: new Date(now.getTime() - oneHour * 6),
      // 6 hours ago
      endTime: twoDaysFromNow,
      status: "active",
      winningBidId: null,
      winningBidderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      visibilityType: "radius",
      visibilityRadius: 100,
      // 100 miles radius
      createdAt: new Date(now.getTime() - oneHour * 6)
    };
    this.auctions.set(auction7.id, auction7);
    const auction8 = {
      id: this.auctionId++,
      motorcycleId: motorcycle8.id,
      dealerId: dealer3.id,
      // Scott Motors
      startTime: new Date(now.getTime() - oneHour * 10),
      // 10 hours ago
      endTime: oneWeekFromNow,
      status: "active",
      winningBidId: null,
      winningBidderId: null,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      visibilityType: "favorites",
      visibilityRadius: null,
      createdAt: new Date(now.getTime() - oneHour * 10)
    };
    this.auctions.set(auction8.id, auction8);
    const bid1 = {
      id: this.bidId++,
      auctionId: auction1.id,
      dealerId: 4,
      // miketrader ID hardcoded
      amount: 6500,
      createdAt: new Date(now.getTime() - oneHour * 4)
      // 4 hours ago
    };
    this.bids.set(bid1.id, bid1);
    const bid2 = {
      id: this.bidId++,
      auctionId: auction1.id,
      dealerId: trader2.id,
      amount: 6800,
      createdAt: new Date(now.getTime() - oneHour * 3)
      // 3 hours ago
    };
    this.bids.set(bid2.id, bid2);
    const bid3 = {
      id: this.bidId++,
      auctionId: auction1.id,
      dealerId: 4,
      // miketrader ID hardcoded
      amount: 7200,
      // winning bid - increased amount
      createdAt: new Date(now.getTime() - oneHour * 2)
      // 2 hours ago
    };
    this.bids.set(bid3.id, bid3);
    const bid4 = {
      id: this.bidId++,
      auctionId: auction1.id,
      dealerId: trader3.id,
      amount: 7200,
      createdAt: new Date(now.getTime() - oneHour * 1)
      // 1 hour ago
    };
    this.bids.set(bid4.id, bid4);
    const bid5 = {
      id: this.bidId++,
      auctionId: auction2.id,
      dealerId: trader1.id,
      amount: 15500,
      createdAt: new Date(now.getTime() - oneHour * 9)
      // 9 hours ago
    };
    this.bids.set(bid5.id, bid5);
    const bid6 = {
      id: this.bidId++,
      auctionId: auction2.id,
      dealerId: trader2.id,
      amount: 16e3,
      createdAt: new Date(now.getTime() - oneHour * 7)
      // 7 hours ago
    };
    this.bids.set(bid6.id, bid6);
    const bid7 = {
      id: this.bidId++,
      auctionId: auction4.id,
      dealerId: trader1.id,
      amount: 8200,
      createdAt: new Date(now.getTime() - oneHour * 10)
      // 10 hours ago
    };
    this.bids.set(bid7.id, bid7);
    const bid8 = {
      id: this.bidId++,
      auctionId: auction4.id,
      dealerId: trader3.id,
      amount: 8500,
      createdAt: new Date(now.getTime() - oneHour * 8)
      // 8 hours ago
    };
    this.bids.set(bid8.id, bid8);
    const notification1 = {
      id: this.notificationId++,
      userId: dealer1.id,
      type: "bid",
      content: "New bid of \xA37,200 received on your Honda CBR650R auction",
      relatedId: auction1.id,
      read: false,
      createdAt: new Date(now.getTime() - oneHour * 1)
      // 1 hour ago
    };
    this.notifications.set(notification1.id, notification1);
    const notification2 = {
      id: this.notificationId++,
      userId: trader3.id,
      type: "auction_ending",
      content: "Auction for Honda CBR650R is ending soon",
      relatedId: auction1.id,
      read: false,
      createdAt: new Date(now.getTime() - oneHour * 2)
      // 2 hours ago
    };
    this.notifications.set(notification2.id, notification2);
    const notificationPendingCollection = {
      id: this.notificationId++,
      userId: 4,
      // MikeTrader ID 4
      type: "collection_pending",
      content: "Your winning bid for Honda CBR650R has been accepted. The motorcycle is ready for collection.",
      relatedId: auction1.id,
      read: false,
      createdAt: new Date(now.getTime() - oneHour * 1)
      // 1 hour ago
    };
    this.notifications.set(notificationPendingCollection.id, notificationPendingCollection);
    const notification3 = {
      id: this.notificationId++,
      userId: dealer1.id,
      type: "bid",
      content: "New bid of \xA316,000 received on your Ducati Panigale V4 auction",
      relatedId: auction2.id,
      read: true,
      createdAt: new Date(now.getTime() - oneHour * 7)
      // 7 hours ago
    };
    this.notifications.set(notification3.id, notification3);
    const notification4 = {
      id: this.notificationId++,
      userId: trader2.id,
      type: "auction_created",
      content: "New auction created for BMW R1250GS Adventure",
      relatedId: auction3.id,
      read: false,
      createdAt: new Date(now.getTime() - oneHour * 24)
      // 1 day ago
    };
    this.notifications.set(notification4.id, notification4);
    const notification5 = {
      id: this.notificationId++,
      userId: dealer2.id,
      type: "bid",
      content: "New bid of \xA38,500 received on your Triumph Street Triple RS auction",
      relatedId: auction4.id,
      read: false,
      createdAt: new Date(now.getTime() - oneHour * 8)
      // 8 hours ago
    };
    this.notifications.set(notification5.id, notification5);
    const motorcycleCompleted = {
      id: this.motorcycleId++,
      dealerId: dealer1.id,
      make: "Yamaha",
      model: "MT-09",
      year: 2021,
      mileage: 5120,
      color: "Blue",
      condition: "Excellent",
      engineSize: "889cc",
      serviceHistory: "Full Yamaha service history",
      tyreCondition: "Good - approximately 75% remaining",
      description: "Excellent Yamaha MT-09 with full service history. All standard except for a tail tidy. Perfect naked bike for daily riding.",
      dateAvailable: "End of the week",
      regNumber: "AB21 YMH",
      auctionDuration: "1week",
      status: "completed",
      // Add status for consistency
      soldDate: new Date(now.getTime() - oneDay * 5).toISOString(),
      // Add sold date 5 days ago
      images: [
        "https://images.unsplash.com/photo-1635073910167-20261559f0b3"
      ],
      createdAt: new Date(now.getTime() - oneDay * 10)
      // 10 days ago
    };
    this.motorcycles.set(motorcycleCompleted.id, motorcycleCompleted);
    const completedBidId = this.bidId++;
    const auctionCompleted = {
      id: this.auctionId++,
      motorcycleId: motorcycleCompleted.id,
      dealerId: dealer1.id,
      startTime: new Date(now.getTime() - oneDay * 10),
      // 10 days ago
      endTime: new Date(now.getTime() - oneDay * 3),
      // 3 days ago
      status: "completed",
      winningBidId: completedBidId,
      winningTraderId: trader1.id,
      bidAccepted: true,
      dealConfirmed: true,
      collectionConfirmed: false,
      collectionDate: new Date(now.getTime() + oneDay * 2),
      // 2 days from now
      highestBidderId: trader1.id,
      createdAt: new Date(now.getTime() - oneDay * 10)
    };
    this.auctions.set(auctionCompleted.id, auctionCompleted);
    const completedBid = {
      id: completedBidId,
      auctionId: auctionCompleted.id,
      traderId: trader1.id,
      amount: 8900,
      createdAt: new Date(now.getTime() - oneDay * 4)
      // 4 days ago
    };
    this.bids.set(completedBid.id, completedBid);
    const notificationBidAccepted = {
      id: this.notificationId++,
      userId: trader1.id,
      type: "bid_accepted",
      content: "Your bid of \xA38,900 for Yamaha MT-09 has been accepted by the dealer",
      relatedId: auctionCompleted.id,
      read: true,
      createdAt: new Date(now.getTime() - oneDay * 3)
      // 3 days ago
    };
    this.notifications.set(notificationBidAccepted.id, notificationBidAccepted);
    const notificationDealConfirmed = {
      id: this.notificationId++,
      userId: dealer1.id,
      type: "deal_confirmed",
      content: "The trader has confirmed the deal for Yamaha MT-09",
      relatedId: auctionCompleted.id,
      read: true,
      createdAt: new Date(now.getTime() - oneDay * 2)
      // 2 days ago
    };
    this.notifications.set(notificationDealConfirmed.id, notificationDealConfirmed);
    const notificationCollection = {
      id: this.notificationId++,
      userId: trader1.id,
      type: "collection_scheduled",
      content: "Collection of Yamaha MT-09 scheduled for " + new Date(now.getTime() + oneDay * 2).toLocaleDateString(),
      relatedId: auctionCompleted.id,
      read: false,
      createdAt: new Date(now.getTime() - oneDay * 1)
      // 1 day ago
    };
    this.notifications.set(notificationCollection.id, notificationCollection);
    const mikeMotorcycle1 = {
      id: this.motorcycleId++,
      dealerId: dealer2.id,
      make: "Kawasaki",
      model: "Ninja 650",
      year: 2020,
      mileage: 12500,
      color: "Green",
      condition: "Very good",
      engineSize: "649cc",
      serviceHistory: "Full Kawasaki dealer service history",
      tyreCondition: "Good - approximately 60% remaining",
      description: "Nice Kawasaki Ninja 650 with full service history. Great starter or commuter bike.",
      dateAvailable: "Immediate",
      regNumber: "LK20 KAW",
      price: 8500,
      auctionDuration: "3days",
      status: "pending_collection",
      soldDate: (/* @__PURE__ */ new Date()).toISOString(),
      images: [
        "https://images.unsplash.com/photo-1583137264599-cb8c87e93afb"
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(mikeMotorcycle1.id, mikeMotorcycle1);
    const mikeAuction1 = {
      id: this.auctionId++,
      motorcycleId: mikeMotorcycle1.id,
      dealerId: dealer2.id,
      startTime: new Date(now.getTime() - oneDay * 5),
      // 5 days ago
      endTime: new Date(now.getTime() - oneDay * 1),
      // 1 day ago
      status: "pending_collection",
      winningBidId: this.bidId,
      // Will be created next
      winningBidderId: trader1.id,
      // Mike's ID (trader1)
      bidAccepted: true,
      // CRITICAL: This must be true for Mike to see it!
      dealConfirmed: true,
      collectionConfirmed: false,
      collectionDate: new Date(now.getTime() + oneDay * 3).toISOString(),
      // 3 days from now
      highestBidderId: trader1.id,
      visibilityType: "all",
      visibilityRadius: null,
      createdAt: new Date(now.getTime() - oneDay * 5),
      completedAt: new Date(now.getTime() - oneDay * 1).toISOString()
    };
    this.auctions.set(mikeAuction1.id, mikeAuction1);
    const mikeBid1 = {
      id: this.bidId++,
      auctionId: mikeAuction1.id,
      dealerId: trader1.id,
      // Mike's ID
      amount: 8500,
      createdAt: new Date(now.getTime() - oneDay * 2)
      // 2 days ago
    };
    this.bids.set(mikeBid1.id, mikeBid1);
    const mikeMotorcycle2 = {
      id: this.motorcycleId++,
      dealerId: dealer3.id,
      make: "Suzuki",
      model: "GSX-R750",
      year: 2019,
      mileage: 15700,
      color: "Blue/White",
      condition: "Excellent",
      engineSize: "750cc",
      serviceHistory: "Full service history",
      tyreCondition: "Excellent - recently replaced",
      description: "Suzuki GSX-R750 in excellent condition. Includes Yoshimura exhaust and frame sliders.",
      dateAvailable: "Available next week",
      regNumber: "LJ19 SUZ",
      price: 9200,
      auctionDuration: "1week",
      status: "pending_collection",
      soldDate: (/* @__PURE__ */ new Date()).toISOString(),
      images: [
        "https://images.unsplash.com/photo-1552509040-032a10b77ded"
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(mikeMotorcycle2.id, mikeMotorcycle2);
    const mikeAuction2 = {
      id: this.auctionId++,
      motorcycleId: mikeMotorcycle2.id,
      dealerId: dealer3.id,
      startTime: new Date(now.getTime() - oneDay * 7),
      // 7 days ago
      endTime: new Date(now.getTime() - oneDay * 2),
      // 2 days ago
      status: "pending_collection",
      winningBidId: this.bidId,
      // Will be created next
      winningBidderId: trader1.id,
      // Mike's ID (trader1)
      bidAccepted: true,
      // CRITICAL: This must be true for Mike to see it!
      dealConfirmed: true,
      collectionConfirmed: false,
      collectionDate: new Date(now.getTime() + oneDay * 4).toISOString(),
      // 4 days from now
      highestBidderId: trader1.id,
      visibilityType: "all",
      visibilityRadius: null,
      createdAt: new Date(now.getTime() - oneDay * 7),
      completedAt: new Date(now.getTime() - oneDay * 2).toISOString()
    };
    this.auctions.set(mikeAuction2.id, mikeAuction2);
    const mikeBid2 = {
      id: this.bidId++,
      auctionId: mikeAuction2.id,
      dealerId: trader1.id,
      // Mike's ID
      amount: 9200,
      createdAt: new Date(now.getTime() - oneDay * 3)
      // 3 days ago
    };
    this.bids.set(mikeBid2.id, mikeBid2);
    const mikeNotification1 = {
      id: this.notificationId++,
      userId: trader1.id,
      // Mike's ID
      type: "bid_accepted",
      content: "Your bid of \xA38,500 for Kawasaki Ninja 650 has been accepted by the dealer",
      relatedId: mikeAuction1.id,
      read: false,
      createdAt: new Date(now.getTime() - oneDay * 1)
      // 1 day ago
    };
    this.notifications.set(mikeNotification1.id, mikeNotification1);
    const mikeNotification2 = {
      id: this.notificationId++,
      userId: trader1.id,
      // Mike's ID
      type: "bid_accepted",
      content: "Your bid of \xA39,200 for Suzuki GSX-R750 has been accepted by the dealer",
      relatedId: mikeAuction2.id,
      read: false,
      createdAt: new Date(now.getTime() - oneDay * 2)
      // 2 days ago
    };
    this.notifications.set(mikeNotification2.id, mikeNotification2);
    console.log("Sample data has been seeded successfully");
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  getAllUsers() {
    return this.users;
  }
  async getUserByUsername(username) {
    const lowercaseUsername = username.toLowerCase();
    console.log(`Looking for user with case-insensitive username: ${username}`);
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === lowercaseUsername) {
        console.log(`Found user with case-insensitive match: ${username} -> ${user.username}`);
        return user;
      }
    }
    console.log(`No user found with username: ${username}`);
    return void 0;
  }
  async createUser(insertUser) {
    const id = this.userId++;
    const user = {
      id,
      ...insertUser,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id, userData) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  // Motorcycle methods
  async createMotorcycle(insertMotorcycle) {
    const id = this.motorcycleId++;
    const defaults = {
      model: insertMotorcycle.model || "",
      year: insertMotorcycle.year || (/* @__PURE__ */ new Date()).getFullYear(),
      mileage: insertMotorcycle.mileage || 0,
      color: insertMotorcycle.color || "Unknown",
      condition: insertMotorcycle.condition || "Good",
      engineSize: insertMotorcycle.engineSize || "",
      description: insertMotorcycle.description || "",
      serviceHistory: insertMotorcycle.serviceHistory || "",
      tyreCondition: insertMotorcycle.tyreCondition || "",
      dateAvailable: insertMotorcycle.dateAvailable || "",
      regNumber: insertMotorcycle.regNumber || "",
      auctionDuration: insertMotorcycle.auctionDuration || "1week",
      images: insertMotorcycle.images || []
    };
    const motorcycle = {
      id,
      dealerId: insertMotorcycle.dealerId,
      make: insertMotorcycle.make || "Unknown",
      ...defaults,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.motorcycles.set(id, motorcycle);
    return motorcycle;
  }
  async getMotorcycle(id) {
    const motorcycle = this.motorcycles.get(id);
    if (!motorcycle) {
      console.log(`getMotorcycle: Motorcycle with ID ${id} not found`);
      return void 0;
    }
    console.log(`getMotorcycle: Found motorcycle ${id} with status: ${motorcycle.status}`);
    if (motorcycle.status !== "pending_collection") {
      for (const auction of this.auctions.values()) {
        if (auction.motorcycleId === id && auction.status === "pending_collection" && auction.bidAccepted) {
          console.log(`Found inconsistency: Motorcycle ${id} has status ${motorcycle.status} but its auction ${auction.id} is in pending_collection state`);
          console.log(`Auto-correcting motorcycle ${id} status to pending_collection`);
          motorcycle.status = "pending_collection";
          this.motorcycles.set(id, motorcycle);
          break;
        }
      }
    }
    return motorcycle;
  }
  async getMotorcyclesByDealerId(dealerId) {
    const result = [];
    for (const motorcycle of this.motorcycles.values()) {
      if (motorcycle.dealerId === dealerId) {
        result.push(motorcycle);
      }
    }
    return result;
  }
  async updateMotorcycle(id, motorcycleData) {
    const motorcycle = this.motorcycles.get(id);
    if (!motorcycle) {
      console.error(`Failed to update motorcycle with ID ${id}: Not found in storage`);
      return void 0;
    }
    if (motorcycleData.status) {
      console.log(`Updating motorcycle ${id} status: ${motorcycle.status} -> ${motorcycleData.status}`);
    }
    const updatedMotorcycle = { ...motorcycle, ...motorcycleData };
    if (motorcycleData.status === "pending_collection") {
      console.log(`Setting motorcycle ${id} status to pending_collection - CRITICAL STATE CHANGE`);
      updatedMotorcycle.status = "pending_collection";
    }
    this.motorcycles.set(id, updatedMotorcycle);
    const verifyMotorcycle = this.motorcycles.get(id);
    if (verifyMotorcycle && motorcycleData.status) {
      console.log(`Verified motorcycle ${id} status after update: ${verifyMotorcycle.status}`);
      if (verifyMotorcycle.status !== motorcycleData.status) {
        console.error(`Status mismatch after update! Expected: ${motorcycleData.status}, Got: ${verifyMotorcycle.status}`);
        verifyMotorcycle.status = motorcycleData.status;
        this.motorcycles.set(id, verifyMotorcycle);
      }
    }
    return updatedMotorcycle;
  }
  // Auction methods
  async createAuction(insertAuction) {
    const id = this.auctionId++;
    const startTime = insertAuction.startTime || /* @__PURE__ */ new Date();
    const auction = {
      id,
      ...insertAuction,
      startTime,
      bidAccepted: false,
      dealConfirmed: false,
      collectionConfirmed: false,
      collectionDate: null,
      highestBidderId: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.auctions.set(id, auction);
    return auction;
  }
  async getAuction(id) {
    return this.auctions.get(id);
  }
  async getAuctionWithDetails(id) {
    const auction = this.auctions.get(id);
    if (!auction) {
      console.log(`getAuctionWithDetails: Auction with ID ${id} not found`);
      return void 0;
    }
    console.log(`getAuctionWithDetails: Found auction ${id} with status: ${auction.status}`);
    const motorcycle = this.motorcycles.get(auction.motorcycleId);
    if (!motorcycle) {
      console.log(`getAuctionWithDetails: Could not find motorcycle ${auction.motorcycleId} for auction ${id}`);
      return void 0;
    }
    if (auction.status === "pending_collection" && auction.bidAccepted && motorcycle.status !== "pending_collection") {
      console.log(`Status inconsistency detected: Auction ${id} is pending_collection but motorcycle ${motorcycle.id} has status ${motorcycle.status}`);
      console.log(`Auto-fixing motorcycle ${motorcycle.id} status to pending_collection`);
      motorcycle.status = "pending_collection";
      this.motorcycles.set(motorcycle.id, motorcycle);
    }
    const bids2 = await this.getBidsByAuctionId(id);
    let currentBid = void 0;
    if (bids2.length > 0) {
      currentBid = Math.max(...bids2.map((bid) => bid.amount));
    }
    return {
      ...auction,
      motorcycle,
      bids: bids2,
      currentBid,
      totalBids: bids2.length
    };
  }
  async getActiveAuctions(currentUserId = null) {
    const now = /* @__PURE__ */ new Date();
    const result = [];
    const currentUser = currentUserId ? await this.getUser(currentUserId) : null;
    for (const auction of this.auctions.values()) {
      if (auction.status === "active" && now < auction.endTime) {
        const isVisible = await this.isAuctionVisibleToUser(auction, currentUser);
        if (isVisible) {
          const details = await this.getAuctionWithDetails(auction.id);
          if (details) {
            result.push(details);
          }
        }
      }
    }
    return result.sort((a, b) => {
      if (!a.endTime || !b.endTime) return 0;
      return a.endTime.getTime() - b.endTime.getTime();
    });
  }
  // Helper method to check if an auction is visible to a specific user
  async isAuctionVisibleToUser(auction, user) {
    if (!user) {
      return auction.visibilityType === "all";
    }
    if (auction.dealerId === user.id) {
      return true;
    }
    switch (auction.visibilityType) {
      case "all":
        return true;
      case "favorites":
        const sellerUser = await this.getUser(auction.dealerId);
        if (!sellerUser || !sellerUser.favoriteDealers) {
          return false;
        }
        return sellerUser.favoriteDealers.includes(user.id);
      case "radius":
        if (!auction.visibilityRadius) {
          return false;
        }
        return auction.visibilityRadius > 100 || user.id % 2 === 0;
      default:
        return false;
    }
  }
  async getAuctionsByDealerId(dealerId) {
    const result = [];
    for (const auction of this.auctions.values()) {
      if (auction.dealerId === dealerId) {
        const details = await this.getAuctionWithDetails(auction.id);
        if (details) {
          result.push(details);
        }
      }
    }
    return result.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
  async updateAuction(id, auctionData) {
    const auction = this.auctions.get(id);
    if (!auction) return void 0;
    const updatedAuction = { ...auction, ...auctionData };
    this.auctions.set(id, updatedAuction);
    return updatedAuction;
  }
  async deleteAuction(id, dealerId) {
    const auction = this.auctions.get(id);
    if (!auction || auction.dealerId !== dealerId) {
      return false;
    }
    const hasBids = Array.from(this.bids.values()).some((b) => b.auctionId === auction.id);
    if (hasBids) {
      return false;
    }
    const motorcycle = this.motorcycles.get(auction.motorcycleId);
    if (motorcycle && motorcycle.dealerId === dealerId) {
      this.motorcycles.delete(auction.motorcycleId);
    }
    this.auctions.delete(id);
    return true;
  }
  async archiveAuctionAsNoSale(id, dealerId) {
    const auction = this.auctions.get(id);
    if (!auction || auction.dealerId !== dealerId) {
      return void 0;
    }
    if (auction.status !== "active" && auction.status !== "pending") {
      return void 0;
    }
    const updatedAuction = {
      ...auction,
      status: "no_sale",
      completedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.auctions.set(id, updatedAuction);
    const motorcycle = this.motorcycles.get(auction.motorcycleId);
    if (motorcycle) {
      const updatedMotorcycle = { ...motorcycle, status: "available" };
      this.motorcycles.set(motorcycle.id, updatedMotorcycle);
    }
    return updatedAuction;
  }
  // Bid methods
  async createBid(insertBid) {
    const id = this.bidId++;
    const bid = {
      id,
      ...insertBid,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.bids.set(id, bid);
    const auction = await this.getAuction(insertBid.auctionId);
    if (auction) {
      const highestBid = await this.getHighestBidForAuction(insertBid.auctionId);
      if (highestBid) {
        await this.updateAuction(auction.id, { highestBidderId: highestBid.dealerId });
      }
    }
    return bid;
  }
  async getBid(id) {
    return this.bids.get(id);
  }
  async getBidsByAuctionId(auctionId) {
    const result = [];
    for (const bid of this.bids.values()) {
      if (bid.auctionId === auctionId) {
        result.push(bid);
      }
    }
    return result.sort((a, b) => b.amount - a.amount);
  }
  async getHighestBidForAuction(auctionId) {
    const bids2 = await this.getBidsByAuctionId(auctionId);
    if (bids2.length === 0) return void 0;
    return bids2.reduce((highest, current) => {
      return current.amount > highest.amount ? current : highest;
    }, bids2[0]);
  }
  async getBidsByDealerId(dealerId) {
    const result = [];
    for (const bid of this.bids.values()) {
      if (bid.dealerId === dealerId) {
        result.push(bid);
      }
    }
    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }
  async getAuctionsWithBidsByDealer(dealerId) {
    console.log(`Getting auctions with bids for dealer ${dealerId}`);
    const dealerBids = await this.getBidsByDealerId(dealerId);
    const bidAuctionIds = /* @__PURE__ */ new Set();
    for (const bid of dealerBids) {
      bidAuctionIds.add(bid.auctionId);
    }
    console.log(`Found ${dealerBids.length} bids from dealer ${dealerId} on ${bidAuctionIds.size} auctions`);
    const allAuctions = Array.from(this.auctions.values());
    const regularBidAuctions = [];
    for (const auctionId of bidAuctionIds) {
      const auctionDetails = await this.getAuctionWithDetails(auctionId);
      if (auctionDetails) {
        console.log(`Checking bid auction ${auctionDetails.id} - status: ${auctionDetails.status}, bidAccepted: ${auctionDetails.bidAccepted}, winningBidderId: ${auctionDetails.winningBidderId}`);
        if (!(auctionDetails.status === "pending_collection" && auctionDetails.bidAccepted === true && auctionDetails.winningBidderId === dealerId)) {
          const hasBids = auctionDetails.bids.some((bid) => bid.dealerId === dealerId);
          if (hasBids) {
            console.log(`Adding auction ${auctionDetails.id} to regular bids list (user ${dealerId} has placed bids)`);
            regularBidAuctions.push(auctionDetails);
          }
        }
      }
    }
    const pendingCollectionAuctions = [];
    for (const auction of allAuctions) {
      if ((auction.status === "pending_collection" || auction.bidAccepted === true) && auction.winningBidderId === dealerId) {
        console.log(`Found pending collection auction ${auction.id} for dealer ${dealerId} - status: ${auction.status}, bidAccepted: ${auction.bidAccepted}`);
        const auctionDetails = await this.getAuctionWithDetails(auction.id);
        if (auctionDetails) {
          const motorcycle = await this.getMotorcycle(auctionDetails.motorcycleId);
          if (motorcycle && motorcycle.status !== "pending_collection") {
            console.log(`Auto-correcting motorcycle ${auctionDetails.motorcycleId} status to pending_collection`);
            await this.updateMotorcycle(auctionDetails.motorcycleId, {
              status: "pending_collection",
              soldDate: motorcycle.soldDate || (/* @__PURE__ */ new Date()).toISOString()
            });
            auctionDetails.motorcycle.status = "pending_collection";
            auctionDetails.motorcycle.soldDate = motorcycle.soldDate || (/* @__PURE__ */ new Date()).toISOString();
          }
          const alreadyAdded = pendingCollectionAuctions.some((a) => a.id === auction.id);
          if (!alreadyAdded) {
            console.log(`Adding auction ${auctionDetails.id} to pending collection list`);
            pendingCollectionAuctions.push(auctionDetails);
          }
        }
      }
    }
    const completedAuctions = [];
    for (const auction of allAuctions) {
      if (auction.status === "completed" && auction.winningBidderId === dealerId) {
        console.log(`Found completed auction ${auction.id} for dealer ${dealerId} - status: ${auction.status}, bidAccepted: ${auction.bidAccepted}`);
        const auctionDetails = await this.getAuctionWithDetails(auction.id);
        if (auctionDetails) {
          const motorcycle = await this.getMotorcycle(auctionDetails.motorcycleId);
          if (motorcycle && motorcycle.status !== "sold") {
            console.log(`Auto-correcting motorcycle ${auctionDetails.motorcycleId} status to sold`);
            await this.updateMotorcycle(auctionDetails.motorcycleId, {
              status: "sold",
              soldDate: motorcycle.soldDate || auctionDetails.completedAt || (/* @__PURE__ */ new Date()).toISOString()
            });
            auctionDetails.motorcycle.status = "sold";
            auctionDetails.motorcycle.soldDate = motorcycle.soldDate || auctionDetails.completedAt || (/* @__PURE__ */ new Date()).toISOString();
          }
          const alreadyAdded = completedAuctions.some((a) => a.id === auction.id);
          if (!alreadyAdded) {
            console.log(`Adding auction ${auctionDetails.id} to completed auctions list`);
            completedAuctions.push(auctionDetails);
          }
        }
      }
    }
    const combinedAuctions = [...pendingCollectionAuctions, ...completedAuctions, ...regularBidAuctions];
    console.log(`Returning ${combinedAuctions.length} auctions for dealer ${dealerId} (${pendingCollectionAuctions.length} pending collection, ${completedAuctions.length} completed, ${regularBidAuctions.length} regular bids)`);
    return combinedAuctions;
  }
  // Message methods
  async createMessage(insertMessage) {
    const id = this.messageId++;
    const message = {
      id,
      ...insertMessage,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.messages.set(id, message);
    return message;
  }
  async getMessagesBetweenUsers(userId1, userId2) {
    const result = [];
    for (const message of this.messages.values()) {
      if (message.senderId === userId1 && message.receiverId === userId2 || message.senderId === userId2 && message.receiverId === userId1) {
        result.push(message);
      }
    }
    return result.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }
  async getAllMessagesForUser(userId) {
    const result = [];
    for (const message of this.messages.values()) {
      if (message.senderId === userId || message.receiverId === userId) {
        result.push(message);
      }
    }
    return result.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
  async markMessageAsRead(messageId, userId) {
    const message = this.messages.get(messageId);
    if (!message) return void 0;
    if (message.receiverId !== userId) return void 0;
    message.read = true;
    return message;
  }
  async getUnreadMessageCount(userId) {
    let count = 0;
    for (const message of this.messages.values()) {
      if (message.receiverId === userId && !message.read) {
        count++;
      }
    }
    return count;
  }
  // Notification methods
  async createNotification(insertNotification) {
    const id = this.notificationId++;
    const notification = {
      id,
      ...insertNotification,
      read: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }
  async getNotificationsByUserId(userId) {
    const result = [];
    for (const notification of this.notifications.values()) {
      if (notification.userId === userId) {
        result.push(notification);
      }
    }
    return result.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
  async markNotificationAsRead(id) {
    const notification = this.notifications.get(id);
    if (!notification) return void 0;
    notification.read = true;
    return notification;
  }
  // Data management methods
  resetIds() {
    this.userId = 1;
    this.motorcycleId = 1;
    this.auctionId = 1;
    this.bidId = 1;
    this.messageId = 1;
    this.notificationId = 1;
    console.log("All ID counters have been reset to 1");
  }
  // Helper methods
  async comparePasswords(supplied, stored) {
    return comparePasswords(supplied, stored);
  }
};
var storage = new MemStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import createMemoryStore from "memorystore";
import crypto from "crypto";

// server/deployment-config.ts
var isProduction = process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "true" || process.env.REPLIT_ENVIRONMENT === "production" || process.env.REPL_SLUG === "trade-bikes-jameslacon1" || !!process.env.REPL_DEPLOYMENT_ID;
console.log("\u26A1 Deployment Environment Info:");
console.log(`  \u251C\u2500 NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
console.log(`  \u251C\u2500 REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT || "not set"}`);
console.log(`  \u251C\u2500 REPLIT_ENVIRONMENT: ${process.env.REPLIT_ENVIRONMENT || "not set"}`);
console.log(`  \u251C\u2500 REPL_SLUG: ${process.env.REPL_SLUG || "not set"}`);
console.log(`  \u251C\u2500 REPL_DEPLOYMENT_ID: ${process.env.REPL_DEPLOYMENT_ID || "not set"}`);
console.log(`  \u2514\u2500 isProduction: ${isProduction ? "true" : "false"}`);
var cookieConfig = {
  // Session cookie settings
  session: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1e3,
    // 24 hours
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction
    // true in production, false in development
  },
  // Browser-readable cookie settings
  browser: {
    httpOnly: false,
    // Readable by JavaScript
    maxAge: 24 * 60 * 60 * 1e3,
    // 24 hours
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction
    // true in production, false in development
  }
};
var corsConfig = {
  // List of allowed origins for cross-domain requests
  allowedOrigins: [
    // Main deployment domains
    "https://trade-bikes-jameslacon1.replit.app",
    "https://trade-bikes-jameslacon1.repl.co",
    // Legacy and alternative domains
    "https://trade-bikes.jameslacon1.repl.co",
    // Development domains
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    // Replit Janeway domains (editor preview)
    /^https:\/\/[a-f0-9-]+-[a-z0-9]+\.janeway\.replit\.dev$/,
    // General Replit domains for deployments
    /^https:\/\/.*\.replit\.app$/,
    /^https:\/\/.*\.repl\.co$/
  ],
  // Other CORS options
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  exposedHeaders: ["set-cookie"],
  optionsSuccessStatus: 200
};
console.log(`Application environment: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);
console.log(`Cookie settings: sameSite=${cookieConfig.session.sameSite}, secure=${cookieConfig.session.secure}`);
console.log(`Allowed origins:`, corsConfig.allowedOrigins.map(
  (origin) => origin instanceof RegExp ? origin.toString() : origin
).join(", "));

// server/auth.ts
var MemoryStore2 = createMemoryStore(session2);
var debugSession = (req) => {
  try {
    console.log("DEBUG SESSION:", {
      id: req.sessionID,
      cookie: JSON.stringify(req.session.cookie),
      passport: req.session.passport ? "Exists" : "Missing",
      user: req.user ? "Authenticated" : "Unauthenticated"
    });
  } catch (e) {
    console.log("Error debugging session:", e);
  }
};
function setupAuth(app2) {
  const sessionStore = new MemoryStore2({
    checkPeriod: 864e5
    // prune expired entries every 24h
  });
  const sessionSecret = process.env.SESSION_SECRET || "tradebikes-secret-key";
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const sessionSettings = {
    secret: sessionSecret,
    resave: true,
    // Changed to true to ensure session is saved on every request
    saveUninitialized: true,
    // Set to true for better compatibility with browser refreshes
    store: sessionStore,
    cookie: {
      ...cookieConfig.session,
      // Explicitly cast the sameSite value for TypeScript
      sameSite: cookieConfig.session.sameSite
    },
    // For Replit deployment, allow sessions without full security in dev
    proxy: true,
    name: "tradebikes.sid",
    // Custom session name to avoid conflicts
    rolling: true
    // Extends session lifetime on each request
  };
  app2.set("trust proxy", 1);
  app2.use((req, res, next) => {
    res.cookie("XSRF-TOKEN", crypto.randomUUID(), {
      httpOnly: false,
      // Must be readable by JavaScript
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/"
    });
    next();
  });
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Authenticating user: ${username}`);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Incorrect username" });
        }
        console.log(`User found, validating password for: ${username}`);
        const isPasswordValid = await storage.comparePasswords(password, user.password);
        if (!isPasswordValid) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false, { message: "Incorrect password" });
        }
        console.log(`Password validated for user: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`Authentication error for ${username}:`, error);
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => {
    console.log(`Serializing user: ${user.username} (${user.id})`);
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      console.log(`Deserializing user ID: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`User not found during deserialization. ID: ${id}`);
        return done(null, false);
      }
      console.log(`User deserialized successfully: ${user.username}`);
      done(null, user);
    } catch (error) {
      console.error(`Error deserializing user (ID: ${id}):`, error);
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt:", req.body.username);
      const { username, password, email, companyName, phone, address, city, postcode } = req.body;
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log(`Registration failed - username already exists: ${username}`);
        return res.status(400).json({ message: "Username already exists" });
      }
      console.log(`Creating new user: ${username}`);
      const user = await storage.createUser({
        username,
        password,
        email,
        role: "dealer",
        // Force role to be dealer
        companyName,
        phone,
        address,
        city,
        postcode,
        // Set default values for new users
        favoriteDealers: []
        // Note: rating and totalRatings are managed internally by the storage system
      });
      console.log(`User created successfully: ${username} (ID: ${user.id})`);
      const { password: _, ...userWithoutPassword } = user;
      const userData = {
        ...userWithoutPassword,
        _ts: (/* @__PURE__ */ new Date()).getTime()
        // Add timestamp to force client cache invalidation
      };
      req.login(user, (err) => {
        if (err) {
          console.error(`Error during auto-login for new user: ${username}`, err);
          return next(err);
        }
        console.log(`New user logged in: ${username}`);
        debugSession(req);
        res.cookie("loggedIn", "true", {
          ...cookieConfig.browser,
          sameSite: cookieConfig.browser.sameSite
        });
        res.status(201).json(userData);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    console.log(`Login attempt for username: ${req.body.username}`);
    passport.authenticate("local", (err, user, info = {}) => {
      if (err) {
        console.error("Login authentication error:", err);
        return next(err);
      }
      if (!user) {
        console.log("Login failed:", info.message || "Authentication failed");
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      console.log(`User authenticated successfully: ${user.username}`);
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login session error:", loginErr);
          return next(loginErr);
        }
        console.log(`Login session created for: ${user.username}`);
        debugSession(req);
        const { password, ...userWithoutPassword } = user;
        const userData = {
          ...userWithoutPassword,
          _ts: (/* @__PURE__ */ new Date()).getTime()
          // Add timestamp to force client cache invalidation
        };
        res.cookie("loggedIn", "true", {
          ...cookieConfig.browser,
          sameSite: cookieConfig.browser.sameSite
        });
        return res.status(200).json(userData);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    console.log("GET /api/user - Auth status:", req.isAuthenticated());
    debugSession(req);
    if (!req.isAuthenticated()) {
      console.log("User not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    }
    console.log("User authenticated:", req.user?.username);
    const { password, ...userWithoutPassword } = req.user;
    const userData = {
      ...userWithoutPassword,
      _ts: (/* @__PURE__ */ new Date()).getTime()
      // Add timestamp to force client cache invalidation
    };
    res.json(userData);
  });
}

// server/websocket.ts
import { WebSocketServer, WebSocket } from "ws";
var clients = /* @__PURE__ */ new Map();
function setupWebSocket(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    clientTracking: true,
    // Use simpler configuration for better cross-domain support
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      serverNoContextTakeover: true,
      clientNoContextTakeover: true,
      threshold: 1024
    }
  });
  function heartbeat() {
    console.log("WebSocket heartbeat received");
    this.isAlive = true;
  }
  const interval = setInterval(() => {
    console.log(`Checking WebSocket connections (active: ${clients.size}, total: ${wss.clients.size})`);
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log("Terminating inactive WebSocket connection");
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping(() => {
      });
    });
  }, 2e4);
  wss.on("close", () => {
    clearInterval(interval);
    console.log("WebSocket server closed");
  });
  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });
  wss.on("connection", (ws, req) => {
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const origin = req.headers.origin || "unknown";
    console.log(`WebSocket connection established - IP: ${clientIp}, Origin: ${origin}`);
    console.log(`WebSocket headers:`, JSON.stringify(req.headers, null, 2));
    try {
      ws.send(JSON.stringify({
        type: "CONNECTED",
        data: { message: "Connected to TradeBikes WebSocket server" },
        timestamp: Date.now()
      }));
      console.log("Sent welcome message to client");
    } catch (e) {
      console.error("Error sending welcome message:", e);
    }
    ws.isAlive = true;
    ws.on("pong", heartbeat);
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("Received WebSocket message:", data.type);
        const userId = data.data?.userId;
        if (userId) {
          clients.set(userId, ws);
          console.log(`User ${userId} connection stored`);
        }
        switch (data.type) {
          case "register":
            if (data.data?.userId) {
              clients.set(data.data.userId, ws);
              console.log(`User ${data.data.userId} registered with WebSocket`);
              ws.send(JSON.stringify({
                type: "register_confirmed",
                data: { userId: data.data.userId },
                timestamp: Date.now()
              }));
            }
            break;
          case "ping":
            ws.send(JSON.stringify({
              type: "pong",
              data: {},
              timestamp: Date.now()
            }));
            break;
          case "new_bid":
            await handleNewBid(data);
            break;
          case "auction_ending":
            break;
          case "underwrite_completed":
            await handleUnderwriteCompleted(data);
            break;
          case "new_message":
            await handleNewMessage(data);
            break;
          case "auction_created":
            await handleAuctionCreated(data);
            break;
          case "bid_accepted":
            await handleBidAccepted(data);
            break;
          case "deal_confirmed":
            await handleDealConfirmed(data);
            break;
          case "collection_scheduled":
            await handleCollectionScheduled(data);
            break;
          case "collection_confirmed":
            await handleCollectionConfirmed(data);
            break;
          case "date_extended":
            await handleDateExtended(data);
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
    ws.on("close", (code, reason) => {
      console.log(`WebSocket connection closed: code=${code}, reason=${reason || "unknown"}, clean=${code === 1e3 || code === 1001}`);
      let codeMeaning = "Unknown";
      switch (code) {
        case 1e3:
          codeMeaning = "Normal Closure";
          break;
        case 1001:
          codeMeaning = "Going Away";
          break;
        case 1002:
          codeMeaning = "Protocol Error";
          break;
        case 1003:
          codeMeaning = "Unsupported Data";
          break;
        case 1005:
          codeMeaning = "No Status Received";
          break;
        case 1006:
          codeMeaning = "Abnormal Closure";
          break;
        case 1007:
          codeMeaning = "Invalid Frame Payload Data";
          break;
        case 1008:
          codeMeaning = "Policy Violation";
          break;
        case 1009:
          codeMeaning = "Message Too Big";
          break;
        case 1010:
          codeMeaning = "Mandatory Extension";
          break;
        case 1011:
          codeMeaning = "Internal Server Error";
          break;
        case 1012:
          codeMeaning = "Service Restart";
          break;
        case 1013:
          codeMeaning = "Try Again Later";
          break;
        case 1014:
          codeMeaning = "Bad Gateway";
          break;
        case 1015:
          codeMeaning = "TLS Handshake";
          break;
      }
      console.log(`WebSocket close code ${code} meaning: ${codeMeaning}`);
      Array.from(clients.entries()).forEach(([userId, client]) => {
        if (client === ws) {
          clients.delete(userId);
          console.log(`User ${userId} disconnected from WebSocket`);
        }
      });
    });
  });
  return wss;
}
function sendToUser(userId, message) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}
function broadcast(message, excludeUserId) {
  Array.from(clients.entries()).forEach(([userId, client]) => {
    if (excludeUserId && userId === excludeUserId) return;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
async function handleNewBid(message) {
  const { auctionId, dealerId, bidId, amount } = message.data;
  try {
    const auction = await storage.getAuction(auctionId);
    if (!auction) return;
    const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
    if (!motorcycle) return;
    const sellerNotificationContent = `New bid received on your underwrite`;
    await storage.createNotification({
      userId: auction.dealerId,
      type: "bid",
      content: sellerNotificationContent,
      relatedId: auctionId
    });
    const bidderNotificationContent = `Your bid on ${motorcycle.make} ${motorcycle.model} has been placed`;
    await storage.createNotification({
      userId: dealerId,
      type: "bid_placed",
      content: bidderNotificationContent,
      relatedId: auctionId
    });
    sendToUser(auction.dealerId, {
      type: "new_bid",
      data: {
        auctionId,
        dealerId,
        bidId,
        amount,
        motorcycle
      },
      timestamp: Date.now()
    });
    sendToUser(dealerId, {
      type: "bid_placed",
      data: {
        auctionId,
        dealerId,
        bidId,
        amount,
        motorcycle
      },
      timestamp: Date.now()
    });
    sendToUser(auction.dealerId, {
      type: "refresh_stats",
      data: {},
      timestamp: Date.now()
    });
    sendToUser(dealerId, {
      type: "refresh_stats",
      data: {},
      timestamp: Date.now()
    });
    broadcast({
      type: "auction_updated",
      data: {
        auctionId
      },
      timestamp: Date.now()
    }, dealerId);
  } catch (error) {
    console.error("Error handling new bid:", error);
  }
}
async function handleUnderwriteCompleted(message) {
  const { auctionId } = message.data;
  try {
    const auction = await storage.getAuction(auctionId);
    if (!auction) return;
    const highestBid = await storage.getHighestBidForAuction(auctionId);
    const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
    if (highestBid) {
      await storage.updateAuction(auctionId, {
        status: "pending_collection",
        winningBidId: highestBid.id,
        winningBidderId: highestBid.dealerId
      });
      await storage.createNotification({
        userId: auction.dealerId,
        type: "underwrite_completed",
        content: `Your underwrite for ${motorcycle?.make} ${motorcycle?.model} has ended with a winning bid of \xA3${highestBid.amount}`,
        relatedId: auctionId
      });
      await storage.createNotification({
        userId: highestBid.dealerId,
        type: "underwrite_completed",
        content: `Congratulations! You won the underwrite for ${motorcycle?.make} ${motorcycle?.model} with a bid of \xA3${highestBid.amount}`,
        relatedId: auctionId
      });
      sendToUser(auction.dealerId, {
        type: "underwrite_completed",
        data: {
          auctionId,
          winningBid: highestBid.amount,
          winningBidderId: highestBid.dealerId
        },
        timestamp: Date.now()
      });
      sendToUser(highestBid.dealerId, {
        type: "underwrite_completed",
        data: {
          auctionId,
          winningBid: highestBid.amount,
          motorcycle
        },
        timestamp: Date.now()
      });
    } else {
      await storage.updateAuction(auctionId, {
        status: "completed"
      });
      await storage.createNotification({
        userId: auction.dealerId,
        type: "underwrite_completed",
        content: `Your underwrite for ${motorcycle?.make} ${motorcycle?.model} has ended with no bids`,
        relatedId: auctionId
      });
      sendToUser(auction.dealerId, {
        type: "underwrite_completed",
        data: {
          auctionId,
          noBids: true
        },
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error("Error handling underwrite completed:", error);
  }
}
async function handleNewMessage(message) {
  const { senderId, receiverId, content, auctionId } = message.data;
  try {
    const newMessage = await storage.createMessage({
      senderId,
      receiverId,
      content,
      auctionId: auctionId || null
    });
    const sender = await storage.getUser(senderId);
    await storage.createNotification({
      userId: receiverId,
      type: "message",
      content: `New message from ${sender?.companyName}`,
      relatedId: newMessage.id
    });
    sendToUser(receiverId, {
      type: "new_message",
      data: {
        messageId: newMessage.id,
        senderId,
        senderName: sender?.companyName,
        content,
        auctionId,
        timestamp: newMessage.createdAt
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error handling new message:", error);
  }
}
async function handleAuctionCreated(message) {
  const { auctionId, dealerId } = message.data;
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) return;
    await Promise.all(Array.from(clients.entries()).map(async ([userId, client]) => {
      try {
        const user = await storage.getUser(userId);
        if (user && user.role === "bidder" && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "underwrite_created",
            data: {
              auction
            },
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error(`Error sending underwrite_created to user ${userId}:`, error);
      }
    }));
  } catch (error) {
    console.error("Error handling underwrite created:", error);
  }
}
async function handleBidAccepted(message) {
  const { auctionId, dealerId, bidderId, motorcycleId } = message.data;
  try {
    console.log(`Processing bid acceptance for auction ${auctionId}, from dealer ${dealerId} to bidder ${bidderId}, motorcycle ${motorcycleId}`);
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) {
      console.error(`Cannot find auction with ID ${auctionId} for bid acceptance`);
      return;
    }
    const motoId = motorcycleId || auction.motorcycle.id;
    const currentMotorcycle = await storage.getMotorcycle(motoId);
    if (!currentMotorcycle) {
      console.error(`Cannot find motorcycle with ID ${motoId} for bid acceptance`);
      return;
    }
    console.log(`Motorcycle ${motoId} current status: ${currentMotorcycle.status}`);
    const updatedMotorcycle = await storage.updateMotorcycle(motoId, {
      status: "pending_collection"
    });
    if (!updatedMotorcycle) {
      console.error(`Failed to update motorcycle ${motoId} status for bid acceptance`);
    } else {
      console.log(`Updated motorcycle ${motoId} status to 'pending_collection'`);
    }
    const verifiedMotorcycle = await storage.getMotorcycle(motoId);
    console.log(`Verified motorcycle ${motoId} status after update: ${verifiedMotorcycle?.status}`);
    if (verifiedMotorcycle && verifiedMotorcycle.status !== "pending_collection") {
      console.log(`Retrying motorcycle ${motoId} status update - current status: ${verifiedMotorcycle.status}`);
      await storage.updateMotorcycle(motoId, {
        status: "pending_collection"
      });
    }
    if (auction.status !== "pending_collection") {
      await storage.updateAuction(auctionId, {
        status: "pending_collection"
      });
      console.log(`Updated auction ${auctionId} status to 'pending_collection'`);
    }
    await storage.createNotification({
      userId: bidderId,
      type: "bid_accepted",
      content: `Your bid on ${auction.motorcycle.make} ${auction.motorcycle.model} has been accepted by the dealer.`,
      relatedId: auctionId
    });
    const updatedMotorcycleData = {
      ...auction.motorcycle,
      status: "pending_collection"
    };
    console.log("Sending detailed motorcycle data with status update:", updatedMotorcycleData);
    sendToUser(bidderId, {
      type: "bid_accepted",
      data: {
        auctionId,
        dealerId,
        motorcycleId: auction.motorcycle.id,
        motorcycle: updatedMotorcycleData,
        amount: auction.currentBid,
        make: auction.motorcycle.make,
        model: auction.motorcycle.model,
        year: auction.motorcycle.year
      },
      timestamp: Date.now()
    });
    sendToUser(dealerId, {
      type: "bid_accepted_confirm",
      data: {
        auctionId,
        bidderId,
        motorcycleId: auction.motorcycle.id,
        motorcycle: updatedMotorcycleData,
        amount: auction.currentBid,
        auction: {
          id: auctionId,
          status: "pending_collection"
        }
      },
      timestamp: Date.now()
    });
    broadcast({
      type: "auction_status_changed",
      data: {
        auctionId,
        newStatus: "pending_collection",
        motorcycleId: auction.motorcycle.id,
        motorcycle: updatedMotorcycleData
      },
      timestamp: Date.now()
    });
    console.log(`Bid acceptance processed successfully for auction ${auctionId}`);
  } catch (error) {
    console.error("Error handling bid accepted:", error);
  }
}
async function handleDealConfirmed(message) {
  const { auctionId, dealerId, bidderId } = message.data;
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) return;
    await storage.createNotification({
      userId: dealerId,
      type: "deal_confirmed",
      content: `The buyer has confirmed the deal for ${auction.motorcycle.make} ${auction.motorcycle.model}. Please schedule a collection date.`,
      relatedId: auctionId
    });
    sendToUser(dealerId, {
      type: "deal_confirmed",
      data: {
        auctionId,
        bidderId,
        motorcycle: auction.motorcycle
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error handling deal confirmed:", error);
  }
}
async function handleCollectionScheduled(message) {
  const { auctionId, dealerId, bidderId, collectionDate } = message.data;
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) return;
    await storage.createNotification({
      userId: bidderId,
      type: "collection_scheduled",
      content: `Collection for ${auction.motorcycle.make} ${auction.motorcycle.model} has been scheduled for ${new Date(collectionDate).toLocaleDateString()}.`,
      relatedId: auctionId
    });
    sendToUser(bidderId, {
      type: "collection_scheduled",
      data: {
        auctionId,
        dealerId,
        motorcycle: auction.motorcycle,
        collectionDate
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error handling collection scheduled:", error);
  }
}
async function handleCollectionConfirmed(message) {
  const { auctionId, dealerId, bidderId } = message.data;
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) return;
    await storage.createNotification({
      userId: dealerId,
      type: "collection_confirmed",
      content: `The buyer has confirmed collection of ${auction.motorcycle.make} ${auction.motorcycle.model}. The transaction is now complete.`,
      relatedId: auctionId
    });
    sendToUser(dealerId, {
      type: "collection_confirmed",
      data: {
        auctionId,
        bidderId,
        motorcycle: auction.motorcycle
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error handling collection confirmed:", error);
  }
}
async function handleDateExtended(message) {
  const { auctionId, motorcycleId, sellerId, bidderId, newAvailabilityDate } = message.data;
  try {
    const auction = await storage.getAuctionWithDetails(auctionId);
    if (!auction) {
      console.error("Missing auction data for date extension");
      return;
    }
    const formattedDate = new Date(newAvailabilityDate).toLocaleDateString();
    if (bidderId) {
      await storage.createNotification({
        userId: bidderId,
        type: "date_extended",
        content: `The seller has extended the availability date for ${auction.motorcycle.make} ${auction.motorcycle.model} to ${formattedDate}.`,
        relatedId: auctionId
      });
      sendToUser(bidderId, {
        type: "date_extended",
        data: {
          auctionId,
          sellerId,
          motorcycle: auction.motorcycle,
          newAvailabilityDate
        },
        timestamp: Date.now()
      });
    }
    console.log(`Date extension notification sent for auction ${auctionId}`);
  } catch (error) {
    console.error("Error handling date extension:", error);
  }
}

// shared/schema.ts
import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("dealer"),
  // All users are dealers
  companyName: text("company_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  postcode: text("postcode"),
  rating: integer("rating").default(0),
  // 0-5 rating
  totalRatings: integer("total_ratings").default(0),
  favoriteDealers: integer("favorite_dealers").array(),
  // Array of dealer IDs marked as favorites
  createdAt: timestamp("created_at").defaultNow()
});
var motorcycles = pgTable("motorcycles", {
  id: serial("id").primaryKey(),
  dealerId: integer("dealer_id").notNull(),
  // foreign key to users
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  mileage: integer("mileage").notNull(),
  color: text("color").notNull(),
  condition: text("condition").notNull(),
  // e.g. Excellent, Good, Fair, Poor
  engineSize: text("engine_size"),
  // e.g. 650cc
  description: text("description"),
  serviceHistory: text("service_history"),
  tyreCondition: text("tyre_condition"),
  dateAvailable: text("date_available"),
  regNumber: text("reg_number"),
  auctionDuration: text("auction_duration"),
  // "1day", "1week", "2weeks", "1month"
  images: text("images").array(),
  // URLs of uploaded images
  status: text("status").default("available"),
  // available, pending, sold
  soldDate: text("sold_date"),
  // Date when the motorcycle was sold
  createdAt: timestamp("created_at").defaultNow()
});
var auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  motorcycleId: integer("motorcycle_id").notNull(),
  // foreign key to motorcycles
  dealerId: integer("dealer_id").notNull(),
  // foreign key to users (seller)
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("pending"),
  // pending, active, completed, cancelled
  winningBidId: integer("winning_bid_id"),
  // foreign key to bids
  winningBidderId: integer("winning_bidder_id"),
  // foreign key to users (winning dealer/buyer)
  bidAccepted: boolean("bid_accepted").default(false),
  // seller has accepted the winning bid
  dealConfirmed: boolean("deal_confirmed").default(false),
  // both parties confirmed the deal
  collectionConfirmed: boolean("collection_confirmed").default(false),
  // buyer has confirmed collection
  collectionDate: timestamp("collection_date"),
  // scheduled collection date
  highestBidderId: integer("highest_bidder_id"),
  // current highest bidder
  // New visibility options
  visibilityType: text("visibility_type").notNull().default("all"),
  // all, favorites, radius
  visibilityRadius: integer("visibility_radius"),
  // radius in miles (used when visibilityType is 'radius')
  completedAt: text("completed_at"),
  // Date when the deal was completed
  createdAt: timestamp("created_at").defaultNow()
});
var bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(),
  // foreign key to auctions
  dealerId: integer("dealer_id").notNull(),
  // foreign key to users (the bidder)
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  // foreign key to users
  receiverId: integer("receiver_id").notNull(),
  // foreign key to users
  auctionId: integer("auction_id"),
  // optional reference to an auction
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  // foreign key to users
  type: text("type").notNull(),
  // e.g. "bid", "auction_ending", "auction_won"
  content: text("content").notNull(),
  relatedId: integer("related_id"),
  // related entity ID (auction, bid, etc.)
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalRatings: true
});
var insertMotorcycleSchema = createInsertSchema(motorcycles).omit({
  id: true,
  createdAt: true
}).extend({
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
var insertAuctionSchema = createInsertSchema(auctions).omit({
  id: true,
  createdAt: true,
  status: true,
  winningBidId: true,
  winningBidderId: true,
  bidAccepted: true,
  dealConfirmed: true,
  collectionConfirmed: true,
  highestBidderId: true
}).extend({
  // Accept both string and Date types for dates
  startTime: z.union([
    z.string().transform((val) => new Date(val)),
    z.date()
  ]),
  endTime: z.union([
    z.string().transform((val) => new Date(val)),
    z.date()
  ])
});
var insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true
  // Do not omit senderId - it's needed for message creation
});
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true
});

// server/routes.ts
var isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};
var hasRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  return next();
};
async function registerRoutes(app2) {
  setupAuth(app2);
  const httpServer = createServer(app2);
  const wss = setupWebSocket(httpServer);
  app2.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: /* @__PURE__ */ new Date() });
  });
  app2.post("/api/motorcycles", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
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
  app2.get("/api/motorcycles", isAuthenticated, async (req, res, next) => {
    try {
      const motorcycles2 = await storage.getMotorcyclesByDealerId(req.user.id);
      res.json(motorcycles2);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/motorcycles/:id", isAuthenticated, async (req, res, next) => {
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
  app2.post("/api/auctions", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      console.log("Creating auction with data:", JSON.stringify(req.body));
      const auction = await storage.createAuction({
        motorcycleId: parseInt(req.body.motorcycleId, 10),
        dealerId: req.user.id,
        // Assert that user is defined
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        visibilityType: req.body.visibilityType || "all",
        visibilityRadius: req.body.visibilityType === "radius" ? parseInt(req.body.visibilityRadius, 10) : null
        // Status is handled by the storage system automatically
      });
      console.log("Auction created successfully:", auction);
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
  app2.get("/api/auctions", async (req, res, next) => {
    try {
      const currentUserId = req.isAuthenticated() ? req.user.id : null;
      const activeAuctions = await storage.getActiveAuctions(currentUserId);
      res.json(activeAuctions);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/auctions/dealer", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const dealerAuctions = await storage.getAuctionsByDealerId(req.user.id);
      res.json(dealerAuctions);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/auctions/:id", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id, 10);
      const dealerId = req.user.id;
      const deleted = await storage.deleteAuction(auctionId, dealerId);
      if (!deleted) {
        return res.status(400).json({
          message: "Unable to delete this listing. It may have received bids or you don't have permission to delete it."
        });
      }
      const wsMessage = {
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
  app2.post("/api/auctions/:id/archive-no-sale", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id, 10);
      const dealerId = req.user.id;
      const updatedAuction = await storage.archiveAuctionAsNoSale(auctionId, dealerId);
      if (!updatedAuction) {
        return res.status(400).json({
          message: "Unable to archive this listing as 'no sale'. It may already be completed or you don't have permission."
        });
      }
      const wsMessage = {
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
  app2.get("/api/auctions/bids", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const dealerId = req.user.id;
      console.log(`DEBUG: Getting auctions with bids for dealer ${dealerId} (username: ${req.user.username})`);
      const dealerBids = await storage.getBidsByDealerId(dealerId);
      console.log(`DEBUG: User ${dealerId} has ${dealerBids.length} bids`);
      dealerBids.forEach((bid) => {
        console.log(`DEBUG: Bid ID ${bid.id} for auction ${bid.auctionId} - Amount: ${bid.amount}`);
      });
      const allAuctions = Array.from(storage.auctions.values());
      const pendingCollectionAuctions = allAuctions.filter((auction) => auction.status === "pending_collection" && auction.winningBidderId === dealerId);
      console.log(`DEBUG: User ${dealerId} has ${pendingCollectionAuctions.length} pending collection auctions`);
      pendingCollectionAuctions.forEach((auction) => {
        console.log(`DEBUG: Pending collection auction ${auction.id} - Motorcycle ${auction.motorcycleId}`);
      });
      const auctions2 = await storage.getAuctionsWithBidsByDealer(dealerId);
      console.log(`DEBUG: getAuctionsWithBidsByDealer returned ${auctions2.length} auctions for user ${dealerId}`);
      auctions2.forEach((auction) => {
        console.log(`DEBUG: Auction ${auction.id} - Status ${auction.status}, Motorcycle ${auction.motorcycleId}`);
        console.log(`DEBUG: Auction ${auction.id} - WinningBidderId: ${auction.winningBidderId}, BidAccepted: ${auction.bidAccepted}`);
      });
      res.json(auctions2);
    } catch (error) {
      console.error("Error in /api/auctions/bids:", error);
      next(error);
    }
  });
  app2.get("/api/auctions/:id", async (req, res, next) => {
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
  app2.post("/api/motorcycles", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const validationResult = insertMotorcycleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid motorcycle data", errors: validationResult.error.format() });
      }
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
  app2.post("/api/bids", isAuthenticated, async (req, res, next) => {
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
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (auction.status !== "active") {
        return res.status(400).json({ message: "Auction is not active" });
      }
      const now = /* @__PURE__ */ new Date();
      if (now > new Date(auction.endTime)) {
        return res.status(400).json({ message: "Auction has ended" });
      }
      const bid = await storage.createBid({
        auctionId,
        dealerId: req.user.id,
        amount
      });
      const wsMessage = {
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
  app2.get("/api/bids/auction/:auctionId", isAuthenticated, async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.auctionId, 10);
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (req.user.id !== auction.dealerId && req.user.role !== "admin") {
        return res.status(403).json({
          message: "Access denied - This is a blind auction. Only the selling dealer can view bids."
        });
      }
      const bids2 = await storage.getBidsByAuctionId(auctionId);
      res.json(bids2);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/messages", isAuthenticated, async (req, res, next) => {
    try {
      const messageData = {
        ...req.body,
        senderId: req.user.id
        // Use the non-null assertion operator
      };
      const validationResult = insertMessageSchema.safeParse(messageData);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid message data", errors: validationResult.error.format() });
      }
      const { receiverId, content, auctionId } = validationResult.data;
      const message = await storage.createMessage({
        senderId: req.user.id,
        receiverId,
        content,
        auctionId: auctionId || null
      });
      const wsMessage = {
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
  app2.get("/api/messages", isAuthenticated, async (req, res, next) => {
    try {
      const messages2 = await storage.getAllMessagesForUser(req.user.id);
      const messageWithUsers = await Promise.all(
        messages2.map(async (message) => {
          const otherUserId = message.senderId === req.user.id ? message.receiverId : message.senderId;
          const otherUser = await storage.getUser(otherUserId);
          return {
            ...message,
            otherUser: otherUser ? {
              id: otherUser.id,
              username: otherUser.username,
              companyName: otherUser.companyName
            } : void 0
          };
        })
      );
      res.json(messageWithUsers);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/messages/:userId", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const messages2 = await storage.getMessagesBetweenUsers(req.user.id, userId);
      res.json(messages2);
    } catch (error) {
      next(error);
    }
  });
  app2.patch("/api/messages/:messageId/read", isAuthenticated, async (req, res, next) => {
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
  app2.get("/api/messages/unread/count", isAuthenticated, async (req, res, next) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/notifications", isAuthenticated, async (req, res, next) => {
    try {
      const notifications2 = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications2);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/notifications/:id/read", isAuthenticated, async (req, res, next) => {
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
  app2.patch("/api/auctions/:id/end", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
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
      const now = /* @__PURE__ */ new Date();
      const highestBid = await storage.getHighestBidForAuction(auctionId);
      const status = highestBid ? "pending_collection" : "completed";
      const updatedAuction = await storage.updateAuction(auctionId, {
        endTime: now,
        status,
        ...highestBid && {
          winningBidId: highestBid.id,
          winningBidderId: highestBid.dealerId
        }
      });
      const wsMessage = {
        type: "underwrite_completed",
        data: {
          auctionId: auction.id,
          message: "The underwrite has been ended early by the seller",
          hasWinningBid: !!highestBid
        },
        timestamp: Date.now()
      };
      broadcast(wsMessage);
      return res.status(200).json(updatedAuction);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/auctions/:id/accept-bid", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
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
      const bid = await storage.getBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      if (availabilityDate) {
        const dateObj = new Date(availabilityDate);
        await storage.updateMotorcycle(auction.motorcycleId, {
          dateAvailable: dateObj.toISOString()
        });
      }
      console.log(`Accepting bid ${bidId} for auction ${auctionId} - Updating auction and motorcycle status to pending_collection`);
      const updatedMotorcycle = await storage.updateMotorcycle(auction.motorcycleId, {
        status: "pending_collection"
      });
      console.log(`Motorcycle ${auction.motorcycleId} status updated to: ${updatedMotorcycle?.status}`);
      if (!updatedMotorcycle || updatedMotorcycle.status !== "pending_collection") {
        console.error(`Failed to update motorcycle ${auction.motorcycleId} status! Current status: ${updatedMotorcycle?.status}`);
        await storage.updateMotorcycle(auction.motorcycleId, {
          status: "pending_collection"
        });
      }
      const updatedAuction = await storage.updateAuction(auctionId, {
        bidAccepted: true,
        winningBidId: bidId,
        winningBidderId: bid.dealerId,
        status: "pending_collection"
      });
      console.log(`Verifying updated state after bid acceptance:`);
      const verifiedMotorcycle = await storage.getMotorcycle(auction.motorcycleId);
      const verifiedAuction = await storage.getAuction(auctionId);
      console.log(`Verified motorcycle status: ${verifiedMotorcycle?.status}`);
      console.log(`Verified auction status: ${verifiedAuction?.status}, bidAccepted: ${verifiedAuction?.bidAccepted}`);
      if (verifiedMotorcycle && verifiedMotorcycle.status !== "pending_collection") {
        console.log(`CRITICAL: Final auto-correction of motorcycle ${auction.motorcycleId} status to pending_collection`);
        await storage.updateMotorcycle(auction.motorcycleId, {
          status: "pending_collection"
        });
      }
      const verifyMotorcycle = await storage.getMotorcycle(auction.motorcycleId);
      console.log(`Final motorcycle ${auction.motorcycleId} status verification: ${verifyMotorcycle?.status}`);
      if (verifyMotorcycle?.status !== "pending_collection") {
        console.error(`*** CRITICAL PERSISTENCE ERROR: Motorcycle status still not correct after multiple update attempts! ***`);
        console.error(`Will attempt emergency direct update of motorcycle status`);
        const motorcycle2 = storage.motorcycles.get(auction.motorcycleId);
        if (motorcycle2) {
          motorcycle2.status = "pending_collection";
          storage.motorcycles.set(auction.motorcycleId, motorcycle2);
          console.log(`Emergency direct status update completed for motorcycle ${auction.motorcycleId}`);
        }
      }
      console.log(`Verified motorcycle ${auction.motorcycleId} status: ${verifyMotorcycle?.status}`);
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      const wsMessage = {
        type: "bid_accepted",
        data: {
          auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: bid.dealerId,
          availabilityDate: motorcycle?.dateAvailable || null,
          make: motorcycle?.make || "",
          model: motorcycle?.model || "",
          year: motorcycle?.year || 0,
          forceStatusUpdate: true,
          // Flag to force client-side status update
          updatePriority: "high",
          // Indicates critical status update
          auction: {
            id: updatedAuction.id,
            status: "pending_collection",
            // Explicit status
            bidAccepted: true,
            winningBidId: bidId
          },
          motorcycle: {
            id: motorcycle?.id,
            status: "pending_collection",
            // Explicit motorcycle status
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
      const bidAcceptedConfirmMessage = {
        type: "bid_accepted_confirm",
        data: {
          auctionId,
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
      wsMessage.data.motorcycleId = motorcycle?.id;
      bidAcceptedConfirmMessage.data.motorcycleId = motorcycle?.id;
      console.log("Sending bid accepted WebSocket messages with enhanced data:");
      console.log("- To bidder:", JSON.stringify(wsMessage.data));
      console.log("- To seller:", JSON.stringify(bidAcceptedConfirmMessage.data));
      sendToUser(bid.dealerId, wsMessage);
      sendToUser(auction.dealerId, bidAcceptedConfirmMessage);
      broadcast(wsMessage, bid.dealerId);
      const availabilityInfo = motorcycle?.dateAvailable ? ` It will be available for collection on ${new Date(motorcycle.dateAvailable).toLocaleDateString()}.` : "";
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
  app2.post("/api/auctions/:id/confirm-deal", isAuthenticated, async (req, res, next) => {
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
        dealConfirmed: true,
        status: "pending_collection"
      });
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      if (motorcycle && motorcycle.status !== "pending_collection") {
        console.log(`Updating motorcycle ${motorcycle.id} status to pending_collection during deal confirmation`);
        await storage.updateMotorcycle(motorcycle.id, {
          status: "pending_collection"
        });
      }
      const wsMessage = {
        type: "deal_confirmed",
        data: {
          auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: req.user.id,
          motorcycle: {
            id: motorcycle?.id,
            status: "pending_collection"
          },
          auction: {
            id: updatedAuction.id,
            status: updatedAuction.status
          }
        },
        timestamp: Date.now()
      };
      sendToUser(auction.dealerId, wsMessage);
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
  app2.post("/api/auctions/:id/schedule-collection", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
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
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      if (motorcycle) {
        await storage.updateMotorcycle(motorcycle.id, {
          dateAvailable: collectionDate
        });
      }
      const wsMessage = {
        type: "collection_scheduled",
        data: {
          auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: auction.winningBidderId,
          collectionDate
        },
        timestamp: Date.now()
      };
      if (auction.winningBidderId) {
        sendToUser(auction.winningBidderId, wsMessage);
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
  app2.post("/api/auctions/:id/confirm-collection", isAuthenticated, async (req, res, next) => {
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
        collectionConfirmed: true,
        status: "completed"
      });
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      if (motorcycle) {
        console.log(`Updating motorcycle ${motorcycle.id} status to sold during collection confirmation`);
        await storage.updateMotorcycle(motorcycle.id, {
          status: "sold",
          soldDate: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      const wsMessage = {
        type: "collection_confirmed",
        data: {
          auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: req.user.id,
          auction: {
            id: updatedAuction.id,
            status: "completed",
            collectionConfirmed: true
          },
          motorcycle: {
            id: motorcycle?.id,
            status: "sold"
          }
        },
        timestamp: Date.now()
      };
      sendToUser(auction.dealerId, wsMessage);
      sendToUser(auction.winningBidderId, wsMessage);
      broadcast({
        type: "auction_status_changed",
        data: {
          auctionId,
          newStatus: "completed",
          motorcycle: {
            id: motorcycle?.id,
            status: "sold"
          }
        },
        timestamp: Date.now()
      });
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
  app2.get(["/api/dashboard", "/api/dashboard/stats"], isAuthenticated, async (req, res, next) => {
    try {
      const dealerAuctions = await storage.getAuctionsByDealerId(req.user.id);
      const activeListings = dealerAuctions.filter((a) => a.status === "active").length;
      let totalBids = 0;
      dealerAuctions.forEach((auction) => {
        totalBids += auction.bids.length;
      });
      const pendingCompletion = dealerAuctions.filter(
        (a) => a.status === "completed" && a.winningBidId && !a.winningBidderId
      ).length;
      let revenue = 0;
      dealerAuctions.filter((a) => a.status === "completed" && a.winningBidId).forEach((auction) => {
        revenue += auction.currentBid || 0;
      });
      const allAuctions = await storage.getActiveAuctions();
      let activeBids = 0;
      let wonAuctions = 0;
      let pendingCollection = 0;
      let amountSpent = 0;
      allAuctions.forEach((auction) => {
        const myBids = auction.bids.filter((bid) => bid.dealerId === req.user.id);
        if (auction.status === "active") {
          myBids.forEach((bid) => {
            activeBids++;
            amountSpent += bid.amount;
          });
        }
        if (auction.status === "completed" && auction.winningBidId) {
          const winningBid = auction.bids.find((bid) => bid.id === auction.winningBidId);
          if (winningBid && winningBid.dealerId === req.user.id) {
            wonAuctions++;
            if (!auction.collectionDate) {
              pendingCollection++;
            }
          }
        }
      });
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
  app2.get("/api/user/favorites", isAuthenticated, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.favoriteDealers) {
        return res.json([]);
      }
      const favoriteDealers = await Promise.all(
        user.favoriteDealers.map(async (dealerId) => {
          const dealer = await storage.getUser(dealerId);
          if (!dealer) return null;
          return {
            id: dealer.id,
            username: dealer.username,
            companyName: dealer.companyName,
            rating: dealer.rating,
            totalRatings: dealer.totalRatings
          };
        })
      );
      res.json(favoriteDealers.filter((dealer) => dealer !== null));
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/user/favorites/add", isAuthenticated, async (req, res, next) => {
    try {
      const { dealerId } = req.body;
      if (!dealerId) {
        return res.status(400).json({ message: "Dealer ID is required" });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const favoriteDealers = user.favoriteDealers || [];
      if (favoriteDealers.includes(dealerId)) {
        return res.status(400).json({ message: "Dealer is already a favorite" });
      }
      favoriteDealers.push(dealerId);
      const updatedUser = await storage.updateUser(user.id, { favoriteDealers });
      res.status(200).json({ message: "Dealer added to favorites" });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/user/favorites/remove", isAuthenticated, async (req, res, next) => {
    try {
      const { dealerId } = req.body;
      if (!dealerId) {
        return res.status(400).json({ message: "Dealer ID is required" });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const favoriteDealers = user.favoriteDealers || [];
      if (!favoriteDealers.includes(dealerId)) {
        return res.status(400).json({ message: "Dealer is not a favorite" });
      }
      const updatedFavorites = favoriteDealers.filter((id) => id !== dealerId);
      const updatedUser = await storage.updateUser(user.id, { favoriteDealers: updatedFavorites });
      res.status(200).json({ message: "Dealer removed from favorites" });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/dealers", isAuthenticated, async (req, res, next) => {
    try {
      const allUsers = Array.from(storage.getAllUsers().values());
      const dealers = allUsers.filter((user) => user.role === "dealer");
      const safeUsers = dealers.map((dealer) => ({
        id: dealer.id,
        username: dealer.username,
        companyName: dealer.companyName,
        rating: dealer.rating,
        totalRatings: dealer.totalRatings
      }));
      const filteredUsers = safeUsers.filter((user) => user.id !== req.user.id);
      res.json(filteredUsers);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/activity", isAuthenticated, async (req, res, next) => {
    try {
      const notifications2 = await storage.getNotificationsByUserId(req.user.id);
      const activityItems = notifications2.map((notification, index) => {
        let icon = "check-circle";
        let color = "primary-light";
        switch (notification.type) {
          case "bid":
            icon = "check-circle";
            color = "primary-light";
            break;
          case "auction_ending":
            icon = "clock";
            color = "accent";
            break;
          case "auction_completed":
            icon = "check-circle";
            color = "green-500";
            break;
          case "message":
            icon = "bell";
            color = "blue-500";
            break;
        }
        return {
          id: notification.id,
          type: notification.type,
          title: notification.type.charAt(0).toUpperCase() + notification.type.slice(1).replace("_", " "),
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
  app2.post("/api/reset-auctions", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userAuctions = await storage.getAuctionsByDealerId(userId);
      console.log(`Found ${userAuctions.length} auctions for user ${userId}`);
      for (const auction of userAuctions) {
        console.log(`Resetting auction ${auction.id} for motorcycle ${auction.motorcycleId}`);
        await storage.updateAuction(auction.id, {
          status: "active",
          bidAccepted: false,
          dealConfirmed: false,
          collectionConfirmed: false,
          winningBidId: null,
          winningBidderId: null,
          completedAt: null
        });
        await storage.updateMotorcycle(auction.motorcycleId, {
          status: "available"
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
  app2.post("/api/auctions/:id/complete-deal", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
    try {
      const auctionId = parseInt(req.params.id);
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (auction.dealerId !== req.user.id) {
        return res.status(403).json({ message: "Only the seller can mark this deal as complete" });
      }
      const completionDate = /* @__PURE__ */ new Date();
      const updatedAuction = await storage.updateAuction(auctionId, {
        status: "completed",
        collectionConfirmed: true,
        completedAt: completionDate.toISOString()
      });
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      if (motorcycle) {
        await storage.updateMotorcycle(motorcycle.id, {
          status: "sold",
          soldDate: completionDate.toISOString()
        });
      }
      const wsMessage = {
        type: "collection_confirmed",
        data: {
          auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: auction.winningBidderId,
          make: motorcycle?.make || "",
          model: motorcycle?.model || "",
          year: motorcycle?.year || 0,
          // Add additional data to assist UI updates
          auction: {
            id: updatedAuction.id,
            status: "completed",
            collectionConfirmed: true,
            completedAt: completionDate.toISOString()
          },
          motorcycle: {
            id: motorcycle?.id,
            status: "sold",
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
        await storage.createNotification({
          userId: auction.winningBidderId,
          type: "collection_confirmed",
          content: `The seller has confirmed completion of your ${motorcycle?.make} ${motorcycle?.model} purchase.`,
          relatedId: auctionId
        });
        await storage.createNotification({
          userId: auction.winningBidderId,
          type: "transaction_completed",
          content: `Transaction for ${motorcycle?.make} ${motorcycle?.model} has been completed and moved to Past Listings.`,
          relatedId: auctionId
        });
      }
      sendToUser(auction.dealerId, wsMessage);
      broadcast({
        type: "auction_status_changed",
        data: {
          auctionId,
          status: "completed"
        },
        timestamp: Date.now()
      });
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
  app2.post("/api/auctions/:id/extend-date", isAuthenticated, hasRole("dealer"), async (req, res, next) => {
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
      if (auction.dealerId !== req.user.id) {
        return res.status(403).json({ message: "Only the seller can extend the availability date" });
      }
      await storage.updateMotorcycle(auction.motorcycleId, {
        dateAvailable: new Date(newAvailabilityDate).toISOString()
      });
      const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
      const wsMessage = {
        type: "date_extended",
        data: {
          auctionId,
          motorcycleId: auction.motorcycleId,
          sellerId: auction.dealerId,
          bidderId: auction.winningBidderId,
          newAvailabilityDate,
          make: motorcycle?.make || "",
          model: motorcycle?.model || "",
          year: motorcycle?.year || 0
        },
        timestamp: Date.now()
      };
      if (auction.winningBidderId) {
        sendToUser(auction.winningBidderId, wsMessage);
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

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import cors from "cors";
var app = express2();
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) {
      console.log(`CORS request from same-origin, allowed: true`);
      callback(null, true);
      return;
    }
    const allowedOrigins = corsConfig.allowedOrigins;
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS request from origin: ${origin}, allowed: true (exact match)`);
      callback(null, true);
      return;
    }
    const matchesPattern = allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    if (matchesPattern) {
      console.log(`CORS request from origin: ${origin}, allowed: true (pattern match)`);
      callback(null, true);
      return;
    }
    console.log(`CORS request from origin: ${origin}, allowed: false`);
    if (process.env.NODE_ENV !== "production") {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
  },
  credentials: corsConfig.credentials,
  // Allow cookies to be sent
  exposedHeaders: corsConfig.exposedHeaders,
  optionsSuccessStatus: corsConfig.optionsSuccessStatus,
  // For legacy browser support
  methods: corsConfig.methods,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-XSRF-TOKEN"]
}));
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`Server Error: [${status}] ${message}`);
    console.error(err.stack || err);
    const responseMessage = process.env.NODE_ENV === "production" ? "Server Error" : message;
    res.status(status).json({ message: responseMessage });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
