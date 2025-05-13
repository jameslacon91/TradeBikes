import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Star, StarOff } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@shared/schema';

export default function FavoriteDealers() {
  // Fetch favorite dealers
  const { data: dealers, isLoading } = useQuery<User[]>({
    queryKey: ['/api/dealers/favorites']
  });
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-[120px] mb-2" />
              <Skeleton className="h-3 w-[80px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!dealers || dealers.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
        <h3 className="text-muted-foreground">No favorite dealers yet</h3>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {dealers.map(dealer => (
        <div key={dealer.id} className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{getInitials(dealer.companyName || dealer.username)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center">
              <p className="font-medium text-sm">{dealer.companyName || dealer.username}</p>
              <Star className="h-4 w-4 text-yellow-400 ml-1" />
            </div>
            <p className="text-xs text-muted-foreground">{dealer.location || 'London, UK'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}