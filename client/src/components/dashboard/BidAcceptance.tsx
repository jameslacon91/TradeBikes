import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Motorcycle, Bid } from '@shared/schema';
import { AuctionWithDetails } from '@shared/types';
import { 
  Check, 
  X, 
  Gavel, 
  Calendar, 
  ArrowRight, 
  Clock,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';

interface DealerInfo {
  id: number;
  username: string;
  companyName: string;
  rating: number | null;
  totalRatings: number | null;
}

interface BidAcceptanceProps {
  auctions: AuctionWithDetails[];
}

const BidAcceptance: React.FC<BidAcceptanceProps> = ({ auctions }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedAuction, setSelectedAuction] = useState<AuctionWithDetails | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [collectionDate, setCollectionDate] = useState<Date | null>(null);
  const [collectionNotes, setCollectionNotes] = useState('');
  
  // Fetch dealer information
  const { data: dealers = [] } = useQuery<DealerInfo[]>({
    queryKey: ['/api/dealers'],
  });
  
  // Get auctions with bids
  const auctionsWithBids = auctions.filter(auction => auction.bids && auction.bids.length > 0);
  
  // Accept a bid
  const acceptBidMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAuction || !selectedBid) return;
      return await apiRequest('POST', `/api/auctions/${selectedAuction.id}/accept-bid`, {
        bidId: selectedBid.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
      toast({
        title: 'Bid Accepted',
        description: 'The bid has been accepted. Arrange collection details.',
      });
      setIsAcceptDialogOpen(false);
      setIsCollectionDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept bid',
        variant: 'destructive',
      });
    }
  });

  // Schedule collection
  const scheduleCollectionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAuction || !selectedBid || !collectionDate) return;
      return await apiRequest('POST', `/api/auctions/${selectedAuction.id}/schedule-collection`, {
        bidId: selectedBid.id,
        collectionDate,
        notes: collectionNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
      toast({
        title: 'Collection Scheduled',
        description: 'Collection details have been sent to the buyer.',
      });
      setIsCollectionDialogOpen(false);
      resetState();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule collection',
        variant: 'destructive',
      });
    }
  });

  // Reject a bid
  const rejectBidMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAuction || !selectedBid) return;
      return await apiRequest('POST', `/api/auctions/${selectedAuction.id}/reject-bid`, {
        bidId: selectedBid.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
      toast({
        title: 'Bid Rejected',
        description: 'The bid has been rejected.',
      });
      resetState();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject bid',
        variant: 'destructive',
      });
    }
  });

  const handleAcceptBid = (auction: AuctionWithDetails, bid: Bid) => {
    setSelectedAuction(auction);
    setSelectedBid(bid);
    setIsAcceptDialogOpen(true);
  };

  const handleRejectBid = (auction: AuctionWithDetails, bid: Bid) => {
    setSelectedAuction(auction);
    setSelectedBid(bid);
    rejectBidMutation.mutate();
  };

  const resetState = () => {
    setSelectedAuction(null);
    setSelectedBid(null);
    setCollectionDate(null);
    setCollectionNotes('');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd MMM yyyy');
  };
  
  // Function to get dealer name from its ID
  const getDealerName = (dealerId: number): string => {
    // Check if it's the current user
    if (user && user.id === dealerId) {
      return user.companyName || `${user.username}'s Company`;
    }
    
    // Check other dealers
    const dealer = dealers.find(d => d.id === dealerId);
    return dealer ? dealer.companyName : `Dealer #${dealerId}`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <Gavel className="mr-2 h-5 w-5 text-primary" />
            Bids Requiring Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auctionsWithBids.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No bids requiring your action at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {auctionsWithBids.map(auction => (
                <div key={auction.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{auction.motorcycle.make} {auction.motorcycle.model}</h3>
                      <p className="text-sm text-muted-foreground">
                        {auction.motorcycle.year} • {auction.motorcycle.mileage} miles
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Ending</p>
                      <p className="font-medium">{formatDate(auction.endTime)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Latest Bids</h4>
                    
                    {auction.bids.slice(0, 3).map(bid => (
                      <div key={bid.id} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                        <div>
                          <p className="font-semibold">£{bid.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{getDealerName(bid.dealerId)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(bid.createdAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-green-500 hover:text-green-700 hover:bg-green-100"
                            onClick={() => handleAcceptBid(auction, bid)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => handleRejectBid(auction, bid)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {auction.bids.length > 3 && (
                      <Button variant="ghost" size="sm" className="w-full">
                        View all {auction.bids.length} bids
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Accept Bid Confirmation Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Bid</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this bid? This will end the auction and notify the buyer.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAuction && selectedBid && (
            <div className="py-4">
              <div className="flex justify-between mb-4">
                <div className="text-sm">
                  <p className="font-medium">{selectedAuction.motorcycle.make} {selectedAuction.motorcycle.model}</p>
                  <p className="text-muted-foreground">{selectedAuction.motorcycle.year} • {selectedAuction.motorcycle.mileage} miles</p>
                  <p className="text-xs text-muted-foreground mt-2">Bid from: {getDealerName(selectedBid.dealerId)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">£{selectedBid.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Bid amount</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(selectedBid.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => acceptBidMutation.mutate()}
              disabled={acceptBidMutation.isPending}
            >
              {acceptBidMutation.isPending ? 'Accepting...' : 'Accept Bid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Schedule Collection Dialog */}
      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule Collection</DialogTitle>
            <DialogDescription>
              Set a date for the buyer to collect the motorcycle.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAuction && selectedBid && (
            <div className="py-4">
              <div className="flex justify-between mb-4">
                <div className="text-sm">
                  <p className="font-medium">{selectedAuction.motorcycle.make} {selectedAuction.motorcycle.model}</p>
                  <p className="text-muted-foreground">{selectedAuction.motorcycle.year} • {selectedAuction.motorcycle.mileage} miles</p>
                  <p className="text-xs text-muted-foreground mt-2">Buyer: {getDealerName(selectedBid.dealerId)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">£{selectedBid.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Accepted bid</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="collection-date">Collection Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left ${!collectionDate && "text-muted-foreground"}`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {collectionDate ? format(collectionDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={collectionDate}
                    onSelect={(date) => setCollectionDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes for Buyer</Label>
              <Textarea
                id="notes"
                placeholder="Add any instructions or details for collection"
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetState();
              setIsCollectionDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => scheduleCollectionMutation.mutate()}
              disabled={!collectionDate || scheduleCollectionMutation.isPending}
            >
              {scheduleCollectionMutation.isPending ? 'Scheduling...' : 'Schedule Collection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BidAcceptance;