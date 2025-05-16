import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Star, Plus, MessageCircle, Phone, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';

// Define dealer interface specifically for this component
interface DealerInfo {
  id: number;
  username: string;
  companyName: string;
  rating: number;
  totalRatings: number;
}

const FavoriteDealers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAllDealers, setShowAllDealers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get all dealers that can be favorites
  const { data: allDealers = [], isLoading: dealersLoading } = useQuery<DealerInfo[]>({
    queryKey: ['/api/dealers'],
    enabled: !!user
  });

  // Get user's favorite dealers
  const { data: favoriteDealers = [], isLoading: favoritesLoading } = useQuery<DealerInfo[]>({
    queryKey: ['/api/user/favorites'],
    enabled: !!user
  });

  const isLoading = dealersLoading || favoritesLoading;

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (dealerId: number) => {
      await apiRequest('POST', '/api/user/favorites/add', { dealerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
      toast({
        title: 'Added to favorites',
        description: 'Dealer has been added to your favorites',
      });
    },
    onError: () => {
      toast({
        title: 'Action failed',
        description: 'Could not add dealer to favorites.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (dealerId: number) => {
      await apiRequest('POST', '/api/user/favorites/remove', { dealerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
      toast({
        title: 'Removed from favorites',
        description: 'Dealer has been removed from your favorites',
      });
    },
    onError: () => {
      toast({
        title: 'Action failed',
        description: 'Could not remove dealer from favorites.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const toggleFavorite = (dealerId: number) => {
    if (!user) return;
    
    setIsUpdating(true);
    const isFavorite = favoriteDealers.some((d: DealerInfo) => d.id === dealerId);
    
    if (isFavorite) {
      removeFavoriteMutation.mutate(dealerId);
    } else {
      addFavoriteMutation.mutate(dealerId);
    }
  };
  
  // Get filtered dealers that can be added as favorites
  const getFilteredDealers = () => {
    if (!Array.isArray(allDealers) || !Array.isArray(favoriteDealers) || !user) {
      return [];
    }
    
    // Filter out current user and dealers already in favorites
    const availableDealers = allDealers.filter(dealer => 
      dealer.id !== user.id && 
      !favoriteDealers.some(fav => fav.id === dealer.id)
    );
    
    // Apply search filter if there's a search term
    if (searchTerm) {
      return availableDealers.filter(dealer => 
        (dealer.companyName && dealer.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        dealer.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return availableDealers;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Star className="mr-2 h-5 w-5 text-yellow-500" />
          Favorite Dealers
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-2 lg:flex gap-1"
          disabled={isUpdating || isLoading}
          onClick={() => setShowAllDealers(prev => !prev)}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Add Dealer</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : favoriteDealers.length === 0 || showAllDealers ? (
          <div className="py-4">
            {favoriteDealers.length === 0 ? (
              <p className="text-muted-foreground mb-4 text-center">
                You don't have any favorite dealers yet.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm">Add More Dealers</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowAllDealers(false);
                      setSearchTerm('');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Close
                  </Button>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search dealers by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-4 mt-4">
              {showAllDealers && (
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm">Available Dealers:</h3>
                  <span className="text-xs text-muted-foreground">{getFilteredDealers().length} found</span>
                </div>
              )}
              
              {getFilteredDealers().length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-2">
                  {searchTerm ? "No dealers match your search" : "No more dealers available"}
                </p>
              ) : (
                <>
                  {getFilteredDealers().map((dealer: DealerInfo) => (
                    <div key={dealer.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{dealer.companyName?.[0] || dealer.username[0]}</AvatarFallback>
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${dealer.companyName || dealer.username}`} />
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{dealer.companyName || dealer.username}</h4>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <div className="flex items-center mr-3">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${i < (dealer.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <span>{dealer.totalRatings} ratings</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleFavorite(dealer.id)}
                        disabled={isUpdating}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {favoriteDealers.map((dealer: DealerInfo) => (
              <div key={dealer.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{dealer.companyName?.[0] || dealer.username[0]}</AvatarFallback>
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${dealer.companyName || dealer.username}`} />
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{dealer.companyName || dealer.username}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <div className="flex items-center mr-3">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < (dealer.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span>{dealer.totalRatings} ratings</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Remove from favorites"
                    onClick={() => toggleFavorite(dealer.id)}
                    disabled={isUpdating}
                  >
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Message">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Call">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FavoriteDealers;