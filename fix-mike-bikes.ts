// Script to fix MikeTrader's pending collection items
import { storage } from './server/storage';

async function fixMikePendingCollection() {
  console.log('=== FIX MIKE PENDING COLLECTION SCRIPT ===');
  
  try {
    // Get MikeTrader's ID
    const mike = await storage.getUserByUsername('miketrader');
    if (!mike) {
      console.error('❌ Could not find miketrader user in database');
      return;
    }
    
    const mikeId = mike.id;
    console.log(`✅ Found miketrader with ID: ${mikeId}`);
    
    // Ensure there's a third auction/motorcycle that Mike has won and is in pending collection
    // but only if we need it (if we already have 3 or more, don't add more)
    
    // Check how many auctions we already have where Mike is the winner with bidAccepted=true
    const allAuctions = Array.from(storage.auctions.values());
    const pendingCollectionAuctions = allAuctions.filter(a => 
      a.winningBidderId === mikeId && 
      a.bidAccepted && 
      a.status === 'pending_collection' && 
      !a.collectionConfirmed
    );
    
    const targetCount = 3;
    console.log(`Found ${pendingCollectionAuctions.length} auctions where Mike is the winning bidder with pending collection status`);
    
    if (pendingCollectionAuctions.length >= targetCount) {
      console.log('✅ Already have enough pending collection items for Mike');
      
      // Just make sure they all have the correct status
      pendingCollectionAuctions.forEach(async (auction) => {
        const motorcycle = storage.motorcycles.get(auction.motorcycleId);
        if (motorcycle && motorcycle.status !== 'pending_collection') {
          console.log(`Fixing motorcycle ${motorcycle.id} status from ${motorcycle.status} to pending_collection`);
          await storage.updateMotorcycle(motorcycle.id, {
            status: 'pending_collection',
            soldDate: motorcycle.soldDate || new Date().toISOString()
          });
        }
      });
      
      return;
    }
    
    // We need to create additional auctions for Mike
    const numToCreate = targetCount - pendingCollectionAuctions.length;
    console.log(`Creating ${numToCreate} new pending collection auctions for Mike`);
    
    // Find an existing dealer to be the seller
    const dealer = await storage.getUserByUsername('johndealer');
    if (!dealer) {
      console.error('❌ Could not find johndealer');
      return;
    }
    
    // Create motorcycles and auctions
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < numToCreate; i++) {
      // Create motorcycle
      const motorcycle = await storage.createMotorcycle({
        dealerId: dealer.id,
        make: 'Fix Script',
        model: `Test Bike ${i+1}`,
        year: 2023,
        mileage: 5000,
        color: 'Black',
        condition: 'Excellent',
        engineSize: '650cc',
        serviceHistory: 'Full',
        tyreCondition: 'New',
        description: 'Test motorcycle created by fix script',
        dateAvailable: 'Immediate',
        regNumber: `TEST${i+1}`,
        auctionDuration: '1day',
        status: 'pending_collection',
        soldDate: yesterday.toISOString(),
        images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80']
      });
      
      console.log(`Created motorcycle ID ${motorcycle.id}: ${motorcycle.make} ${motorcycle.model}`);
      
      // Create auction
      const auction = await storage.createAuction({
        motorcycleId: motorcycle.id,
        dealerId: dealer.id,
        startTime: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000), // 2 days ago
        endTime: yesterday,
        status: 'pending_collection',
        winningBidId: null,
        winningBidderId: mikeId,
        bidAccepted: true,
        dealConfirmed: true,
        collectionConfirmed: false,
        collectionDate: tomorrow.toISOString(),
        highestBidderId: mikeId,
        visibilityType: 'all',
        visibilityRadius: null,
        completedAt: yesterday.toISOString()
      });
      
      console.log(`Created auction ID ${auction.id} for motorcycle ${motorcycle.id}`);
      
      // Create a winning bid
      const bid = await storage.createBid({
        auctionId: auction.id,
        dealerId: mikeId,
        amount: 6500 + (i * 500)
      });
      
      // Update auction with winning bid ID
      await storage.updateAuction(auction.id, {
        winningBidId: bid.id
      });
      
      console.log(`Created bid of £${bid.amount} and assigned as winning bid`);
      
      // Create notification for Mike
      await storage.createNotification({
        userId: mikeId,
        type: 'bid_accepted',
        content: `Your bid of £${bid.amount} for ${motorcycle.make} ${motorcycle.model} has been accepted by the seller.`,
        relatedId: auction.id,
        read: false
      });
      
      console.log(`Created notification for Mike about auction ${auction.id}`);
    }
    
    // Verify the current count of pending collection auctions
    const allAuctionsAfterFix = Array.from(storage.auctions.values());
    const pendingCollectionAfterFix = allAuctionsAfterFix.filter(a => 
      a.winningBidderId === mikeId && 
      a.bidAccepted && 
      a.status === 'pending_collection' && 
      !a.collectionConfirmed
    );
    
    console.log(`\nAfter fix: Mike has ${pendingCollectionAfterFix.length} pending collection auctions`);
    console.log('The count should be 3.');
    console.log('\nPlease login as miketrader (password: password123) to verify');
    
  } catch (error) {
    console.error('Error fixing Mike pending collection:', error);
  }
}

// Run the function
fixMikePendingCollection();