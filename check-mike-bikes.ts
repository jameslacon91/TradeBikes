// Check the status of Mike's auctions and auto-fix any inconsistencies
import { storage } from './server/storage';

async function checkMikesAuctions() {
  console.log('Checking Mike\'s auctions and motorcycle statuses...');
  
  try {
    // First, list all users to find Mike
    console.log('\n--- ALL USERS IN SYSTEM ---');
    const users = storage.getAllUsers();
    console.log(`Found ${users.size} users in the system`);
    
    // Convert the map to array for easier iteration
    const allUsers = Array.from(users.values());
    
    console.log(`User count: ${allUsers.length}`);
    
    for (const user of allUsers) {
      console.log(`User ${user.id}: ${user.username} (${user.role})`);
    }
    
    // Try different possible Mike usernames
    const possibleMikeUsernames = ['miketrader', 'mike', 'MikeTrader', 'Mike', 'trader5'];
    let mike = null;
    
    // First look for a trader explicitly named Mike
    for (const username of possibleMikeUsernames) {
      console.log(`Looking for user with username: ${username}`);
      mike = allUsers.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
      if (mike) {
        console.log(`✅ Found mike user with username: ${mike.username}`);
        break;
      } else {
        console.log(`No user found with username: ${username}`);
      }
    }
    
    // If we still couldn't find Mike, look for a user with role='trader'
    if (!mike) {
      const traders = allUsers.filter(user => user.role === 'trader');
      if (traders.length > 0) {
        mike = traders[0]; // Use the first trader as Mike
        console.log(`Using first trader user as Mike: ${mike.username} (ID: ${mike.id})`);
      }
    }
    
    if (!mike) {
      console.error('Could not find a suitable user to use as Mike!');
      return;
    }
    
    const mikeId = mike.id;
    console.log(`Found miketrader with ID: ${mikeId} and role: ${mike.role}`);
    
    // First, log all auctions to understand the data
    console.log('\n--- ALL AUCTIONS IN SYSTEM ---');
    const allAuctions = Array.from(storage.auctions.values());
    allAuctions.forEach(auction => {
      // Get associated motorcycle for auction
      const motorcycle = storage.motorcycles.get(auction.motorcycleId);
      
      if (motorcycle) {
        console.log(`Auction ${auction.id} for ${motorcycle.make} ${motorcycle.model}:`);
        console.log(`  * Status: ${auction.status}`);
        console.log(`  * WinningBidderId: ${auction.winningBidderId}`);
        console.log(`  * BidAccepted: ${auction.bidAccepted}`);
        console.log(`  * DealConfirmed: ${auction.dealConfirmed}`);
        console.log(`  * CollectionConfirmed: ${auction.collectionConfirmed}`);
        console.log(`  * Motorcycle Status: ${motorcycle.status}`);
      } else {
        console.log(`Auction ${auction.id} has invalid motorcycleId ${auction.motorcycleId}!`);
      }
    });
    
    // Check auctions where Mike is explicitly set as winner
    console.log('\n--- AUCTIONS WHERE MIKE IS WINNER ---');
    const mikeWinningAuctions = allAuctions.filter(a => a.winningBidderId === mikeId);
    console.log(`Found ${mikeWinningAuctions.length} auctions where Mike is set as winner`);
    
    mikeWinningAuctions.forEach(auction => {
      const motorcycle = storage.motorcycles.get(auction.motorcycleId);
      console.log(`\nAuction ${auction.id} for ${motorcycle ? motorcycle.make + ' ' + motorcycle.model : 'Unknown'}:`);
      console.log(`  * Auction Status: ${auction.status}`);
      console.log(`  * BidAccepted: ${auction.bidAccepted}`);
      console.log(`  * Motorcycle Status: ${motorcycle ? motorcycle.status : 'No motorcycle'}`);
    });
    
    // Now check the actual auction + bids data for Mike
    console.log('\n--- MIKE\'S AUCTIONS FROM getAuctionsWithBidsByDealer ---');
    const mikesAuctions = await storage.getAuctionsWithBidsByDealer(mikeId);
    console.log(`Mike has ${mikesAuctions.length} auctions with bids or as winner`);
    
    mikesAuctions.forEach(auction => {
      console.log(`\nAuction ${auction.id} for ${auction.motorcycle.make} ${auction.motorcycle.model}:`);
      console.log(`  * Auction Status: ${auction.status}`);
      console.log(`  * Motorcycle Status: ${auction.motorcycle.status}`);
      console.log(`  * BidAccepted: ${auction.bidAccepted}`);
      console.log(`  * Winner ID: ${auction.winningBidderId}`);
      
      // Check if this is a won auction that should be in "pending_collection" status
      if (auction.winningBidderId === mikeId && auction.bidAccepted) {
        console.log(`  * This is a won auction for Mike!`);
        
        // Check if the statuses are consistent
        if (auction.status !== 'pending_collection' || auction.motorcycle.status !== 'pending_collection') {
          console.log(`  * ❌ Found inconsistency - fixing statuses to pending_collection`);
          
          // Fix auction status if needed
          if (auction.status !== 'pending_collection') {
            storage.updateAuction(auction.id, { status: 'pending_collection' });
          }
          
          // Fix motorcycle status if needed
          if (auction.motorcycle.status !== 'pending_collection') {
            storage.updateMotorcycle(auction.motorcycle.id, { 
              status: 'pending_collection',
              soldDate: auction.motorcycle.soldDate || new Date().toISOString()
            });
          }
          
          console.log(`  * ✅ Statuses corrected to pending_collection`);
        } else {
          console.log(`  * ✅ Statuses are already consistent`);
        }
      }
    });
    
    // Check what motorcycles would show in the pending collection tab on the dashboard
    console.log('\n--- SIMULATING PENDING COLLECTION FILTER ---');
    
    // First check all active auctions
    console.log('Getting all active auctions from storage...');
    const allActiveAuctions = await storage.getActiveAuctions(mikeId);
    console.log(`Found ${allActiveAuctions.length} active auctions overall`);
    
    // Then apply the filter from the dashboard
    const pendingCollectionFilter = allActiveAuctions.filter(auction => {
      const isPendingCollection = auction.status === 'pending_collection' || auction.bidAccepted;
      const notCollected = !auction.collectionConfirmed;
      const userInvolved = auction.dealerId === mikeId || auction.winningBidderId === mikeId;
      
      console.log(`Auction ${auction.id} - ${auction.motorcycle.make} ${auction.motorcycle.model}:`);
      console.log(`  * isPendingCollection: ${isPendingCollection}`);
      console.log(`  * notCollected: ${notCollected}`);
      console.log(`  * userInvolved: ${userInvolved}`);
      console.log(`  * Would show in pending collection: ${isPendingCollection && notCollected && userInvolved}`);
      
      return isPendingCollection && notCollected && userInvolved;
    });
    
    console.log(`\nPending collection would show ${pendingCollectionFilter.length} items`);
    
    console.log('\nDone checking Mike\'s auctions');
    console.log('Please log in as miketrader (password: password123) to verify changes');
    
  } catch (error) {
    console.error('Error checking motorcycle statuses:', error);
  }
}

// Run the function
checkMikesAuctions();