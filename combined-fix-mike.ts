// Combined script to fix Mike's pending motorcycles
import { storage } from './server/storage';
import { User, Motorcycle, Auction } from './shared/schema';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function combinedFix() {
  console.log('\n===== COMBINED FIX FOR MIKE\'S VISIBILITY ISSUES =====\n');
  
  try {
    console.log('Step 1: Clearing all existing data...');
    // Clear all existing data
    storage.users.clear();
    storage.motorcycles.clear();
    storage.auctions.clear();
    storage.bids.clear();
    storage.messages.clear();
    storage.notifications.clear();
    
    console.log('Step 2: Resetting IDs...');
    // Reset all IDs to 1
    storage.resetIds();
    
    console.log('Step 3: Creating users...');
    // Create Mike as a trader
    const mike: User = {
      id: 7, // Using a fixed ID
      username: 'miketrader',
      password: await hashPassword('password123'),
      email: 'mike@trader.com',
      role: 'trader',
      companyName: 'Mike\'s Motorcycle Emporium',
      phone: '+44123456789',
      address: '123 Trader St',
      city: 'London',
      postcode: 'EC1 1AA',
      rating: 4.5,
      totalRatings: 10,
      favoriteDealers: [],
      createdAt: new Date()
    };
    storage.users.set(mike.id, mike);
    
    // Create a dealer
    const dealer: User = {
      id: 3,
      username: 'johndealer',
      password: await hashPassword('password123'),
      email: 'john@dealer.com',
      role: 'dealer',
      companyName: 'John\'s Motorcycles',
      phone: '+44987654321',
      address: '456 Dealer Ave',
      city: 'Manchester',
      postcode: 'M1 1BB',
      rating: 4.2,
      totalRatings: 15,
      favoriteDealers: [],
      createdAt: new Date()
    };
    storage.users.set(dealer.id, dealer);
    
    console.log('Step 4: Creating motorcycles with pending_collection status...');
    // Create 3 motorcycles with pending_collection status
    const bikes = [
      {
        make: 'Kawasaki',
        model: 'Ninja 650',
        year: 2020,
        price: 8000
      },
      {
        make: 'Suzuki',
        model: 'GSX-R750',
        year: 2021,
        price: 9000
      },
      {
        make: 'Ducati',
        model: 'Monster 821',
        year: 2019,
        price: 11500
      }
    ];
    
    const motorcycles: Motorcycle[] = [];
    for (let i = 0; i < bikes.length; i++) {
      const bike = bikes[i];
      const motorcycle: Motorcycle = {
        id: i + 1,
        dealerId: dealer.id,
        make: bike.make,
        model: bike.model,
        year: bike.year,
        mileage: 5000 + i * 1000,
        color: ['Red', 'Blue', 'Black'][i],
        condition: 'Excellent',
        engineSize: '650cc',
        serviceHistory: 'Full',
        tyreCondition: 'Good',
        description: `A beautiful ${bike.make} ${bike.model}`,
        price: bike.price,
        images: [`${bike.make.toLowerCase()}-${bike.model.toLowerCase().replace(' ', '-')}.jpg`],
        location: 'Manchester',
        status: 'pending_collection',
        soldDate: new Date().toISOString(),
        createdAt: new Date()
      };
      motorcycles.push(motorcycle);
      storage.motorcycles.set(motorcycle.id, motorcycle);
    }
    
    console.log('Step 5: Creating auctions with bidAccepted=true...');
    // Create auctions for these motorcycles
    const auctions: Auction[] = [];
    for (let i = 0; i < motorcycles.length; i++) {
      const motorcycle = motorcycles[i];
      const auction: Auction = {
        id: i + 1,
        motorcycleId: motorcycle.id,
        dealerId: dealer.id,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),   // 2 days ago
        status: 'pending_collection',
        winningBidId: i + 1,
        winningBidderId: mike.id,
        bidAccepted: true,  // This is the key field!
        dealConfirmed: true,
        collectionConfirmed: false,
        collectionDate: null,
        highestBidderId: mike.id,
        completedAt: new Date().toISOString(),
        createdAt: new Date()
      };
      auctions.push(auction);
      storage.auctions.set(auction.id, auction);
    }
    
    console.log('Step 6: Creating bids for Mike...');
    // Create winning bids for Mike
    for (let i = 0; i < auctions.length; i++) {
      const auction = auctions[i];
      const bid = {
        id: i + 1,
        dealerId: mike.id,
        auctionId: auction.id,
        amount: motorcycles[i].price,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      };
      storage.bids.set(bid.id, bid);
    }
    
    console.log('Step 7: Creating notifications for Mike...');
    // Create notifications for Mike
    for (let i = 0; i < auctions.length; i++) {
      const auction = auctions[i];
      const notification = {
        id: i + 1,
        userId: mike.id,
        title: 'Bid Accepted',
        message: `Your bid on ${motorcycles[i].make} ${motorcycles[i].model} has been accepted.`,
        read: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      };
      storage.notifications.set(notification.id, notification);
    }
    
    console.log('\nData has been created successfully!');
    console.log(`Mike's ID: ${mike.id}`);
    console.log('Created 3 motorcycles in pending_collection status for Mike');
    
    console.log('\nVerifying that Mike can see pending collection motorcycles...');
    const mikesAuctions = await storage.getAuctionsWithBidsByDealer(mike.id);
    console.log(`Mike has ${mikesAuctions.length} auctions with bids or as winner`);
    
    // Count pending collection motorcycles
    const pendingCollectionCount = mikesAuctions.filter(auction => {
      const isPendingCollection = auction.status === 'pending_collection';
      const bidAccepted = auction.bidAccepted;
      const notCollected = !auction.collectionConfirmed;
      const userInvolved = auction.winningBidderId === mike.id;
      return isPendingCollection && bidAccepted && notCollected && userInvolved;
    }).length;
    
    console.log(`Mike has ${pendingCollectionCount} motorcycles in pending collection`);
    
    console.log('\nListing all motorcycles with pending_collection status:');
    const allMotorcycles = Array.from(storage.motorcycles.values());
    const pendingMotorcycles = allMotorcycles.filter(m => m.status === 'pending_collection');
    
    pendingMotorcycles.forEach(m => {
      console.log(`- ID ${m.id}: ${m.make} ${m.model} (Dealer ID: ${m.dealerId})`);
    });
    
    console.log('\nListing all auctions with pending_collection status:');
    const allAuctions = Array.from(storage.auctions.values());
    const pendingAuctions = allAuctions.filter(a => a.status === 'pending_collection');
    
    pendingAuctions.forEach(a => {
      const motorcycle = storage.motorcycles.get(a.motorcycleId);
      console.log(`- Auction ID ${a.id} for ${motorcycle ? motorcycle.make + ' ' + motorcycle.model : 'Unknown'} (Motorcycle ID: ${a.motorcycleId})`);
      console.log(`  * Dealer ID: ${a.dealerId}`);
      console.log(`  * Winning bidder ID: ${a.winningBidderId}`);
      console.log(`  * Bid accepted: ${a.bidAccepted}`);
    });
    
    if (pendingCollectionCount === 3) {
      console.log('\n✅ SUCCESS: Mike correctly has 3 motorcycles in pending collection!');
    } else {
      console.log(`\n❌ ERROR: Mike should have 3 motorcycles in pending collection, but has ${pendingCollectionCount}`);
    }
    
    console.log('\nDone! You can now log in and test:');
    console.log('  Mike: username=miketrader, password=password123');
    console.log('  John: username=johndealer, password=password123');
    
  } catch (error) {
    console.error('Error in combined fix:', error);
  }
}

// Run the function
combinedFix();