import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Users, AlertCircle } from 'lucide-react';
import { AuctionWithDetails } from '@shared/types';
import { useAuth } from '@/hooks/use-auth';
import PendingActions from '@/components/dashboard/PendingActions';

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
  const { user } = useAuth();
  
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
          src={motorcycle.images && motorcycle.images.length > 0 
            ? motorcycle.images[0] 
            : "/placeholder-bike.jpg"
          } 
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
            By: Dealer #{dealerId}
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
        
        {status === 'pending_collection' && (
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center gap-2 mb-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {dealerId === user?.id 
                  ? "Pending buyer collection"
                  : "Ready for collection"
                }
              </span>
            </div>
            
            {/* Display collection date prominently */}
            {motorcycle.dateAvailable && (
              <div className="mb-3 p-2 bg-amber-50 rounded border border-amber-200 text-sm">
                <p className="font-semibold">Collection Date:</p>
                <p className="text-amber-700">
                  {(() => {
                    try {
                      const date = new Date(motorcycle.dateAvailable);
                      // Check if date is valid
                      if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('en-GB', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      }
                      return "Date to be confirmed";
                    } catch (error) {
                      console.error("Error formatting collection date:", error);
                      return "Date to be confirmed";
                    }
                  })()}
                </p>
              </div>
            )}
            
            <PendingActions 
              auction={auction} 
              isSeller={dealerId === user?.id} 
            />
          </div>
        )}

        {status !== 'pending_collection' && (
          <Link href={`/auctions/${id}`}>
            <Button className="w-full mt-4" variant={isActive ? "default" : "outline"}>
              {isActive 
                ? (dealerId === user?.id 
                  ? "View" 
                  : "View & Bid") 
                : "View Details"
              }
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}