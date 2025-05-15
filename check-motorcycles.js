// Directly modify the motorcycle data for MikeTrader
require('./server/index'); // This should initialize everything

setTimeout(() => {
  const storage = require('./server/storage').storage;
  
  // Check Mike's auctions
  async function checkMikesAuctions() {
    try {
      console.log("Checking MikeTrader's auctions and bids");
      
      // Mike is ID 4
      const mikeId = 4;
      
      // Get auctions where Mike placed bids
      const auctionsWithBids = await storage.getAuctionsWithBidsByDealer(mikeId);
      console.log(`Found ${auctionsWithBids.length} auctions where Mike placed bids`);
      
      for (const auction of auctionsWithBids) {
        console.log(`\nAuction #${auction.id} for ${auction.motorcycle.make} ${auction.motorcycle.model}`);
        console.log(`Status: ${auction.status}`);
        console.log(`Motorcycle Status: ${auction.motorcycle.status}`);
        console.log(`Bid Accepted: ${auction.bidAccepted}`);
        console.log(`Winning Bidder ID: ${auction.winningBidderId}`);
        console.log(`Deal Confirmed: ${auction.dealConfirmed}`);
        console.log(`Collection Confirmed: ${auction.collectionConfirmed}`);
        
        // Check Mike's bids on this auction
        const mikesBids = auction.bids.filter(bid => bid.dealerId === mikeId);
        console.log(`Mike placed ${mikesBids.length} bids on this auction`);
        for (const bid of mikesBids) {
          console.log(`Bid #${bid.id}: £${bid.amount}`);
        }
      }
      
      // Check notifications for Mike
      const notifications = await storage.getNotificationsByUserId(mikeId);
      console.log(`\nFound ${notifications.length} notifications for Mike`);
      
      for (const notification of notifications) {
        console.log(`Notification #${notification.id}: ${notification.type}`);
        console.log(`Content: ${notification.content}`);
        console.log(`Read: ${notification.read}`);
        console.log(`Created: ${notification.createdAt}`);
        console.log(`---`);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error checking auctions:', error);
      process.exit(1);
    }
  }
  
  checkMikesAuctions();
}, 2000); // Wait for initialization