import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AuctionWithDetails } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, Calendar as CalendarIcon, Clock, MessageSquare } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

interface PendingActionsProps {
  auction: AuctionWithDetails;
  isSeller: boolean;
}

export default function PendingActions({ auction, isSeller }: PendingActionsProps) {
  const { toast } = useToast();
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isExtendDateDialogOpen, setIsExtendDateDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [newDate, setNewDate] = useState<Date | null>(null);
  
  const completeDealMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/auctions/${auction.id}/complete-deal`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Transaction completed',
        description: 'The motorcycle transaction has been marked as completed',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to complete transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const extendDateMutation = useMutation({
    mutationFn: async (newDateValue: Date | null) => {
      if (!newDateValue) throw new Error('Please select a valid date');
      
      const res = await apiRequest('POST', `/api/auctions/${auction.id}/extend-date`, {
        newAvailabilityDate: newDateValue.toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Date extended',
        description: 'The availability date has been updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
      setIsExtendDateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to extend date',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      if (!messageContent.trim()) throw new Error('Please enter a message');
      
      const recipientId = isSeller 
        ? auction.winningBidderId 
        : auction.dealerId;
      
      const res = await apiRequest('POST', '/api/messages', {
        content: messageContent,
        receiverId: recipientId,
        auctionId: auction.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Message sent',
        description: 'Your message has been sent',
      });
      setMessage('');
      setIsMessageDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleCompleteAction = () => {
    completeDealMutation.mutate();
  };
  
  const handleSendMessage = () => {
    sendMessageMutation.mutate(message);
  };
  
  const handleExtendDate = () => {
    extendDateMutation.mutate(newDate);
  };
  
  const availabilityDate = auction.motorcycle?.dateAvailable 
    ? typeof auction.motorcycle.dateAvailable === 'string'
      ? auction.motorcycle.dateAvailable.includes('T')
        ? parseISO(auction.motorcycle.dateAvailable)
        : new Date()
      : new Date()
    : new Date();
  
  const partnerRole = isSeller ? 'Buyer' : 'Seller';
  const partnerName = isSeller 
    ? `Buyer #${auction.winningBidderId}`
    : `${auction.motorcycle?.make || 'Vehicle'} Seller`;
  
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="bg-muted/40 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Collection Information</h3>
        <p className="text-sm text-muted-foreground mb-1">
          <span className="font-medium">Status:</span> Pending Collection
        </p>
        <p className="text-sm text-muted-foreground mb-1">
          <span className="font-medium">Available from:</span>{' '}
          {typeof auction.motorcycle?.dateAvailable === 'string'
            ? auction.motorcycle.dateAvailable
            : 'Date not specified'}
        </p>
        {isSeller && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={handleCompleteAction}
              disabled={completeDealMutation.isPending}
            >
              {completeDealMutation.isPending ? (
                <Clock className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Mark as Completed
            </Button>
            
            <Dialog open={isExtendDateDialogOpen} onOpenChange={setIsExtendDateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Extend Date
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Extend Availability Date</DialogTitle>
                  <DialogDescription>
                    Update when the motorcycle will be available for collection.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="my-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Current availability: </Label>
                    <p className="text-sm text-muted-foreground">
                      {typeof auction.motorcycle?.dateAvailable === 'string'
                        ? auction.motorcycle.dateAvailable
                        : 'Date not specified'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="collectionDate">New availability date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newDate && isValid(newDate)
                            ? format(newDate, 'PPP')
                            : "Select a new date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newDate}
                          onSelect={setNewDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsExtendDateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleExtendDate}
                    disabled={extendDateMutation.isPending || !newDate}
                  >
                    {extendDateMutation.isPending ? 'Updating...' : 'Update Date'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message {partnerRole}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message to {partnerName}</DialogTitle>
            <DialogDescription>
              Send a message about this motorcycle transaction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your message</Label>
              <Textarea
                id="message"
                placeholder={`Type your message to the ${partnerRole.toLowerCase()}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setIsMessageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || !message.trim()}
            >
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}