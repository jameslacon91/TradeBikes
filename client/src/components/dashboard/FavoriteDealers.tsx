import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Star, Plus, MessageCircle, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const FavoriteDealers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Get all dealers that can be favorites
  const { data: allDealers, isLoading: dealersLoading } = useQuery<User[]>({
    queryKey: ['/api/dealers'],
    enabled: !!user
  });

  // Get user's favorite dealers
  const { data: favoriteDealers, isLoading: favoritesLoading } = useQuery<User[]>({
    queryKey: ['/api/user/favorites'],
    enabled: !!user
  });

  const isLoading = dealersLoading || favoritesLoading;

  const toggleFavorite = async (dealerId: number) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const isFavorite = favoriteDealers?.find(d => d.id === dealerId);
      const endpoint = isFavorite ? '/api/user/favorites/remove' : '/api/user/favorites/add';
      
      await apiRequest('POST', endpoint, { dealerId });
      
      toast({
        title: isFavorite ? 'Removed from favorites' : 'Added to favorites',
        description: isFavorite 
          ? 'Dealer has been removed from your favorites' 
          : 'Dealer has been added to your favorites',
      });
    } catch (error) {
      toast({
        title: 'Action failed',
        description: 'Could not update favorites.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getFavoriteStatus = (dealerId: number) => {
    return favoriteDealers?.some(dealer => dealer.id === dealerId) ?? false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <Star className="mr-2 h-5 w-5 text-yellow-500" />
          Favorite Dealers
        </CardTitle>
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
        ) : favoriteDealers?.length === 0 ? (
          <div className="py-4">
            <p className="text-muted-foreground mb-4 text-center">
              You don't have any favorite dealers yet.
            </p>
            <div className="space-y-4 mt-4">
              <h3 className="font-medium text-sm">Available Dealers:</h3>
              {allDealers?.filter(dealer => dealer.id !== user?.id && dealer.role === 'dealer').map(dealer => (
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
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {favoriteDealers?.map(dealer => (
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