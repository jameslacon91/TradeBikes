import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Users, Motorcycle as MotorcycleIcon } from 'lucide-react';
import { AuctionWithDetails } from '@shared/types';

interface AuctionCardProps {
  auction: AuctionWithDetails;
  showDealerInfo?: boolean;
  hideEndingSoon?: boolean;
}

export default function AuctionCard({
  auction,
  showDealerInfo = false,
  hideEndingSoon = false
}: AuctionCardProps) {
  const { id, motorcycle, currentBid, totalBids, endTime, status, dealerId } = auction;
  
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [endingSoon, setEndingSoon] = useState<boolean>(false);
  
  // Format time difference between now and end time
  const formatTimeDifference = (endTime: Date) => {
    try {
      const now = new Date();
      const end = new Date(endTime);
      
      if (now > end) return "Ended";
      
      return formatDistanceToNow(end, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting time difference:", error);
      return "Unknown";
    }
  };
  
  // Check if auction is ending soon (less than 30 minutes)
  const isEndingSoon = (endTime: Date) => {
    try {
      const now = new Date();
      const end = new Date(endTime);
      const diffMs = end.getTime() - now.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      
      return diffMinutes > 0 && diffMinutes < 30;
    } catch (error) {
      return false;
    }
  };
  
  // Update time remaining
  useEffect(() => {
    if (!endTime) return;
    
    // Initial update
    setTimeLeft(formatTimeDifference(endTime));
    setEndingSoon(isEndingSoon(endTime));
    
    // Set up interval to update time
    const interval = setInterval(() => {
      setTimeLeft(formatTimeDifference(endTime));
      setEndingSoon(isEndingSoon(endTime));
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [endTime]);
  
  const isActive = status === 'active' && timeLeft !== "Ended";
  
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        <img 
          src={motorcycle.imageUrl || "/placeholder-bike.jpg"} 
          alt={`${motorcycle.make} ${motorcycle.model}`}
          className="h-48 w-full object-cover"
        />
        
        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <Badge className={
            status === 'active' ? 'bg-green-500' : 
            status === 'completed' ? 'bg-blue-500' : 
            status === 'pending_collection' ? 'bg-amber-500' : 'bg-gray-500'
          }>
            {status === 'active' ? 'Active' : 
             status === 'completed' ? 'Completed' : 
             status === 'pending_collection' ? 'Pending Collection' : 'Expired'}
          </Badge>
        </div>
        
        {/* Ending soon alert */}
        {!hideEndingSoon && endingSoon && isActive && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white py-1 px-2 text-xs text-center">
            Ending soon!
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg">
          {motorcycle.year} {motorcycle.make} {motorcycle.model}
        </h3>
        
        <div className="mt-1 text-sm text-muted-foreground">
          {motorcycle.mileage.toLocaleString()} miles | {motorcycle.condition}
        </div>
        
        {showDealerInfo && (
          <div className="text-xs text-muted-foreground mt-1">
            By: {auction.dealerName || `Dealer #${dealerId}`}
          </div>
        )}
        
        <div className="mt-3 flex justify-between items-center">
          <div>
            <div className="font-medium">
              {currentBid ? `£${currentBid.toLocaleString()}` : 'No bids yet'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              {totalBids} bid{totalBids !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium">{timeLeft}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {isActive ? 'Remaining' : 'Ended'}
            </div>
          </div>
        </div>
        
        <Link href={`/auctions/${id}`}>
          <Button className="w-full mt-4" variant={isActive ? "default" : "outline"}>
            {isActive ? "View & Bid" : "View Details"}
          </Button>
        </Link>
      </div>
    </div>
  );
}