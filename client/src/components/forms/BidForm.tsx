import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BidFormProps {
  auctionId: number;
  currentBid?: number;
  startingPrice: number;
}

export default function BidForm({ auctionId, currentBid, startingPrice }: BidFormProps) {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const { toast } = useToast();
  const [bidAmount, setBidAmount] = useState<number | string>(currentBid ? (currentBid + 50) : startingPrice);

  // Minimum bid is current bid + 50 or starting price if no bids
  const minBid = currentBid ? currentBid + 50 : startingPrice;

  // Create zod schema for bid validation
  const bidSchema = z.object({
    amount: z.preprocess(
      (a) => parseInt(z.string().parse(a), 10),
      z.number()
        .int("Bid must be a whole number")
        .min(minBid, `Bid must be at least £${minBid.toLocaleString()}`)
    ),
  });

  type BidFormValues = z.infer<typeof bidSchema>;

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: currentBid ? (currentBid + 50).toString() : startingPrice.toString(),
    },
  });

  // Mutation for submitting a bid
  const bidMutation = useMutation({
    mutationFn: async (data: BidFormValues) => {
      const res = await apiRequest("POST", "/api/bids", {
        auctionId,
        amount: data.amount,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bid placed successfully",
        description: `Your bid of £${data.amount.toLocaleString()} has been placed.`,
      });
      // Invalidate queries to refresh the auction data
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bids/auction/${auctionId}`] });
      
      // Reset form with new minimum bid
      const newMinBid = data.amount + 50;
      setBidAmount(newMinBid);
      form.reset({ amount: newMinBid.toString() });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to place bid",
        description: error.message || "An error occurred while placing your bid.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: BidFormValues) {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to place a bid.",
        variant: "destructive",
      });
      return;
    }
    
    bidMutation.mutate(data);
  }

  function handleBidIncrement(amount: number) {
    const current = typeof bidAmount === 'string' ? parseInt(bidAmount, 10) : bidAmount;
    if (isNaN(current)) return;
    
    const newAmount = current + amount;
    setBidAmount(newAmount);
    form.setValue('amount', newAmount.toString());
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-2">Place Your Bid</h4>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      £
                    </span>
                    <FormControl>
                      <Input
                        {...field}
                        value={bidAmount}
                        onChange={(e) => {
                          setBidAmount(e.target.value);
                          field.onChange(e);
                        }}
                        className="pl-7"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleBidIncrement(50)}
              >
                +50
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleBidIncrement(100)}
              >
                +100
              </Button>
            </div>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent-dark"
              disabled={bidMutation.isPending}
            >
              {bidMutation.isPending ? "Placing Bid..." : "Place Bid"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}