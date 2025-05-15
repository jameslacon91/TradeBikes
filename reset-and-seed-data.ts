// Script to reset data and set up MikeTrader with pending collection items
import { storage } from './server/storage';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function resetAndSeedData() {
  console.log('Running reset and seed script...');
  
  try {
    // Clear all current data
    storage.users.clear();
    storage.motorcycles.clear();
    storage.auctions.clear();
    storage.bids.clear();
    storage.messages.clear();
    storage.notifications.clear();
    
    console.log('All data cleared.');

    // Reset IDs
    storage.resetIds();
    console.log('IDs reset.');
    
    // Create users
    console.log('Creating users...');
    
    const dealer1 = await storage.createUser({
      username: 'johndealer',
      password: await hashPassword('password123'),
      email: 'john@example.com',
      role: 'dealer',
      companyName: 'John\'s Motorcycles',
      phone: '01234567890',
      address: '123 Bike Lane',
      city: 'London',
      postcode: 'EC1A 1BB',
      rating: 4.5,
      totalRatings: 42,
      favoriteDealers: []
    });
    
    const dealer2 = await storage.createUser({
      username: 'sarahdealer',
      password: await hashPassword('password123'),
      email: 'sarah@example.com',
      role: 'dealer',
      companyName: 'Sarah\'s Bikes',
      phone: '01234567891',
      address: '456 Cycle Road',
      city: 'Manchester',
      postcode: 'M1 1AA',
      rating: 4.8,
      totalRatings: 56,
      favoriteDealers: []
    });
    
    const dealer3 = await storage.createUser({
      username: 'daviddealer',
      password: await hashPassword('password123'),
      email: 'david@example.com',
      role: 'dealer',
      companyName: 'David\'s Motors',
      phone: '01234567892',
      address: '789 Engine Street',
      city: 'Birmingham',
      postcode: 'B1 1AA',
      rating: 4.2,
      totalRatings: 28,
      favoriteDealers: []
    });
    
    const trader1 = await storage.createUser({
      username: 'annatrader',
      password: await hashPassword('password123'),
      email: 'anna@example.com',
      role: 'trader',
      companyName: 'Anna\'s Trade Group',
      phone: '01234567893',
      address: '101 Trade Avenue',
      city: 'Leeds',
      postcode: 'LS1 1AA',
      rating: 4.3,
      totalRatings: 15,
      favoriteDealers: [dealer1.id]
    });
    
    const trader2 = await storage.createUser({
      username: 'bobtrader',
      password: await hashPassword('password123'),
      email: 'bob@example.com',
      role: 'trader',
      companyName: 'Bob\'s Bike Trading',
      phone: '01234567894',
      address: '202 Market Street',
      city: 'Glasgow',
      postcode: 'G1 1AA',
      rating: 4.7,
      totalRatings: 23,
      favoriteDealers: [dealer2.id]
    });
    
    const trader3 = await storage.createUser({
      username: 'clairetrader',
      password: await hashPassword('password123'),
      email: 'claire@example.com',
      role: 'trader',
      companyName: 'Claire\'s Wheels',
      phone: '01234567895',
      address: '303 Dealer Drive',
      city: 'Edinburgh',
      postcode: 'EH1 1AA',
      rating: 4.4,
      totalRatings: 19,
      favoriteDealers: [dealer1.id, dealer3.id]
    });
    
    const mikeTrader = await storage.createUser({
      username: 'miketrader',
      password: await hashPassword('password123'),
      email: 'mike@example.com',
      role: 'trader',
      companyName: 'Mike\'s Motorcycle Trading',
      phone: '01234567896',
      address: '404 Bike Boulevard',
      city: 'Bristol',
      postcode: 'BS1 1AA',
      rating: 4.6,
      totalRatings: 31,
      favoriteDealers: [dealer1.id, dealer2.id]
    });
    
    console.log(`Created users: 
      - Dealers: ${dealer1.username}, ${dealer2.username}, ${dealer3.username}
      - Traders: ${trader1.username}, ${trader2.username}, ${trader3.username}, ${mikeTrader.username}`);
    console.log(`Mike's ID is: ${mikeTrader.id}`);
    
    // Create motorcycles
    console.log('\nCreating motorcycles...');
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Motorcycle 1 - Available
    const motorcycle1 = await storage.createMotorcycle({
      dealerId: dealer1.id,
      make: 'Honda',
      model: 'CBR600RR',
      year: 2021,
      mileage: 3500,
      color: 'Red',
      condition: 'Excellent',
      engineSize: '600cc',
      serviceHistory: 'Full',
      tyreCondition: 'Good',
      description: 'Excellent condition Honda CBR600RR with low mileage.',
      dateAvailable: 'Immediate',
      regNumber: 'AB12CDE',
      auctionDuration: '3days',
      status: 'available',
      soldDate: null,
      images: ['https://images.unsplash.com/photo-1591637333526-4db09d0e061e?q=80']
    });
    
    // Motorcycle 2 - Also available
    const motorcycle2 = await storage.createMotorcycle({
      dealerId: dealer2.id,
      make: 'Yamaha',
      model: 'MT-07',
      year: 2020,
      mileage: 5200,
      color: 'Blue',
      condition: 'Good',
      engineSize: '700cc',
      serviceHistory: 'Partial',
      tyreCondition: 'Fair',
      description: 'Yamaha MT-07 in good condition with service history.',
      dateAvailable: 'Immediate',
      regNumber: 'EF34GHI',
      auctionDuration: '1week',
      status: 'available',
      soldDate: null,
      images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80']
    });
    
    // Motorcycle 3 - Pending Collection for Mike
    const motorcycle3 = await storage.createMotorcycle({
      dealerId: dealer1.id,
      make: 'Kawasaki',
      model: 'Ninja 650',
      year: 2022,
      mileage: 1200,
      color: 'Green',
      condition: 'Excellent',
      engineSize: '650cc',
      serviceHistory: 'Full',
      tyreCondition: 'Excellent',
      description: 'Like new Kawasaki Ninja 650, very low mileage and great condition.',
      dateAvailable: 'Immediate',
      regNumber: 'JK56LMN',
      auctionDuration: '3days',
      status: 'pending_collection',
      soldDate: yesterday.toISOString(),
      images: ['https://images.unsplash.com/photo-1580310614729-ccd69652491d?q=80']
    });
    
    // Motorcycle 4 - Pending Collection for Mike
    const motorcycle4 = await storage.createMotorcycle({
      dealerId: dealer2.id,
      make: 'Suzuki',
      model: 'GSX-R750',
      year: 2021,
      mileage: 3800,
      color: 'Black/Blue',
      condition: 'Good',
      engineSize: '750cc',
      serviceHistory: 'Full',
      tyreCondition: 'Good',
      description: 'Suzuki GSX-R750 in excellent condition with full service history.',
      dateAvailable: 'Immediate',
      regNumber: 'OP78QRS',
      auctionDuration: '3days',
      status: 'pending_collection',
      soldDate: yesterday.toISOString(),
      images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80']
    });
    
    // Motorcycle 5 - Pending Collection for Mike
    const motorcycle5 = await storage.createMotorcycle({
      dealerId: dealer3.id,
      make: 'Ducati',
      model: 'Monster 821',
      year: 2020,
      mileage: 4500,
      color: 'Red',
      condition: 'Very Good',
      engineSize: '821cc',
      serviceHistory: 'Full',
      tyreCondition: 'Good',
      description: 'Beautiful Ducati Monster 821 with Termignoni exhaust system.',
      dateAvailable: 'Immediate',
      regNumber: 'TU90VWX',
      auctionDuration: '1week',
      status: 'pending_collection',
      soldDate: yesterday.toISOString(),
      images: ['https://images.unsplash.com/photo-1563469527485-d04b58264229?q=80']
    });
    
    console.log(`Created motorcycles: 
      - Available: ${motorcycle1.make} ${motorcycle1.model}, ${motorcycle2.make} ${motorcycle2.model}
      - Pending Collection for Mike: ${motorcycle3.make} ${motorcycle3.model}, ${motorcycle4.make} ${motorcycle4.model}, ${motorcycle5.make} ${motorcycle5.model}`);
    
    // Create auctions
    console.log('\nCreating auctions...');
    
    // Auction 1 - Active
    const auction1 = await storage.createAuction({
      motorcycleId: motorcycle1.id,
      dealerId: dealer1.id,
      startTime: twoDaysAgo,
      endTime: nextWeek,
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
      completedAt: null
    });
    
    // Auction 2 - Active
    const auction2 = await storage.createAuction({
      motorcycleId: motorcycle2.id,
      dealerId: dealer2.id,
      startTime: yesterday,
      endTime: nextWeek,
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
      completedAt: null
    });
    
    // Auction 3 - Pending Collection for Mike
    const auction3 = await storage.createAuction({
      motorcycleId: motorcycle3.id,
      dealerId: dealer1.id,
      startTime: twoDaysAgo,
      endTime: yesterday,
      status: 'pending_collection',
      winningBidId: null,  // Will set after creating the bid
      winningBidderId: mikeTrader.id,
      bidAccepted: true,
      dealConfirmed: true,
      collectionConfirmed: false,
      collectionDate: tomorrow.toISOString(),
      highestBidderId: mikeTrader.id,
      visibilityType: 'all',
      visibilityRadius: null,
      completedAt: yesterday.toISOString()
    });
    
    // Auction 4 - Pending Collection for Mike
    const auction4 = await storage.createAuction({
      motorcycleId: motorcycle4.id,
      dealerId: dealer2.id,
      startTime: twoDaysAgo,
      endTime: yesterday,
      status: 'pending_collection',
      winningBidId: null,  // Will set after creating the bid
      winningBidderId: mikeTrader.id,
      bidAccepted: true,
      dealConfirmed: true,
      collectionConfirmed: false,
      collectionDate: tomorrow.toISOString(),
      highestBidderId: mikeTrader.id,
      visibilityType: 'all',
      visibilityRadius: null,
      completedAt: yesterday.toISOString()
    });
    
    // Auction 5 - Pending Collection for Mike
    const auction5 = await storage.createAuction({
      motorcycleId: motorcycle5.id,
      dealerId: dealer3.id,
      startTime: twoDaysAgo,
      endTime: yesterday,
      status: 'pending_collection',
      winningBidId: null,  // Will set after creating the bid
      winningBidderId: mikeTrader.id,
      bidAccepted: true,
      dealConfirmed: true,
      collectionConfirmed: false,
      collectionDate: tomorrow.toISOString(),
      highestBidderId: mikeTrader.id,
      visibilityType: 'all',
      visibilityRadius: null,
      completedAt: yesterday.toISOString()
    });
    
    console.log(`Created auctions: 
      - Active: Auction ${auction1.id} (${motorcycle1.make} ${motorcycle1.model}), Auction ${auction2.id} (${motorcycle2.make} ${motorcycle2.model})
      - Pending Collection for Mike: Auction ${auction3.id} (${motorcycle3.make} ${motorcycle3.model}), Auction ${auction4.id} (${motorcycle4.make} ${motorcycle4.model}), Auction ${auction5.id} (${motorcycle5.make} ${motorcycle5.model})`);
    
    // Create bids
    console.log('\nCreating bids...');
    
    // Mike's winning bids on the pending collection motorcycles
    const bid1 = await storage.createBid({
      auctionId: auction3.id,
      dealerId: mikeTrader.id,
      amount: 8500
    });
    
    const bid2 = await storage.createBid({
      auctionId: auction4.id,
      dealerId: mikeTrader.id,
      amount: 9200
    });
    
    const bid3 = await storage.createBid({
      auctionId: auction5.id,
      dealerId: mikeTrader.id,
      amount: 12000
    });
    
    // Update auctions with winning bid IDs
    await storage.updateAuction(auction3.id, { winningBidId: bid1.id });
    await storage.updateAuction(auction4.id, { winningBidId: bid2.id });
    await storage.updateAuction(auction5.id, { winningBidId: bid3.id });
    
    console.log(`Created bids and set as winning bids: 
      - Mike's bid on ${motorcycle3.make} ${motorcycle3.model}: £${bid1.amount}
      - Mike's bid on ${motorcycle4.make} ${motorcycle4.model}: £${bid2.amount}
      - Mike's bid on ${motorcycle5.make} ${motorcycle5.model}: £${bid3.amount}`);
    
    // Create notifications for Mike
    console.log('\nCreating notifications...');
    
    const notification1 = await storage.createNotification({
      userId: mikeTrader.id,
      type: 'bid_accepted',
      content: `Your bid of £${bid1.amount} for ${motorcycle3.make} ${motorcycle3.model} has been accepted.`,
      relatedId: auction3.id,
      read: false
    });
    
    const notification2 = await storage.createNotification({
      userId: mikeTrader.id,
      type: 'bid_accepted',
      content: `Your bid of £${bid2.amount} for ${motorcycle4.make} ${motorcycle4.model} has been accepted.`,
      relatedId: auction4.id,
      read: false
    });
    
    const notification3 = await storage.createNotification({
      userId: mikeTrader.id,
      type: 'bid_accepted',
      content: `Your bid of £${bid3.amount} for ${motorcycle5.make} ${motorcycle5.model} has been accepted.`,
      relatedId: auction5.id,
      read: false
    });
    
    const notification4 = await storage.createNotification({
      userId: mikeTrader.id,
      type: 'deal_confirmed',
      content: `Deal confirmed for ${motorcycle3.make} ${motorcycle3.model}. Collection scheduled for ${new Date(tomorrow).toLocaleDateString()}.`,
      relatedId: auction3.id,
      read: false
    });
    
    const notification5 = await storage.createNotification({
      userId: mikeTrader.id,
      type: 'deal_confirmed',
      content: `Deal confirmed for ${motorcycle4.make} ${motorcycle4.model}. Collection scheduled for ${new Date(tomorrow).toLocaleDateString()}.`,
      relatedId: auction4.id,
      read: false
    });
    
    const notification6 = await storage.createNotification({
      userId: mikeTrader.id,
      type: 'deal_confirmed',
      content: `Deal confirmed for ${motorcycle5.make} ${motorcycle5.model}. Collection scheduled for ${new Date(tomorrow).toLocaleDateString()}.`,
      relatedId: auction5.id,
      read: false
    });
    
    console.log(`Created notifications for Mike: 
      - Bid accepted notifications: ${notification1.id}, ${notification2.id}, ${notification3.id}
      - Deal confirmed notifications: ${notification4.id}, ${notification5.id}, ${notification6.id}`);
    
    console.log('\nData seeding complete. Mike should now have 3 motorcycles in pending collection.');
    console.log('Login credentials:');
    console.log('  Mike: username=miketrader, password=password123');
    console.log('  John: username=johndealer, password=password123');
    console.log('  Sarah: username=sarahdealer, password=password123');
    
  } catch (error) {
    console.error('Error resetting and seeding data:', error);
  }
}

// Run the function to reset and seed data
resetAndSeedData();