// Check the status of Mike's auctions and auto-fix any inconsistencies
import { storage } from './server/storage.js';

async function checkMikesAuctions() {
  console.log('Checking Mike\'s auctions and motorcycle statuses...');
  
  try {
    // Mike's trader ID is 4 based on the storage.ts file
    const mikeId = 4;
    
    // Get Mike's auctions with bids
    const mikesAuctions = await storage.getAuctionsWithBidsByDealer(mikeId);
    console.log(`Mike has ${mikesAuctions.length} auctions with bids or as winner`);
    
    mikesAuctions.forEach(auction => {
      console.log(`\nAuction ${auction.id} for ${auction.motorcycle.make} ${auction.motorcycle.model}:`);
      console.log(`  Auction Status: ${auction.status}`);
      console.log(`  Motorcycle Status: ${auction.motorcycle.status}`);
      console.log(`  Bid Accepted: ${auction.bidAccepted}`);
      console.log(`  Winner ID: ${auction.winningBidderId}`);
      
      // Check if this is a won auction that should be in "pending_collection" status
      if (auction.winningBidderId === mikeId && auction.bidAccepted) {
        console.log(`  This is a won auction for Mike!`);
        
        // Check if the statuses are consistent
        if (auction.status !== 'pending_collection' || auction.motorcycle.status !== 'pending_collection') {
          console.log(`  ❌ Found inconsistency - fixing statuses to pending_collection`);
          
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
          
          console.log(`  ✅ Statuses corrected to pending_collection`);
        } else {
          console.log(`  ✅ Statuses are already consistent`);
        }
      }
    });
    
    console.log('\nDone checking Mike\'s auctions');
    console.log('Please log in as miketrader (password: password123) to verify changes');
    
  } catch (error) {
    console.error('Error checking motorcycle statuses:', error);
  }
}

// Run the function
checkMikesAuctions();