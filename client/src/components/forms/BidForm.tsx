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
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface BidFormProps {
  auctionId: number;
  isStock?: boolean; // Flag to determine if this is a stock listing
}

export default function BidForm({ auctionId, isStock = false }: BidFormProps) {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const { toast } = useToast();

  // Create zod schema for bid validation
  const bidSchema = z.object({
    amount: z.string().min(1, "Bid amount is required"),
    comments: z.string().optional(),
  });

  type BidFormValues = z.infer<typeof bidSchema>;

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: '',
      comments: '',
    },
  });

  // Mutation for submitting a bid
  const bidMutation = useMutation({
    mutationFn: async (data: BidFormValues) => {
      try {
        const res = await apiRequest("POST", "/api/bids", {
          auctionId,
          amount: parseInt(data.amount, 10),
          comments: data.comments,
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to place bid");
        }
        
        return await res.json();
      } catch (error: any) {
        console.error("Bid submission error:", error);
        throw new Error(error.message || "Failed to place bid");
      }
    },
    onSuccess: (data) => {
      toast({
        title: isStock ? "Offer submitted successfully" : "Bid placed successfully",
        description: `Your ${isStock ? 'offer' : 'bid'} of £${data.amount.toLocaleString()} has been placed.`,
      });
      // Invalidate queries to refresh the auction data
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bids/auction/${auctionId}`] });
      
      // Reset form
      form.reset({ amount: '', comments: '' });
    },
    onError: (error: any) => {
      console.error("Bid mutation error:", error);
      toast({
        title: isStock ? "Failed to submit offer" : "Failed to place bid",
        description: error.message || `An error occurred while ${isStock ? 'submitting your offer' : 'placing your bid'}.`,
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
    
    // Validate amount is a number before submitting
    const amount = parseInt(data.amount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number for your bid.",
        variant: "destructive",
      });
      return;
    }
    
    bidMutation.mutate(data);
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">
        {isStock ? 'Make Offer on Stock' : 'Place Your Bid'}
      </h4>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your {isStock ? 'Offer' : 'Bid'} Amount</FormLabel>
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    £
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter amount"
                      className="pl-7"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comments (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Add any comments or questions about this bike"
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent-dark"
            disabled={bidMutation.isPending}
          >
            {bidMutation.isPending 
              ? (isStock ? "Submitting Offer..." : "Placing Bid...") 
              : (isStock ? "Submit Offer" : "Place Bid")}
          </Button>
        </form>
      </Form>
    </div>
  );
}