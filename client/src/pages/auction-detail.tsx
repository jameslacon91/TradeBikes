import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout/Layout';
import BidForm from '@/components/forms/BidForm';
import BidHistory from '@/components/auctions/BidHistory';
import { formatTimeDifference, isEndingSoon } from '@/lib/countdownTimer';
import { AuctionWithDetails } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Bookmark } from 'lucide-react';

export default function AuctionDetail() {
  const [auctionsMatch, auctionsParams] = useRoute<{ id: string }>('/auctions/:id');
  const [stockMatch, stockParams] = useRoute<{ id: string }>('/stock/:id');
  
  const params = auctionsParams || stockParams;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [endingSoon, setEndingSoon] = useState(false);
  const { user } = useAuth();
  
  // These variables will be set after auction data is loaded

  const auctionId = params ? parseInt(params.id) : 0;

  // Fetch auction details
  const { data: auction, isLoading, error } = useQuery<AuctionWithDetails>({
    queryKey: [`/api/auctions/${auctionId}`],
    enabled: !!auctionId,
  });

  // Update countdown timer
  useEffect(() => {
    if (!auction) return;

    const updateTimer = () => {
      setTimeLeft(formatTimeDifference(new Date(auction.endTime)));
      setEndingSoon(isEndingSoon(new Date(auction.endTime)));
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-10">
              <p className="text-gray-500">Loading auction details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !auction) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-10">
              <p className="text-red-500">Error loading auction. Please try again.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const { motorcycle } = auction;
  
  // Define role and ownership variables
  const isTrader = user?.role === 'trader';
  const isDealer = user?.role === 'dealer';
  const dealerOwnsAuction = isDealer && auction.dealerId === user?.id;
  
  // Check if auction is active
  const isActive = auction.status === 'active' && timeLeft !== 'Ended';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 rounded-t-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {motorcycle.make} {motorcycle.model}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {isActive ? 'Active Auction' : 'Auction Ended'}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {motorcycle.year} • {motorcycle.mileage.toLocaleString()} miles • {motorcycle.condition} Condition • {motorcycle.engineSize}
          </p>
        </div>

        <div className="border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left column - Images */}
            <div className="p-4 border-r border-gray-200">
              <div className="mb-4">
                {motorcycle.images && motorcycle.images.length > 0 ? (
                  <img 
                    src={motorcycle.images[selectedImageIndex]} 
                    alt={`${motorcycle.make} ${motorcycle.model}`} 
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                    <p className="text-gray-500">No image available</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {motorcycle.images && motorcycle.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${motorcycle.make} ${motorcycle.model} view ${index + 1}`}
                    className={`w-full h-auto rounded cursor-pointer ${selectedImageIndex === index ? 'border-2 border-primary' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  />
                ))}
              </div>
            </div>

            {/* Right column - Details */}
            <div className="p-4 flex flex-col">
              <Tabs defaultValue="details">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="specs">Specifications</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1 text-sm text-gray-900">{motorcycle.description}</p>
                  </div>
                </TabsContent>
                <TabsContent value="specs">
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Engine</h4>
                      <p className="mt-1 text-sm text-gray-900">{motorcycle.engineSize}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Condition</h4>
                      <p className="mt-1 text-sm text-gray-900">{motorcycle.condition}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Color</h4>
                      <p className="mt-1 text-sm text-gray-900">{motorcycle.color}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Service History</h4>
                      <p className="mt-1 text-sm text-gray-900">{motorcycle.serviceHistory || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Tyre Condition</h4>
                      <p className="mt-1 text-sm text-gray-900">{motorcycle.tyreCondition || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Year</h4>
                      <p className="mt-1 text-sm text-gray-900">{motorcycle.year}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Mileage</h4>
                      <p className="mt-1 text-sm text-gray-900">{motorcycle.mileage.toLocaleString()} miles</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Current Bid</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {auction.currentBid ? `£${auction.currentBid.toLocaleString()}` : 'No bids yet'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Time Remaining</h4>
                    <p className={`text-2xl font-bold ${timeLeft === 'Ended' ? 'text-gray-500' : endingSoon ? 'text-accent countdown animate-pulse' : 'text-accent countdown'}`}>
                      {timeLeft}
                    </p>
                  </div>
                </div>
                
                {/* Show bid form for traders on active auctions */}
                {isTrader && isActive && (
                  <div className="border-t border-gray-200 pt-4">
                    <BidForm
                      auctionId={auction.id}
                      currentBid={auction.currentBid}
                      startingPrice={auction.startingPrice}
                    />
                  </div>
                )}
                
                {/* Blind auction notice for traders */}
                {isTrader && (
                  <div className="mt-4 bg-blue-50 text-blue-800 p-4 rounded-md">
                    <h4 className="font-medium">Blind Auction Information</h4>
                    <p className="text-sm mt-1">
                      This is a blind auction. Your bid is only visible to the selling dealer.
                      Other traders cannot see any bid information, ensuring a fair and competitive bidding process.
                    </p>
                  </div>
                )}
                
                {/* Bid history - only visible to the dealer who created the auction */}
                {dealerOwnsAuction && (
                  <div className="mt-4">
                    <BidHistory auctionId={auction.id} currentBid={auction.currentBid} />
                  </div>
                )}
              </div>
              
              <div className="mt-auto flex justify-between pt-4">
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask Question
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
