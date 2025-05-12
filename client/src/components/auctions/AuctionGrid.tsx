import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AuctionCard from './AuctionCard';
import { AuctionWithDetails } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

export default function AuctionGrid() {
  const [make, setMake] = useState<string>('all');
  
  const { data: auctions = [], isLoading, error } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions'],
  });

  // Filter auctions by make if selected
  const filteredAuctions = make === 'all' 
    ? auctions 
    : auctions.filter(auction => auction.motorcycle.make.toLowerCase() === make.toLowerCase());
  
  // Get unique motorcycle makes for filter
  const makes = ['All', ...new Set(auctions.map(auction => auction.motorcycle.make))];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Loading auctions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-500">Error loading auctions. Please try again.</div>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">No active auctions found.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Active Auctions</h2>
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
            id={auction.id}
            motorcycle={auction.motorcycle}
            currentBid={auction.currentBid}
            totalBids={auction.totalBids}
            endTime={new Date(auction.endTime)}
            status={auction.status}
          />
        ))}
      </div>
      
      {filteredAuctions.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No auctions found matching the selected filter.</p>
        </div>
      )}
    </div>
  );
}
