import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Clock, MapPin, Calendar, Truck } from "lucide-react";
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Auction, Bid } from '@shared/schema';

interface BidCollectionConfirmationProps {
  auctionId: number;
  bid: Bid;
  dealConfirmed: boolean;
  collectionConfirmed: boolean;
  collectionDate: Date | null;
  onSuccess?: () => void;
}

export default function BidCollectionConfirmation({
  auctionId,
  bid,
  dealConfirmed, 
  collectionConfirmed,
  collectionDate,
  onSuccess
}: BidCollectionConfirmationProps) {
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);

  // Mutation to confirm collection has happened
  const confirmCollectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/auctions/${auctionId}/confirm-collection`);
      return response.json();
    },
    onSuccess: (data: Auction) => {
      toast({
        title: 'Collection confirmed',
        description: 'You have confirmed collection of the motorcycle',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to confirm collection',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleConfirmCollection = () => {
    setIsConfirming(true);
    confirmCollectionMutation.mutate();
    
    // Add a slight delay before redirecting to ensure the mutation completes
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    }, 1000);
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50">
        <CardTitle className="text-lg flex items-center">
          <Truck className="mr-2 h-5 w-5 text-primary" />
          Collection Details
        </CardTitle>
        <CardDescription>
          Motorcycle collection status
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center">
            <div className={`p-1.5 rounded-full ${dealConfirmed ? 'bg-green-100' : 'bg-gray-100'} mr-3`}>
              <Check className={`h-4 w-4 ${dealConfirmed ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-medium">Deal Confirmed</p>
              <p className="text-sm text-gray-500">Both parties have agreed to the transaction</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center">
            <div className={`p-1.5 rounded-full ${collectionDate ? 'bg-blue-100' : 'bg-gray-100'} mr-3`}>
              <Calendar className={`h-4 w-4 ${collectionDate ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-medium">Collection Scheduled</p>
              {collectionDate ? (
                <p className="text-sm text-gray-500">
                  Scheduled for {format(new Date(collectionDate), 'PPPP')}
                </p>
              ) : (
                <p className="text-sm text-gray-500">No collection date scheduled yet</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-center">
            <div className={`p-1.5 rounded-full ${collectionConfirmed ? 'bg-green-100' : 'bg-gray-100'} mr-3`}>
              <MapPin className={`h-4 w-4 ${collectionConfirmed ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-medium">Collection Confirmed</p>
              <p className="text-sm text-gray-500">
                {collectionConfirmed 
                  ? 'Collection has been completed' 
                  : collectionDate && new Date(collectionDate) < new Date() 
                    ? 'Collection date has passed, please confirm when collected' 
                    : 'Waiting for collection to be completed'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end bg-gray-50 pt-4">
        {dealConfirmed && collectionDate && !collectionConfirmed && (
          <Button 
            onClick={handleConfirmCollection}
            disabled={isConfirming || confirmCollectionMutation.isPending}
            className="bg-primary"
          >
            {confirmCollectionMutation.isPending ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm Collection'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}