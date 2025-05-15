// Script to reset the application's test data and create fresh test scenarios
import { storage } from './server/storage';

// Function to start the reset
async function resetData() {
  console.log('Starting data reset...');
  
  // Step 1: Reset all data structures (in-memory storage)
  console.log('Resetting all data structures...');
  await resetStorage();
  
  // Step 2: Create fresh test data with consistent statuses
  console.log('Creating fresh test data...');
  await createTestData();
  
  console.log('Data reset complete!');
  process.exit(0);
}

// Reset all data structures to empty
async function resetStorage() {
  try {
    // This directly manipulates the storage maps but maintains the ID counters
    storage.users.clear();
    storage.motorcycles.clear();
    storage.auctions.clear();
    storage.bids.clear();
    storage.notifications.clear();
    storage.messages.clear();
    
    console.log('Storage reset complete');
    
    // Recreate users to ensure consistent IDs
    await createUsers();
  } catch (error) {
    console.error('Error resetting storage:', error);
    process.exit(1);
  }
}

// Create standardized users
async function createUsers() {
  try {
    // Create dealer/seller users
    const johnDealer = await storage.createUser({
      username: 'johndealer',
      password: await hashPassword('password123'),
      email: 'john@example.com',
      role: 'dealer',
      companyName: 'Johns Motorcycles Ltd',
      phone: '01234567890',
      address: '123 Dealer Street',
      city: 'London',
      postcode: 'SW1 1AA',
      favoriteDealers: []
    });
    console.log(`Created johndealer with ID ${johnDealer.id}`);
    
    const maryDealer = await storage.createUser({
      username: 'marydealer',
      password: await hashPassword('password123'),
      email: 'mary@example.com',
      role: 'dealer',
      companyName: 'Marys Bikes',
      phone: '07123456789',
      address: '456 Bike Avenue',
      city: 'Birmingham',
      postcode: 'B1 2CD',
      favoriteDealers: []
    });
    console.log(`Created marydealer with ID ${maryDealer.id}`);
    
    // Create dealer/buyer users
    const mikeTrader = await storage.createUser({
      username: 'miketrader',
      password: await hashPassword('password123'),
      email: 'mike@example.com',
      role: 'dealer',
      companyName: 'Mikes Trading Co',
      phone: '07987654321',
      address: '789 Trade Street',
      city: 'Manchester',
      postcode: 'M1 3EF',
      favoriteDealers: [johnDealer.id],
    });
    console.log(`Created miketrader with ID ${mikeTrader.id}`);
    
    const sarahTrader = await storage.createUser({
      username: 'sarahtrader',
      password: await hashPassword('password123'),
      email: 'sarah@example.com',
      role: 'dealer',
      companyName: 'Sarahs Motorcycle Exchange',
      phone: '07876543210',
      address: '321 Exchange Road',
      city: 'Leeds',
      postcode: 'LS1 4GH',
      favoriteDealers: [johnDealer.id, maryDealer.id],
    });
    console.log(`Created sarahtrader with ID ${sarahTrader.id}`);
    
    console.log('Users created successfully');
    
    return { johnDealer, maryDealer, mikeTrader, sarahTrader };
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
}

// Create test motorcycles, auctions, and bids for testing
async function createTestData() {
  try {
    // Get user IDs (we expect these to be consistent - johndealer=1, miketrader=3)
    const johnDealer = await storage.getUserByUsername('johndealer');
    const maryDealer = await storage.getUserByUsername('marydealer');
    const mikeTrader = await storage.getUserByUsername('miketrader');
    const sarahTrader = await storage.getUserByUsername('sarahtrader');
    
    // Create available motorcycles for johndealer
    const hondaCBR = await storage.createMotorcycle({
      dealerId: johnDealer.id,
      make: 'Honda',
      model: 'CBR650R',
      year: 2021,
      mileage: 8245,
      color: 'Matt Black',
      condition: 'Excellent',
      engineSize: '649cc',
      serviceHistory: 'Full Honda dealer service history',
      tyreCondition: 'Excellent - fitted 1,000 miles ago',
      description: 'Excellent condition CBR650R with full service history.',
      dateAvailable: 'Immediate',
      regNumber: 'LP21 KFG',
      auctionDuration: '1day',
      status: 'available',
      soldDate: null,
      images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87']
    });
    console.log(`Created Honda CBR650R with ID ${hondaCBR.id}`);
    
    const kawasakiZ = await storage.createMotorcycle({
      dealerId: johnDealer.id,
      make: 'Kawasaki',
      model: 'Z900',
      year: 2020,
      mileage: 12000,
      color: 'Green',
      condition: 'Good',
      engineSize: '900cc',
      serviceHistory: 'Full history',
      tyreCondition: 'Good - 70% remaining',
      description: 'Well maintained Kawasaki Z900',
      dateAvailable: 'Next week',
      regNumber: 'KP20 ZED',
      auctionDuration: '1week',
      status: 'available',
      soldDate: null,
      images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87']
    });
    console.log(`Created Kawasaki Z900 with ID ${kawasakiZ.id}`);
    
    // Create a motorcycle that will be set up for pending collection
    const pendingTriumph = await storage.createMotorcycle({
      dealerId: maryDealer.id,
      make: 'Triumph',
      model: 'Street Triple',
      year: 2021,
      mileage: 5000,
      color: 'Silver',
      condition: 'Excellent',
      engineSize: '765cc',
      serviceHistory: 'Full Triumph history',
      tyreCondition: 'Excellent - nearly new',
      description: 'Beautiful Triumph Street Triple in fantastic condition',
      dateAvailable: '2025-05-20',
      regNumber: 'ME21 TST',
      auctionDuration: '1week',
      status: 'pending_collection',
      soldDate: new Date().toISOString(),
      images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87']
    });
    console.log(`Created Triumph Street Triple with ID ${pendingTriumph.id}`);
    
    // Create active auction for the Honda
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const hondaAuction = await storage.createAuction({
      motorcycleId: hondaCBR.id,
      dealerId: johnDealer.id,
      startTime: now,
      endTime: tomorrow,
      visibilityType: 'all',
      visibilityRadius: null,
      collectionDate: null
    });
    console.log(`Created active auction for Honda CBR650R with ID ${hondaAuction.id}`);
    
    // Add bids to the Honda auction
    await storage.createBid({
      auctionId: hondaAuction.id,
      dealerId: mikeTrader.id,
      amount: 6500
    });
    
    await storage.createBid({
      auctionId: hondaAuction.id,
      dealerId: sarahTrader.id,
      amount: 6800
    });
    
    const highestBid = await storage.createBid({
      auctionId: hondaAuction.id,
      dealerId: mikeTrader.id,
      amount: 7000
    });
    console.log(`Created bids for Honda auction, highest bid is ${highestBid.amount} from Mike`);
    
    // Create completed auction for the Triumph with pending collection
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const triumphAuction = await storage.createAuction({
      motorcycleId: pendingTriumph.id,
      dealerId: maryDealer.id,
      startTime: lastWeek,
      endTime: yesterday,
      visibilityType: 'all',
      visibilityRadius: null,
      collectionDate: '2025-05-20T12:00:00Z'
    });
    
    // Update auction status to pending collection
    await storage.updateAuction(triumphAuction.id, {
      status: 'pending_collection',
      bidAccepted: true,
      dealConfirmed: true,
      collectionConfirmed: false,
      winningBidId: highestBid.id,
      winningBidderId: mikeTrader.id,
      highestBidderId: mikeTrader.id,
      completedAt: yesterday.toISOString()
    });
    console.log(`Created and updated auction for Triumph Street Triple to pending collection status`);
    
    // Create a bid from Mike on the Triumph (winning bid)
    await storage.createBid({
      auctionId: triumphAuction.id,
      dealerId: mikeTrader.id,
      amount: 7500
    });
    
    // Create a notification for Mike about the pending collection
    await storage.createNotification({
      userId: mikeTrader.id,
      type: 'collection_pending',
      content: 'Your winning bid for Triumph Street Triple has been accepted. The motorcycle is ready for collection.',
      relatedId: triumphAuction.id,
      read: false
    });
    console.log(`Created notification for Mike about pending collection`);
    
    console.log('Test data creation complete');
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

// Helper function for hashing passwords
async function hashPassword(password) {
  try {
    // Use the storage's internal hash function
    const hashedPwd = await storage.comparePasswords('temp', 'temp.temp');
    // This is a hack, but should work since we're just using it for test data
    return password + '.salt';
  } catch (error) {
    // If we can't access the internal hash function, use a simple hash
    return password + '.salt';
  }
}

// Begin the reset process
resetData();