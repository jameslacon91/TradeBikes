import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { formatTimeDifference, isEndingSoon } from '@/lib/countdownTimer';
import { Auction, Motorcycle } from '@shared/schema';

interface AuctionCardProps {
  id: number;
  motorcycle: Motorcycle;
  currentBid?: number;
  totalBids: number;
  endTime: Date;
  status: string;
}

export default function AuctionCard({
  id,
  motorcycle,
  currentBid,
  totalBids,
  endTime,
  status
}: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>(formatTimeDifference(endTime));
  const [endingSoon, setEndingSoon] = useState<boolean>(isEndingSoon(endTime));

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(formatTimeDifference(endTime));
      setEndingSoon(isEndingSoon(endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const isActive = status === 'active' && timeLeft !== 'Ended';

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
      <div className="relative">
        {motorcycle.images && motorcycle.images.length > 0 ? (
          <img 
            src={motorcycle.images[0]} 
            alt={`${motorcycle.make} ${motorcycle.model}`} 
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">No image available</p>
          </div>
        )}
        <div className="absolute top-0 right-0 m-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {isActive ? 'Live' : 'Ended'}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="text-white font-semibold text-lg">{motorcycle.make} {motorcycle.model}</div>
          <div className="text-gray-200 text-sm">{motorcycle.year} • {motorcycle.mileage.toLocaleString()} miles</div>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">Current Bid</span>
            <p className="text-xl font-bold text-gray-900">
              {currentBid ? `£${currentBid.toLocaleString()}` : 'No bids'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Bids</span>
            <p className="text-xl font-bold text-gray-900">{totalBids}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Time Left</span>
            <p className={`text-xl font-bold ${timeLeft === 'Ended' ? 'text-gray-500' : endingSoon ? 'text-accent countdown animate-pulse' : 'text-accent countdown'}`}>
              {timeLeft}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-4 py-3 text-right">
        {/* Determine the link based on the current location */}
        <Link href={window.location.pathname.includes('/stock') ? `/stock/${id}` : `/auctions/${id}`}>
          <Button>View Details</Button>
        </Link>
      </div>
    </div>
  );
}
