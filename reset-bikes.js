// Fix specific auction & motorcycle data for Mike's pending collection
import { storage } from './server/storage.js';

async function resetBikes() {
  console.log('Resetting motorcycles and auctions for testing...');
  
  try {
    // Set specific motorcycle and auction for testing - using hardcoded IDs from storage.ts
    const mikeId = 4; // miketrader
    const motorcycleId = 1; // Honda CBR650R
    const auctionId = 1; // The auction for Honda CBR650R

    // Check the current status
    console.log('Current status:');
    const motorcycle = await storage.getMotorcycle(motorcycleId);
    const auction = await storage.getAuction(auctionId);
    
    if (motorcycle) {
      console.log(`Motorcycle #${motorcycleId}: ${motorcycle.make} ${motorcycle.model}`);
      console.log(`Status: ${motorcycle.status}`);
    } else {
      console.log(`Motorcycle #${motorcycleId} not found!`);
    }
    
    if (auction) {
      console.log(`Auction #${auctionId} for motorcycle #${auction.motorcycleId}`);
      console.log(`Status: ${auction.status}`);
      console.log(`Bid accepted: ${auction.bidAccepted}`);
      console.log(`Winner: ${auction.winningBidderId}`);
    } else {
      console.log(`Auction #${auctionId} not found!`);
    }
    
    // Check if we need to update
    if (!auction || auction.winningBidderId !== mikeId || auction.status !== 'pending_collection') {
      console.log('\nUpdating auction to make Mike the winner with pending_collection status...');
      
      await storage.updateAuction(auctionId, {
        status: 'pending_collection',
        bidAccepted: true,
        dealConfirmed: true,
        collectionConfirmed: false,
        winningBidId: 3, // Bid ID - use the correct one from your data
        winningBidderId: mikeId,
        highestBidderId: mikeId
      });
      
      console.log('Auction updated successfully');
    }
    
    if (!motorcycle || motorcycle.status !== 'pending_collection') {
      console.log('\nUpdating motorcycle to pending_collection status...');
      
      await storage.updateMotorcycle(motorcycleId, {
        status: 'pending_collection',
        soldDate: new Date().toISOString()
      });
      
      console.log('Motorcycle updated successfully');
    }
    
    // Verify changes
    console.log('\nVerifying changes:');
    const updatedMotorcycle = await storage.getMotorcycle(motorcycleId);
    const updatedAuction = await storage.getAuction(auctionId);
    
    if (updatedMotorcycle) {
      console.log(`Motorcycle #${motorcycleId}: ${updatedMotorcycle.make} ${updatedMotorcycle.model}`);
      console.log(`Status: ${updatedMotorcycle.status}`);
    }
    
    if (updatedAuction) {
      console.log(`Auction #${auctionId} for motorcycle #${updatedAuction.motorcycleId}`);
      console.log(`Status: ${updatedAuction.status}`);
      console.log(`Bid accepted: ${updatedAuction.bidAccepted}`);
      console.log(`Winner: ${updatedAuction.winningBidderId}`);
    }
    
    // Now check if we can find this in Mike's auctions
    console.log('\nChecking Mike\'s auctions after update:');
    const mikesAuctions = await storage.getAuctionsWithBidsByDealer(mikeId);
    console.log(`Found ${mikesAuctions.length} auctions for Mike`);
    
    mikesAuctions.forEach(auction => {
      console.log(`Auction ${auction.id} for ${auction.motorcycle.make} ${auction.motorcycle.model}`);
      console.log(`Status: ${auction.status}, Motorcycle status: ${auction.motorcycle.status}`);
    });
    
    console.log('\nDone resetting data');
    console.log('Please log in as miketrader (password: password123) to verify the pending collection tab');
    
  } catch (error) {
    console.error('Error resetting data:', error);
  }
}

// Run the function
resetBikes();