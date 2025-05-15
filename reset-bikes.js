// This script resets the test bikes for johndealer
import { storage } from './server/storage';

async function resetBikes() {
  try {
    // Get all auctions for johndealer
    const allAuctions = await storage.getAuctionsByDealerId(1);
    
    console.log(`Found ${allAuctions.length} auctions for johndealer`);
    
    // Reset each auction to active status
    for (const auction of allAuctions) {
      console.log(`Resetting auction ${auction.id} for motorcycle ${auction.motorcycleId}`);
      
      await storage.updateAuction(auction.id, {
        status: 'active',
        bidAccepted: false,
        dealConfirmed: false,
        collectionConfirmed: false,
        winningBidId: null,
        winningBidderId: null,
        completedAt: null
      });
      
      // Reset the motorcycle status as well
      await storage.updateMotorcycle(auction.motorcycleId, {
        status: 'available'
      });
      
      console.log(`Reset completed for auction ${auction.id}`);
    }
    
    console.log('All bikes reset successfully');
  } catch (error) {
    console.error('Error resetting bikes:', error);
  }
}

resetBikes();