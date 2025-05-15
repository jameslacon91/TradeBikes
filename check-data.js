// Check what data exists in the storage
import { storage } from './server/storage.js';

async function checkData() {
  console.log('Checking available data in storage...');
  
  try {
    // Get all users
    console.log('\n--- USERS ---');
    const users = Array.from(storage.getAllUsers().values());
    users.forEach(user => {
      console.log(`User ID ${user.id}: ${user.username} (${user.role})`);
    });
    
    // Get motorcycles with dealer1
    const dealer1 = users.find(u => u.role === 'dealer' && u.id === 1);
    if (dealer1) {
      console.log(`\n--- MOTORCYCLES FROM ${dealer1.username.toUpperCase()} ---`);
      const motorcycles = await storage.getMotorcyclesByDealerId(dealer1.id);
      motorcycles.forEach(bike => {
        console.log(`Motorcycle ID ${bike.id}: ${bike.make} ${bike.model} (Status: ${bike.status})`);
      });
    }
    
    // Get Mike's info
    const mike = users.find(u => u.username === 'miketrader');
    if (mike) {
      console.log(`\n--- MIKE'S INFO ---`);
      console.log(`Mike's ID: ${mike.id}`);
      
      // Get auctions where Mike has placed bids
      console.log('\n--- MIKE\'S AUCTIONS ---');
      const mikesAuctions = await storage.getAuctionsWithBidsByDealer(mike.id);
      console.log(`Found ${mikesAuctions.length} auctions for Mike`);
      
      // Get all auctions where Mike is the winning bidder
      console.log('\n--- AUCTIONS WHERE MIKE IS WINNER ---');
      const allAuctions = [];
      
      // Iterate through all auctions to check for Mike as winner
      for (let i = 1; i <= 20; i++) {
        const auction = await storage.getAuction(i);
        if (auction && auction.winningBidderId === mike.id) {
          allAuctions.push(auction);
          console.log(`Auction ID ${auction.id}: Winner ID ${auction.winningBidderId} (Status: ${auction.status})`);
          
          // Check matching motorcycle
          const motorcycle = await storage.getMotorcycle(auction.motorcycleId);
          if (motorcycle) {
            console.log(`  Motorcycle: ${motorcycle.make} ${motorcycle.model} (Status: ${motorcycle.status})`);
          } else {
            console.log(`  Motorcycle ID ${auction.motorcycleId} not found!`);
          }
        }
      }
      
      if (allAuctions.length === 0) {
        console.log('No auctions found where Mike is the winner');
      }
    }
    
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

// Run the function
checkData();