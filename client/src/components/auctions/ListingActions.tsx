import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash, Archive, AlertCircle } from 'lucide-react';

interface ListingActionsProps {
  auctionId: number;
  hasBids: boolean;
  status: string;
}

export default function ListingActions({ auctionId, hasBids, status }: ListingActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/auctions/${auctionId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete listing');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Listing deleted',
        description: 'Your listing has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Archive as "no sale" mutation
  const archiveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/auctions/${auctionId}/archive-no-sale`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to archive listing');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Listing archived',
        description: 'Your listing has been archived as "no sale".',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Can only delete if there are no bids
  const canDelete = !hasBids && (status === 'active' || status === 'pending');
  
  // Can only archive active or pending listings
  const canArchive = status === 'active' || status === 'pending';
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open listing menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Listing Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canDelete && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Listing
            </DropdownMenuItem>
          )}
          {!canDelete && hasBids && (
            <DropdownMenuItem
              className="text-gray-400 cursor-not-allowed"
              disabled
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete (Has Bids)
            </DropdownMenuItem>
          )}
          {canArchive && (
            <DropdownMenuItem
              className="text-amber-600"
              onClick={() => setShowArchiveDialog(true)}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive as "No Sale"
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Archive confirmation dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Listing</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex items-start mb-2">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-600 mt-0.5" />
                <span>
                  This will mark your listing as "No Sale" and make it inactive.
                  <br />
                  You'll still be able to see it in your history, but it won't be visible to other dealers.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => archiveMutation.mutate()}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}