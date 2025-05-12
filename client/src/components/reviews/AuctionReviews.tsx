import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DealerReviewForm from "./DealerReviewForm";
import TraderReviewForm from "./TraderReviewForm";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

interface AuctionReviewsProps {
  auctionId: number;
  motorcycleId: number;
  dealerId: number;
  dealerName: string;
  bidderId: number;
  bidderName: string;
  isCompleted: boolean;
  reviewStatus?: {
    sellerReviewed: boolean;
    buyerReviewed: boolean;
  };
}

export default function AuctionReviews({
  auctionId,
  motorcycleId,
  dealerId,
  dealerName,
  bidderId,
  bidderName,
  isCompleted,
  reviewStatus = { sellerReviewed: false, buyerReviewed: false }
}: AuctionReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localReviewStatus, setLocalReviewStatus] = useState(reviewStatus);
  
  // Determine if the current user is the seller or buyer in this auction
  const isSeller = user?.id === dealerId;
  const isBuyer = user?.id === bidderId;
  
  // Determine if the user has already submitted a review
  const hasReviewed = isSeller 
    ? localReviewStatus.sellerReviewed 
    : isBuyer 
      ? localReviewStatus.buyerReviewed 
      : false;
  
  // If the auction is not completed or the user is neither the seller nor buyer, hide reviews section
  if (!isCompleted || (!isSeller && !isBuyer)) {
    return null;
  }
  
  const handleReviewSuccess = () => {
    setDialogOpen(false);
    
    // Update local review status
    if (isSeller) {
      setLocalReviewStatus(prev => ({ ...prev, sellerReviewed: true }));
    } else if (isBuyer) {
      setLocalReviewStatus(prev => ({ ...prev, buyerReviewed: true }));
    }
    
    toast({
      title: "Review Submitted",
      description: "Thank you for sharing your experience!",
      variant: "default",
    });
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Trade Feedback</h3>
      
      {hasReviewed ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center py-6">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Review Submitted</h4>
              <p className="text-muted-foreground">
                Thank you for providing feedback on this transaction.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Share Your Experience</CardTitle>
            <CardDescription>
              {isSeller 
                ? `Rate your experience with buyer ${bidderName}`
                : `Rate your experience with seller ${dealerName}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Your feedback helps build trust in our marketplace and assists other users in making informed decisions.
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Leave Feedback</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Trade Feedback</DialogTitle>
                  <DialogDescription>
                    Your honest feedback helps improve our marketplace
                  </DialogDescription>
                </DialogHeader>
                
                {isSeller ? (
                  <TraderReviewForm 
                    traderId={bidderId}
                    auctionId={auctionId}
                    motorcycleId={motorcycleId}
                    traderName={bidderName}
                    onSuccess={handleReviewSuccess}
                    onCancel={() => setDialogOpen(false)}
                  />
                ) : (
                  <DealerReviewForm 
                    dealerId={dealerId}
                    auctionId={auctionId}
                    motorcycleId={motorcycleId}
                    dealerName={dealerName}
                    onSuccess={handleReviewSuccess}
                    onCancel={() => setDialogOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}