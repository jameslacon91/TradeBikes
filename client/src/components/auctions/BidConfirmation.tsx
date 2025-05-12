import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Bid } from '@shared/schema';
import { cn } from '@/lib/utils';

interface BidConfirmationProps {
  auctionId: number;
  bid: Bid;
  isAccepted: boolean;
  isDealer: boolean; // The seller - the dealer who created the auction
  isBuyer: boolean;  // The buyer - the dealer who placed the bid
  bidderId: number;  // ID of the dealer who placed the winning bid
  dealConfirmed: boolean;
  collectionConfirmed: boolean;
  onSuccess?: () => void;
}

export default function BidConfirmation({
  auctionId,
  bid,
  isAccepted,
  isDealer,
  isBuyer,
  bidderId,
  dealConfirmed,
  collectionConfirmed,
  onSuccess
}: BidConfirmationProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  // Accept bid mutation (seller only)
  const acceptBidMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/auctions/${auctionId}/accept-bid`, {
        bidId: bid.id,
        bidderId: bidderId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Bid accepted',
        description: 'The buyer has been notified.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  });

  // Confirm deal mutation (buyer only)
  const confirmDealMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/auctions/${auctionId}/confirm-deal`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Deal confirmed',
        description: 'The seller has been notified.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  });

  // Schedule collection mutation (seller only)
  const scheduleCollectionMutation = useMutation({
    mutationFn: async () => {
      if (!date) return;
      const response = await apiRequest('POST', `/api/auctions/${auctionId}/schedule-collection`, {
        collectionDate: date.toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Collection scheduled',
        description: 'The buyer has been notified of the collection date.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  });

  // Confirm collection mutation (trader only)
  const confirmCollectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/auctions/${auctionId}/confirm-collection`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Collection confirmed',
        description: 'The dealer has been notified.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  });

  // Show different UI based on user role and auction status
  if (isDealer) {
    if (!isAccepted) {
      return (
        <div className="mt-4 bg-yellow-50 text-yellow-800 p-4 rounded-md">
          <h4 className="font-medium">Winning Bid</h4>
          <p className="text-sm mt-1">
            This auction has ended. The winning bid is £{bid.amount.toLocaleString()} from Trader ID: {bid.traderId}.
          </p>
          <Button 
            className="mt-2" 
            onClick={() => acceptBidMutation.mutate()}
            disabled={acceptBidMutation.isPending}
          >
            {acceptBidMutation.isPending ? 'Processing...' : 'Accept Bid'}
          </Button>
        </div>
      );
    } 
    else if (isAccepted && dealConfirmed && !collectionConfirmed) {
      return (
        <div className="mt-4 bg-blue-50 text-blue-800 p-4 rounded-md">
          <h4 className="font-medium">Deal Confirmed</h4>
          <p className="text-sm mt-1">
            The trader has confirmed the deal. Please schedule a collection date.
          </p>
          <div className="flex mt-2 items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a collection date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            <Button 
              onClick={() => scheduleCollectionMutation.mutate()}
              disabled={scheduleCollectionMutation.isPending || !date}
            >
              {scheduleCollectionMutation.isPending ? 'Scheduling...' : 'Schedule Collection'}
            </Button>
          </div>
        </div>
      );
    }
    else if (collectionConfirmed) {
      return (
        <div className="mt-4 bg-green-50 text-green-800 p-4 rounded-md">
          <h4 className="font-medium">Transaction Complete</h4>
          <p className="text-sm mt-1">
            The trader has confirmed collection of the motorcycle. The transaction is now complete.
          </p>
        </div>
      );
    }
    return (
      <div className="mt-4 bg-green-50 text-green-800 p-4 rounded-md">
        <h4 className="font-medium">Bid Accepted</h4>
        <p className="text-sm mt-1">
          You have accepted the bid. Waiting for the trader to confirm the deal.
        </p>
      </div>
    );
  }

  // UI for traders
  if (isTrader) {
    if (isAccepted && !dealConfirmed) {
      return (
        <div className="mt-4 bg-yellow-50 text-yellow-800 p-4 rounded-md">
          <h4 className="font-medium">Your Bid Was Accepted!</h4>
          <p className="text-sm mt-1">
            The dealer has accepted your bid of £{bid.amount.toLocaleString()}. Please confirm to proceed with the purchase.
          </p>
          <Button 
            className="mt-2" 
            onClick={() => confirmDealMutation.mutate()}
            disabled={confirmDealMutation.isPending}
          >
            {confirmDealMutation.isPending ? 'Processing...' : 'Confirm Deal'}
          </Button>
        </div>
      );
    } 
    else if (dealConfirmed && !collectionConfirmed) {
      return (
        <div className="mt-4 bg-blue-50 text-blue-800 p-4 rounded-md">
          <h4 className="font-medium">Deal Confirmed</h4>
          <p className="text-sm mt-1">
            You have confirmed the deal. The dealer will schedule a collection date.
          </p>
          {date && (
            <>
              <p className="text-sm mt-1 font-medium">
                Collection Date: {format(new Date(date), "PPP")}
              </p>
              <Button 
                className="mt-2" 
                onClick={() => confirmCollectionMutation.mutate()}
                disabled={confirmCollectionMutation.isPending}
              >
                {confirmCollectionMutation.isPending ? 'Processing...' : 'Confirm Collection'}
              </Button>
            </>
          )}
        </div>
      );
    }
    else if (collectionConfirmed) {
      return (
        <div className="mt-4 bg-green-50 text-green-800 p-4 rounded-md">
          <h4 className="font-medium">Collection Confirmed</h4>
          <p className="text-sm mt-1">
            You have confirmed collection of the motorcycle. The transaction is now complete.
          </p>
        </div>
      );
    }
  }

  return null;
}