// Script to fix MikeTrader's pending collection items
const { storage } = require('./server/storage');

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
    
    // Check how many auctions we already have where Mike is the winner
    const allAuctions = Array.from(storage.auctions.values());
    const mikeWins = allAuctions.filter(a => a.winningBidderId === mikeId && a.bidAccepted);
    
    console.log(`Currently Mike has ${mikeWins.length} auctions where he's the winning bidder with bid accepted`);
    
    // Should have exactly 3 pending collection items
    const targetCount = 3;
    
    if (mikeWins.length === targetCount) {
      console.log('✅ Mike already has the correct number of pending collection items');
      
      // Make sure all of them have the correct status
      let fixedCount = 0;
      
      for (const auction of mikeWins) {
        // Ensure auction status is pending_collection
        if (auction.status !== 'pending_collection') {
          console.log(`Fixing auction ${auction.id} status from ${auction.status} to pending_collection`);
          await storage.updateAuction(auction.id, { status: 'pending_collection' });
          fixedCount++;
        }
        
        // Ensure motorcycle status is pending_collection
        const motorcycle = storage.motorcycles.get(auction.motorcycleId);
        if (motorcycle && motorcycle.status !== 'pending_collection') {
          console.log(`Fixing motorcycle ${motorcycle.id} status from ${motorcycle.status} to pending_collection`);
          await storage.updateMotorcycle(motorcycle.id, { 
            status: 'pending_collection',
            soldDate: motorcycle.soldDate || new Date().toISOString()
          });
          fixedCount++;
        }
      }
      
      if (fixedCount > 0) {
        console.log(`✅ Fixed ${fixedCount} status issues with Mike's auctions/motorcycles`);
      } else {
        console.log('✅ All statuses already correct');
      }
      
      return;
    }
    
    // We need to set up additional auctions for Mike to reach target count
    const missingCount = targetCount - mikeWins.length;
    console.log(`Need to create ${missingCount} more winning auctions for Mike`);
    
    // Find available motorcycles that aren't in active auctions already
    const usedMotorcycleIds = new Set(allAuctions.map(a => a.motorcycleId));
    const allMotorcycles = Array.from(storage.motorcycles.values());
    const availableMotorcycles = allMotorcycles.filter(m => 
      !usedMotorcycleIds.has(m.id) && m.status === 'available'
    );
    
    console.log(`Found ${availableMotorcycles.length} available motorcycles to use`);
    
    if (availableMotorcycles.length < missingCount) {
      console.log('⚠️ Not enough available motorcycles! Creating new ones...');
      
      // Find a dealer to be the seller
      const dealer = await storage.getUserByUsername('johndealer');
      if (!dealer) {
        console.error('❌ Could not find johndealer');
        return;
      }
      
      // Create additional motorcycles if needed
      for (let i = 0; i < missingCount - availableMotorcycles.length; i++) {
        const newBike = await storage.createMotorcycle({
          dealerId: dealer.id,
          make: 'Test',
          model: `Pending Test ${i+1}`,
          year: 2023,
          mileage: 500,
          color: 'Black',
          condition: 'Excellent',
          engineSize: '600cc',
          serviceHistory: 'Full',
          tyreCondition: 'New',
          description: 'Test motorcycle for pending collection',
          dateAvailable: 'Immediate',
          regNumber: `TEST${i+1}`,
          auctionDuration: '1day',
          status: 'pending_collection',
          soldDate: new Date().toISOString(),
          images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87']
        });
        
        console.log(`Created motorcycle ${newBike.id}: ${newBike.make} ${newBike.model}`);
        availableMotorcycles.push(newBike);
      }
    }
    
    // Create auctions for Mike for the missing count
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    for (let i = 0; i < missingCount; i++) {
      // Get the next available motorcycle
      const motorcycle = availableMotorcycles[i];
      if (!motorcycle) {
        console.error('❌ No motorcycle available for auction', i);
        continue;
      }
      
      // Create a completed auction
      const auction = await storage.createAuction({
        motorcycleId: motorcycle.id,
        dealerId: motorcycle.dealerId,
        startTime: yesterday,
        endTime: twoHoursAgo,
        status: 'pending_collection',
        winningBidId: null,
        winningBidderId: mikeId,
        bidAccepted: true,
        dealConfirmed: true,
        collectionConfirmed: false,
        collectionDate: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(), // 2 days from now
        highestBidderId: mikeId,
        visibilityType: 'all',
        visibilityRadius: null,
        completedAt: twoHoursAgo.toISOString()
      });
      
      console.log(`Created auction ${auction.id} for motorcycle ${motorcycle.id}`);
      
      // Create a bid from mike
      const bid = await storage.createBid({
        auctionId: auction.id,
        dealerId: mikeId,
        amount: 5000 + (i * 500) // Different bid amounts
      });
      
      console.log(`Created bid ${bid.id} from Mike for ${bid.amount}`);
      
      // Update the auction with the bid ID
      await storage.updateAuction(auction.id, {
        winningBidId: bid.id
      });
      
      // Make sure motorcycle status is consistent
      await storage.updateMotorcycle(motorcycle.id, {
        status: 'pending_collection',
        soldDate: now.toISOString()
      });
      
      // Create notification for Mike
      await storage.createNotification({
        userId: mikeId,
        type: 'bid_accepted',
        content: `Your bid for ${motorcycle.make} ${motorcycle.model} has been accepted.`,
        relatedId: auction.id,
        read: false
      });
      
      console.log(`✅ Successfully set up auction ${auction.id} for pending collection`);
    }
    
    // Verify final count
    const finalAuctions = Array.from(storage.auctions.values());
    const finalMikeWins = finalAuctions.filter(a => a.winningBidderId === mikeId && a.bidAccepted);
    
    console.log(`\nFinal result: Mike has ${finalMikeWins.length} auctions where he's the winning bidder`);
    console.log('The expected pending collection count should now be 3');
    
    console.log('\nPLEASE LOG IN AS miketrader (password: password123) TO VERIFY');
    
  } catch (error) {
    console.error('Error in fix script:', error);
  }
}

// Run the function
fixMikePendingCollection();