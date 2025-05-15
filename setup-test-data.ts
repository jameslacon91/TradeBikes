// Direct modifications to fix the motorcycle status issue
import { storage } from './server/storage';

// Get johndealer and miketrader users
const johndealer = storage.getUserByUsername('johndealer');
const miketrader = storage.getUserByUsername('miketrader');

// Get Honda CBR motorcycle
const motorcycles = Array.from(storage.motorcycles.values());
const hondaCBR = motorcycles.find(m => 
  m.make === 'Honda' && m.model === 'CBR650R'
);

// Get its auction
const auctions = Array.from(storage.auctions.values());
const hondaAuction = auctions.find(a => 
  a.motorcycleId === hondaCBR?.id
);

// Update the motorcycle and auction
if (hondaCBR && hondaAuction) {
  console.log(`Found Honda CBR650R (ID: ${hondaCBR.id}) and its auction (ID: ${hondaAuction.id})`);
  
  // Update motorcycle status
  storage.updateMotorcycle(hondaCBR.id, {
    status: 'pending_collection',
    soldDate: new Date().toISOString()
  });
  
  // Update auction status
  storage.updateAuction(hondaAuction.id, {
    status: 'pending_collection',
    bidAccepted: true,
    dealConfirmed: true,
    winningBidderId: miketrader?.id || 4,
    winningBidId: 3, // Assuming bid ID 3 is the highest bid from mike
    highestBidderId: miketrader?.id || 4,
    completedAt: new Date().toISOString()
  });
  
  // Add a notification for miketrader
  storage.createNotification({
    userId: miketrader?.id || 4,
    type: 'collection_pending',
    content: 'Your winning bid for Honda CBR650R has been accepted. The motorcycle is ready for collection.',
    relatedId: hondaAuction.id,
    read: false
  });
  
  console.log('Updated Honda CBR650R to pending_collection status for miketrader');
} else {
  console.log('Could not find Honda CBR650R or its auction');
}

// Print debug info about motorcycles
console.log('\nMotorcycles in storage:');
motorcycles.forEach(m => {
  console.log(`${m.make} ${m.model} - Status: ${m.status}, DealerID: ${m.dealerId}`);
});

// Print debug info about auctions
console.log('\nAuctions in storage:');
auctions.forEach(a => {
  const motorcycle = storage.motorcycles.get(a.motorcycleId);
  console.log(`Auction ${a.id} for ${motorcycle?.make} ${motorcycle?.model}`);
  console.log(`  Status: ${a.status}, Bid Accepted: ${a.bidAccepted}, Winner: ${a.winningBidderId}`);
});