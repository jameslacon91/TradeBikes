import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Motorcycle, AuctionWithDetails, Bid } from '@shared/types';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Check, X, AlertCircle } from 'lucide-react';

interface BidAcceptanceProps {
  auctions: AuctionWithDetails[];
}

export default function BidAcceptance({ auctions }: BidAcceptanceProps) {
  const { toast } = useToast();
  
  // Accept bid mutation
  const acceptBidMutation = useMutation({
    mutationFn: async ({ auctionId, bidId, bidderId }: { auctionId: number, bidId: number, bidderId: number }) => {
      const res = await apiRequest("POST", `/api/auctions/${auctionId}/accept-bid`, {
        bidId,
        bidderId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bid accepted",
        description: "You have successfully accepted the bid.",
      });
      
      // Invalidate auction queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept bid",
        description: error.message || "Something went wrong while accepting the bid.",
        variant: "destructive",
      });
    }
  });
  
  // Filter auctions with bids
  const auctionsWithBids = auctions.filter(auction => 
    auction.bids && auction.bids.length > 0 && auction.status === 'active'
  );
  
  if (auctionsWithBids.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Bids</CardTitle>
          <CardDescription>Review and accept bids on your active underwrites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No pending bids to review</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Handle bid acceptance
  const handleAcceptBid = (auctionId: number, bidId: number, bidderId: number) => {
    acceptBidMutation.mutate({ auctionId, bidId, bidderId });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Bids</CardTitle>
        <CardDescription>Review and accept bids on your active underwrites</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {auctionsWithBids.map(auction => (
            <div key={auction.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-medium">
                    {auction.motorcycle.year} {auction.motorcycle.make} {auction.motorcycle.model}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {auction.bids.length} bid{auction.bids.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {auction.bids.map(bid => (
                  <div key={bid.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-medium">£{bid.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(bid.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleAcceptBid(auction.id, bid.id, bid.dealerId)}
                        disabled={acceptBidMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}