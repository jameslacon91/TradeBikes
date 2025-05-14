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
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
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
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const extendDateMutation = useMutation({
    mutationFn: async () => {
      if (!newDate) return;
      const res = await apiRequest('POST', `/api/auctions/${auction.id}/extend-date`, {
        newAvailabilityDate: newDate.toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Date extended',
        description: 'The availability date has been updated',
      });
      setIsExtendDateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const recipientId = isSeller ? auction.winningBidderId : auction.dealerId;
      if (!recipientId) return;
      
      const res = await apiRequest('POST', '/api/messages', {
        recipientId: recipientId,
        content: message,
        relatedAuctionId: auction.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully',
      });
      setIsMessageDialogOpen(false);
      setMessage('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleCompleteDeal = () => {
    if (window.confirm('Are you sure you want to mark this transaction as complete?')) {
      completeDealMutation.mutate();
    }
  };
  
  const handleExtendDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      toast({
        title: 'Error',
        description: 'Please select a new availability date',
        variant: 'destructive',
      });
      return;
    }
    extendDateMutation.mutate();
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    sendMessageMutation.mutate();
  };
  
  // Determine available actions based on role and auction state
  const canMarkComplete = isSeller && auction.status === 'pending_collection';
  const canExtendDate = isSeller && auction.status === 'pending_collection';
  const canMessage = true; // Both buyer and seller can message
  
  const motorcycle = auction.motorcycle;
  const availabilityDate = motorcycle?.dateAvailable 
    ? new Date(motorcycle.dateAvailable)
    : null;
    
  return (
    <div className="flex flex-col gap-2">
      {/* Only show complete button to seller */}
      {canMarkComplete && (
        <Button 
          onClick={handleCompleteDeal}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          variant="default"
          disabled={completeDealMutation.isPending}
        >
          {completeDealMutation.isPending ? 'Processing...' : 'Mark as Complete'}
        </Button>
      )}
      
      {/* Only show extend date to seller */}
      {canExtendDate && (
        <Dialog open={isExtendDateDialogOpen} onOpenChange={setIsExtendDateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              variant="outline"
              disabled={extendDateMutation.isPending}
            >
              Extend Availability Date
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Availability Date</DialogTitle>
              <DialogDescription>
                Current availability date: {availabilityDate 
                  ? format(availabilityDate, 'PPP') 
                  : 'Not set'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleExtendDate} className="space-y-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="newDate">New Availability Date</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDate ? format(newDate, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newDate || undefined}
                      onSelect={(date) => {
                        setNewDate(date || null);
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={!newDate || extendDateMutation.isPending}>
                  {extendDateMutation.isPending ? 'Saving...' : 'Save Date'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Both buyer and seller can send messages */}
      {canMessage && (
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              variant="secondary"
              disabled={sendMessageMutation.isPending}
            >
              Send Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to the {isSeller ? 'buyer' : 'seller'} about this motorcycle.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSendMessage} className="space-y-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="resize-none"
                  required
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={!message.trim() || sendMessageMutation.isPending}>
                  {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}