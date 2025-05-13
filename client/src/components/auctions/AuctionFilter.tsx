import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, Search } from 'lucide-react';
import { AuctionWithDetails } from '@shared/types';
import AuctionCard from '@/components/auctions/AuctionCard';
import { Link } from 'wouter';
import { ReactNode } from 'react';

interface AuctionFilterProps {
  auctions: AuctionWithDetails[];
  title: string;
  totalCount: number;
  isLoading: boolean;
  emptyMessage: string;
  emptyIcon?: ReactNode;
  emptyActionText?: string;
  emptyActionHref?: string;
}

export default function AuctionFilter({
  auctions,
  title,
  totalCount,
  isLoading,
  emptyMessage,
  emptyIcon,
  emptyActionText,
  emptyActionHref
}: AuctionFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  
  const filteredAuctions = auctions
    .filter(auction => 
      auction.motorcycle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.motorcycle.model.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOption === 'ending-soon') {
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      } else if (sortOption === 'highest-bid') {
        return (b.currentBid || 0) - (a.currentBid || 0);
      } else {
        return 0;
      }
    });
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-medium">{title} <span className="text-muted-foreground">({totalCount})</span></h3>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="ending-soon">Ending Soon</option>
            <option value="highest-bid">Highest Bid</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-40 w-full mb-3" />
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          {emptyIcon || <Filter className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />}
          <h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
          {emptyActionText && emptyActionHref && (
            <Link href={emptyActionHref}>
              <Button>{emptyActionText}</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAuctions.map(auction => (
            <AuctionCard 
              key={auction.id}
              auction={auction}
              showDealerInfo={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}