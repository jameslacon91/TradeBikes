// Fix Mike's pending motorcycles
import { storage } from './server/storage';

async function fixMikesPendingMotorcycles() {
  console.log('Fixing Mike\'s pending motorcycles...');
  
  try {
    // First, find Mike
    console.log('Looking for user with username: miketrader');
    const allUsers = Array.from(storage.users.values());
    const mike = allUsers.find(u => u.username === 'miketrader');
    
    if (!mike) {
      console.error('Could not find Mike! Aborting.');
      return;
    }
    
    console.log(`Found Mike with ID: ${mike.id}`);
    
    // Find all auctions with status pending_collection and winningBidderId = mike.id
    console.log('\nFinding auctions where Mike is the winning bidder...');
    const allAuctions = Array.from(storage.auctions.values());
    const mikesWonAuctions = allAuctions.filter(a => 
      a.winningBidderId === mike.id && 
      a.status === 'pending_collection'
    );
    
    console.log(`Found ${mikesWonAuctions.length} auctions won by Mike with pending_collection status`);
    
    // Check if their auction.bidAccepted is set to true
    console.log('\nUpdating auction.bidAccepted to true for all of Mike\'s won auctions:');
    for (const auction of mikesWonAuctions) {
      const motorcycle = storage.motorcycles.get(auction.motorcycleId);
      console.log(`- Auction ${auction.id} for ${motorcycle ? motorcycle.make + ' ' + motorcycle.model : 'Unknown'} (Motorcycle ID: ${auction.motorcycleId})`);
      console.log(`  * Before: bidAccepted=${auction.bidAccepted}`);
      
      // Update auction to have bidAccepted=true
      await storage.updateAuction(auction.id, { bidAccepted: true });
      
      // Verify the update
      const updatedAuction = storage.auctions.get(auction.id);
      console.log(`  * After: bidAccepted=${updatedAuction?.bidAccepted}`);
      
      // Also ensure the motorcycle status is 'pending_collection'
      if (motorcycle && motorcycle.status !== 'pending_collection') {
        console.log(`  * Motorcycle status was: ${motorcycle.status}, updating to pending_collection`);
        await storage.updateMotorcycle(motorcycle.id, { 
          status: 'pending_collection',
          soldDate: motorcycle.soldDate || new Date().toISOString()
        });
      }
    }
    
    console.log('\nVerifying pending collection count for Mike...');
    
    // Get auctions with bids for Mike
    const mikesAuctions = await storage.getAuctionsWithBidsByDealer(mike.id);
    console.log(`Mike has ${mikesAuctions.length} auctions with bids or as winner`);
    
    // Count pending collection motorcycles
    const pendingCollectionCount = mikesAuctions.filter(auction => {
      const isPendingCollection = auction.status === 'pending_collection' || auction.bidAccepted;
      const notCollected = !auction.collectionConfirmed;
      const userInvolved = auction.winningBidderId === mike.id;
      return isPendingCollection && notCollected && userInvolved;
    }).length;
    
    console.log(`Mike has ${pendingCollectionCount} motorcycles in pending collection`);
    
    if (pendingCollectionCount === mikesWonAuctions.length) {
      console.log(`✅ SUCCESS: Mike now correctly has ${pendingCollectionCount} motorcycles in pending collection!`);
    } else {
      console.log(`❌ ERROR: Mike should have ${mikesWonAuctions.length} motorcycles in pending collection, but has ${pendingCollectionCount}`);
    }
    
    console.log('\nDone fixing Mike\'s pending motorcycles');
    console.log('Please log in as miketrader (password: password123) to verify the changes');
    
  } catch (error) {
    console.error('Error fixing Mike\'s motorcycles:', error);
  }
}

// Run the function
fixMikesPendingMotorcycles();