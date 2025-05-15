// Check if the Honda CBR650R motorcycle is properly set for collection
import { storage } from './server/storage';

async function checkMotorcycleStatus() {
  console.log('Checking motorcycle collection status...');
  
  try {
    // Check all auctions to find the Honda CBR650R (motorcycle1)
    // According to the code, this is auction1 with motorcycleId 1
    const auction = await storage.getAuction(1);
    console.log('Auction 1 status:', auction);
    
    if (!auction) {
      console.log('Auction 1 not found');
      return;
    }
    
    // Check the matching motorcycle
    const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
    console.log('Motorcycle status:', motorcycle);
    
    // Check the detailed auction info to see if it's showing up properly
    const auctionWithDetails = await storage.getAuctionWithDetails(1);
    console.log('Auction with details:', auctionWithDetails);
    
    // Find Mike's account (ID 4) to check if he can see the motorcycle
    const mike = await storage.getUser(4);
    console.log('Mike trader account:', mike);
    
    // Check the auctions Mike can see with his bids
    const mikesAuctions = await storage.getAuctionsWithBidsByDealer(4);
    console.log('Auctions with mikes bids:', mikesAuctions.length);
    mikesAuctions.forEach(auction => {
      console.log(`Auction ${auction.id} for ${auction.motorcycle.make} ${auction.motorcycle.model}`);
      console.log(`  Status: ${auction.status}, Motorcycle Status: ${auction.motorcycle.status}`);
      console.log(`  Bid Accepted: ${auction.bidAccepted}, Winner: ${auction.winningBidderId}`);
    });
    
    if (!johndealer || !miketrader) {
      console.error('Could not find required user accounts!');
      return;
    }
    
    console.log(`Found johndealer (ID: ${johndealer.id}) and miketrader (ID: ${miketrader.id})`);
    
    // Create a new test motorcycle
    const testMotorcycle = await storage.createMotorcycle({
      dealerId: johndealer.id,
      make: 'Yamaha',
      model: 'MT-09 [TEST BIKE]',
      year: 2022,
      mileage: 3500,
      color: 'Ice Fluo',
      condition: 'Excellent',
      engineSize: '890cc',
      serviceHistory: 'Full Yamaha dealer service history',
      tyreCondition: 'Excellent - nearly new',
      description: 'TEST BIKE: Yamaha MT-09 in stunning Ice Fluo color. Perfect condition with full service history.',
      dateAvailable: new Date().toISOString(), // Available immediately
      regNumber: 'TEST123',
      auctionDuration: '1day',
      status: 'available',
      soldDate: null,
      images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87']
    });
    
    console.log(`Created test motorcycle: Yamaha MT-09 [TEST BIKE] with ID ${testMotorcycle.id}`);
    
    // Create an auction that ended yesterday
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const testAuction = await storage.createAuction({
      motorcycleId: testMotorcycle.id,
      dealerId: johndealer.id,
      startTime: twoDaysAgo,
      endTime: yesterday,
      visibilityType: 'all',
      visibilityRadius: null,
      collectionDate: now.toISOString()
    });
    
    console.log(`Created test auction for Yamaha MT-09 [TEST BIKE] with ID ${testAuction.id}`);
    
    // Create a bid from miketrader
    const bid = await storage.createBid({
      auctionId: testAuction.id,
      dealerId: miketrader.id,
      amount: 8500
    });
    
    console.log(`Created bid from miketrader for £${bid.amount}`);
    
    // Update auction to show bid accepted and dealConfirmed status
    await storage.updateAuction(testAuction.id, {
      status: 'pending_collection', 
      bidAccepted: true,
      dealConfirmed: true,
      collectionConfirmed: false,
      winningBidId: bid.id,
      winningBidderId: miketrader.id,
      highestBidderId: miketrader.id,
      completedAt: yesterday.toISOString()
    });
    
    console.log(`Updated auction status to pending_collection`);
    
    // Update motorcycle status to match
    await storage.updateMotorcycle(testMotorcycle.id, {
      status: 'pending_collection',
      soldDate: yesterday.toISOString()
    });
    
    console.log(`Updated motorcycle status to pending_collection`);
    
    // Create notification for miketrader
    await storage.createNotification({
      userId: miketrader.id,
      type: 'collection_pending',
      content: 'Your winning bid for Yamaha MT-09 [TEST BIKE] has been accepted. The motorcycle is ready for collection.',
      relatedId: testAuction.id,
      read: false
    });
    
    console.log(`Created notification for miketrader about pending collection`);
    
    console.log('Test motorcycle setup complete!');
    console.log(`Please log in as miketrader (username: miketrader, password: password123) to view the pending collection.`);
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Run the function
createTestBike();