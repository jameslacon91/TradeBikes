import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import AuctionCard from './AuctionCard';
import { AuctionWithDetails } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

export default function AuctionGrid() { // Component name kept as-is for compatibility
  const [make, setMake] = useState<string>('all');
  const { user } = useAuth();
  
  // Get auctions where the current user has placed bids
  const { data: auctions = [], isLoading, error } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions'],
  });

  // Filter to only show auctions where the current user has made bids
  const myBidAuctions = auctions.filter(auction => 
    auction.bids?.some(bid => bid.dealerId === user?.id)
  );

  // Filter auctions by make if selected
  const filteredAuctions = make === 'all' 
    ? myBidAuctions 
    : myBidAuctions.filter(auction => auction.motorcycle.make.toLowerCase() === make.toLowerCase());
  
  // Get unique motorcycle makes for filter
  const makes = ['All', ...Array.from(new Set(myBidAuctions.map(auction => auction.motorcycle.make)))];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Loading your bids...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-500">Error loading your bids. Please try again.</div>
      </div>
    );
  }

  if (myBidAuctions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">You haven't placed any bids yet.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">My Bids</h2>
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="mr-3">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Select value={make} onValueChange={setMake}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Makes" />
            </SelectTrigger>
            <SelectContent>
              {makes.map(m => (
                <SelectItem key={m} value={m.toLowerCase()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAuctions.map((auction) => (
          <AuctionCard
            key={auction.id}
            auction={auction}
            showDealerInfo={true}
          />
        ))}
      </div>
      
      {filteredAuctions.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No listings found matching the selected filter.</p>
        </div>
      )}
    </div>
  );
}
