import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, X, Search } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

// Simplified dealer interface for favorites
interface FavoriteDealer {
  id: number;
  username: string;
  companyName: string;
  rating: number;
  totalRatings: number;
}

export default function FavoriteDealers() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch favorite dealers
  const { data: favoriteDealers = [], isLoading } = useQuery<FavoriteDealer[]>({
    queryKey: ['/api/favorite-dealers'],
    onError: (error: Error) => {
      toast({
        title: "Failed to load favorite dealers",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Remove dealer from favorites
  const removeMutation = useMutation({
    mutationFn: async (dealerId: number) => {
      await apiRequest('DELETE', `/api/favorite-dealers/${dealerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-dealers'] });
      toast({
        title: "Success",
        description: "Dealer removed from favorites",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove dealer",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get all dealers (for adding to favorites)
  const { data: allDealers = [], isLoading: isLoadingAllDealers } = useQuery<FavoriteDealer[]>({
    queryKey: ['/api/dealers'],
    onError: (error: Error) => {
      toast({
        title: "Failed to load dealers",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add dealer to favorites
  const addMutation = useMutation({
    mutationFn: async (dealerId: number) => {
      await apiRequest('POST', '/api/favorite-dealers', { dealerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-dealers'] });
      toast({
        title: "Success",
        description: "Dealer added to favorites",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add dealer",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter dealers based on search
  const filteredDealers = allDealers.filter(dealer => 
    dealer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter out dealers already in favorites
  const dealersToAdd = filteredDealers.filter(
    dealer => !favoriteDealers.some(fav => fav.id === dealer.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Favorite Dealers</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Add Favorite Dealer</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Add Favorite Dealer</AlertDialogTitle>
              <AlertDialogDescription>
                Adding dealers to your favorites list helps you quickly find and track your preferred partners.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search dealers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {isLoadingAllDealers ? (
                <p className="text-center py-4 text-muted-foreground">Loading dealers...</p>
              ) : dealersToAdd.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  {searchTerm ? "No dealers match your search" : "No more dealers to add"}
                </p>
              ) : (
                dealersToAdd.map(dealer => (
                  <div 
                    key={dealer.id} 
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/20"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{dealer.companyName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{dealer.companyName}</p>
                        <p className="text-sm text-muted-foreground">@{dealer.username}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => addMutation.mutate(dealer.id)}
                      disabled={addMutation.isPending}
                    >
                      <Star className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                ))
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Loading favorite dealers...</p>
        </div>
      ) : favoriteDealers.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">You haven't added any favorite dealers yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add dealers to your favorites for quick access to their listings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {favoriteDealers.map(dealer => (
            <Card key={dealer.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{dealer.companyName}</CardTitle>
                    <CardDescription>@{dealer.username}</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    onClick={() => removeMutation.mutate(dealer.id)}
                    disabled={removeMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">
                    {dealer.rating} ★ ({dealer.totalRatings})
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/dealer/${dealer.id}`}>View Listings</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}