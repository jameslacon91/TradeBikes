import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout/Layout';
import BidForm from '@/components/forms/BidForm';
import BidHistory from '@/components/auctions/BidHistory';
import BidConfirmation from '@/components/auctions/BidConfirmation';
import BidCollectionConfirmation from '@/components/auctions/BidCollectionConfirmation';
import AuctionReviews from '@/components/reviews/AuctionReviews';
import { formatTimeDifference, isEndingSoon } from '@/lib/countdownTimer';
import { AuctionWithDetails } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Bookmark, Timer, CheckCircle, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from '@radix-ui/react-icons';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isValid } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AuctionDetail() { // Component name kept as-is for compatibility
  const [auctionsMatch, auctionsParams] = useRoute<{ id: string }>('/auctions/:id');
  const [stockMatch, stockParams] = useRoute<{ id: string }>('/stock/:id');
  const [underwritesMatch, underwritesParams] = useRoute<{ id: string }>('/underwrites/:id');
  
  const params = auctionsParams || stockParams || underwritesParams;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [endingSoon, setEndingSoon] = useState(false);
  const [showBidSelection, setShowBidSelection] = useState(false);
  const [selectedBid, setSelectedBid] = useState<number | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState<Date | null>(null);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Mutation to end underwrite early
  const endUnderwriteMutation = useMutation({
    mutationFn: async (auctionId: number) => {
      const res = await apiRequest('PATCH', `/api/auctions/${auctionId}/end`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Underwrite ended",
        description: "You can now select a winning bid.",
        variant: "default",
      });
      // Invalidate all relevant queries to update UI across the app
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setShowBidSelection(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to end underwrite: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to accept a bid
  const acceptBidMutation = useMutation({
    mutationFn: async ({ auctionId, bidId, availabilityDate }: { auctionId: number; bidId: number; availabilityDate: Date | null }) => {
      const res = await apiRequest('POST', `/api/auctions/${auctionId}/accept-bid`, { 
        bidId, 
        availabilityDate: availabilityDate ? availabilityDate.toISOString() : null 
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid accepted",
        description: "The bidder has been notified and estimated availability date has been set.",
        variant: "default",
      });
      // Invalidate all relevant queries to update UI across the app
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      
      setShowBidSelection(false);
      setShowAvailabilityDialog(false);
      setSelectedBid(null);
      setAvailabilityDate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to accept bid: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Function to handle bid selection
  const handleBidSelection = (bidId: number) => {
    setSelectedBid(bidId);
    setShowAvailabilityDialog(true);
  }
  
  // Function to finalize bid acceptance with availability date
  const handleAcceptBidWithAvailability = () => {
    if (selectedBid === null) return;
    
    // Ensure we have a valid date before submitting
    if (!availabilityDate) {
      toast({
        title: "Error",
        description: "Please select an availability date",
        variant: "destructive",
      });
      return;
    }
    
    acceptBidMutation.mutate({ 
      auctionId: auctionId, 
      bidId: selectedBid,
      availabilityDate: availabilityDate
    });
    
    // Close the dialog
    setShowAvailabilityDialog(false);
  };
  
  // These variables will be set after auction data is loaded

  const auctionId = params ? parseInt(params.id) : 0;

  // Fetch auction details
  const { data: auction, isLoading, error } = useQuery<AuctionWithDetails>({
    queryKey: [`/api/auctions/${auctionId}`],
    enabled: !!auctionId,
  });
  
  // Fetch dealer information
  const { data: dealers = [] } = useQuery<any[]>({
    queryKey: ['/api/dealers'],
  });

  // Update countdown timer
  useEffect(() => {
    if (!auction) return;
    
    // Debug log
    console.log('Auction loaded:', auction);
    console.log('Bids available:', auction.bids);

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
              <p className="text-gray-500">Loading underwrite details...</p>
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
              <p className="text-red-500">Error loading underwrite. Please try again.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const { motorcycle } = auction;
  
  // Define role and ownership variables
  // Since all users are dealers now, we define seller/buyer relationships based on the auction
  const isDealer = true; // All users are dealers in the unified model
  const isSeller = user?.id === auction.dealerId; // This dealer created the auction (seller)
  const isBuyer = user?.id !== auction.dealerId; // This dealer is viewing another's auction (potential buyer)
  const dealerOwnsAuction = isSeller; // Simplified for clarity
  
  // Check if auction is active
  const isActive = auction.status === 'active' && timeLeft !== 'Ended';

  // Check if we're on the stock page
  const isStockPage = stockMatch || window.location.pathname.includes('/stock');
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 rounded-t-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {motorcycle.make} {motorcycle.model}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {isActive ? (isStockPage ? 'Available Stock' : 'Active Underwrite') : 'Underwriting Ended'}
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
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Availability Date</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {motorcycle.dateAvailable ? new Date(motorcycle.dateAvailable).toLocaleDateString() : 'Upon auction completion'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Registration</h4>
                      <p className="mt-1 text-sm text-gray-900">{motorcycle.regNumber || 'Not specified'}</p>
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
                
                {/* End underwrite early button - only for seller of active underwrite */}
                {isSeller && isActive && (
                  <div className="mb-4 border-t border-gray-200 pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center"
                      onClick={() => endUnderwriteMutation.mutate(auction.id)}
                      disabled={endUnderwriteMutation.isPending}
                    >
                      <Timer className="mr-2 h-4 w-4" />
                      {endUnderwriteMutation.isPending ? 'Ending...' : 'End Underwrite'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      End this underwrite to select your preferred bid from all current offers
                    </p>
                  </div>
                )}
                
                {/* Show bid form for traders on active auctions */}
                {isBuyer && isActive && (
                  <div className="border-t border-gray-200 pt-4">
                    <BidForm
                      auctionId={auction.id}
                      isStock={isStockPage}
                    />
                  </div>
                )}
                
                {/* Blind underwrite notice for bidders */}
                {isBuyer && (
                  <div className="mt-4 bg-blue-50 text-blue-800 p-4 rounded-md">
                    <h4 className="font-medium">Blind Underwrite Information</h4>
                    <p className="text-sm mt-1">
                      This is a blind underwrite. Your bid is only visible to the selling dealer.
                      Other dealers cannot see any bid information, ensuring a fair and competitive bidding process.
                    </p>
                  </div>
                )}
                
                {/* Bid history - only visible to the dealer who created the auction */}
                {dealerOwnsAuction && (
                  <div className="mt-4">
                    <BidHistory auctionId={auction.id} currentBid={auction.currentBid} />
                  </div>
                )}
                
                {/* Bid selection - only visible when underwrite ended early by seller */}
                {dealerOwnsAuction && showBidSelection && auction.bids && auction.bids.length > 0 && (
                  <div className="mt-4 border-t pt-4 border-gray-200">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                      <h4 className="font-medium text-yellow-800 flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4" /> Select Winning Bid
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        You have ended this underwrite early. Please select your preferred bid from the list below.
                        You'll be asked to set an estimated availability date for the motorcycle.
                      </p>
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {auction.bids && Array.isArray(auction.bids) && auction.bids.sort((a, b) => b.amount - a.amount).map(bid => {
                        // Get dealer info for display
                        const bidder = dealers && dealers.find ? dealers.find(d => d && d.id === bid.dealerId) : null;
                        const dealerName = bidder && bidder.companyName ? bidder.companyName : `Buyer #${bid.dealerId}`;
                        
                        return (
                          <div 
                            key={bid.id} 
                            className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200 hover:border-primary transition-colors"
                          >
                            <div>
                              <p className="font-medium">£{bid.amount.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">
                                {dealerName} • {bid.createdAt ? new Date(bid.createdAt).toLocaleString() : 'Recently'}
                              </p>
                            </div>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleBidSelection(bid.id)}
                              disabled={acceptBidMutation.isPending}
                            >
                              {acceptBidMutation.isPending && selectedBid === bid.id 
                                ? 'Accepting...' 
                                : 'Accept Bid'
                              }
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Availability Date Dialog */}
                <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Set Estimated Availability Date</DialogTitle>
                      <DialogDescription>
                        Please select when this motorcycle will be available for collection by the winning bidder.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="availability" className="text-right">
                          Date
                        </Label>
                        <div className="col-span-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${!availabilityDate && "text-muted-foreground"}`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {availabilityDate && isValid(availabilityDate) ? format(availabilityDate, "PPP") : "Select a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={availabilityDate ?? undefined}
                                onSelect={(date) => setAvailabilityDate(date && isValid(date) ? date : null)}
                                initialFocus
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={handleAcceptBidWithAvailability}
                        disabled={!availabilityDate || acceptBidMutation.isPending}
                      >
                        {acceptBidMutation.isPending ? "Accepting..." : "Accept Bid"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {/* Bid confirmation widget - show for ended auctions */}
                {timeLeft === 'Ended' && (dealerOwnsAuction || (isBuyer && user?.id === auction.winningBidderId)) && auction.currentBid && (
                  <div className="space-y-4">
                    <BidConfirmation
                      auctionId={auction.id}
                      bid={{
                        id: auction.winningBidId || 0,
                        auctionId: auction.id,
                        dealerId: auction.winningBidderId || 0,
                        amount: auction.currentBid,
                        createdAt: new Date()
                      }}
                      isAccepted={auction.bidAccepted || false}
                      isDealer={isSeller}
                      isBuyer={isBuyer}
                      bidderId={auction.winningBidderId || 0}
                      dealConfirmed={auction.dealConfirmed || false}
                      collectionConfirmed={auction.collectionConfirmed || false}
                      onSuccess={() => {/* Refresh auction data */}}
                    />
                    
                    {/* Show collection confirmation for accepted bids */}
                    {auction.bidAccepted && isBuyer && user?.id === auction.winningBidderId && (
                      <BidCollectionConfirmation
                        auctionId={auction.id}
                        bid={{
                          id: auction.winningBidId || 0,
                          auctionId: auction.id,
                          dealerId: auction.winningBidderId || 0,
                          amount: auction.currentBid,
                          createdAt: new Date()
                        }}
                        dealConfirmed={auction.dealConfirmed || false}
                        collectionConfirmed={auction.collectionConfirmed || false}
                        collectionDate={auction.collectionDate ? new Date(auction.collectionDate) : null}
                        onSuccess={() => {/* Refresh auction data */}}
                      />
                    )}
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
        
        {/* Reviews section - only show for fully completed transactions */}
        {auction.collectionConfirmed && (user?.id === auction.dealerId || user?.id === auction.winningBidderId) && (
          <div className="mt-8 px-4 sm:px-6 lg:px-8">
            <AuctionReviews
              auctionId={auction.id}
              motorcycleId={motorcycle.id}
              dealerId={auction.dealerId}
              dealerName="Dealer Name" // In a real implementation, this would be fetched from the dealer data
              bidderId={auction.winningBidderId || 0}
              bidderName="Winning Bidder" // In a real implementation, this would be fetched from the dealer data
              isCompleted={auction.collectionConfirmed === true}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
