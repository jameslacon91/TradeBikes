import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, Check, Clock, MessageSquare, CheckSquare, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Notification } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsPopover() {
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Calculate unread count
  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest('POST', `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  });
  
  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications?.filter(n => !n.read).map(n => n.id) || [];
      await Promise.all(unreadIds.map(id => markAsReadMutation.mutate(id)));
      toast({
        title: 'Notifications',
        description: 'All notifications marked as read.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark notifications as read.',
      });
    }
  };
  
  const handleNotificationClick = (notification: Notification) => {
    markAsReadMutation.mutate(notification.id);
    // Handle navigation based on notification type if needed
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bid':
      case 'bid_accepted':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'auction_ending':
      case 'auction_completed':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'message':
      case 'deal_confirmed':
      case 'collection_scheduled':
      case 'collection_confirmed':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationTypeClass = (type: string) => {
    switch (type) {
      case 'bid':
      case 'bid_accepted':
        return 'bg-green-50 border-green-200';
      case 'auction_ending':
      case 'auction_completed':
        return 'bg-amber-50 border-amber-200';
      case 'message':
      case 'deal_confirmed':
      case 'collection_scheduled':
      case 'collection_confirmed':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-primary text-white">
          <h3 className="text-sm sm:text-base font-semibold">Notifications</h3>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7 text-white hover:bg-primary-dark"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              title="Mark all as read"
            >
              <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            {/* We don't have a clear notifications endpoint yet */}
          </div>
        </div>
        <ScrollArea className="h-[300px] sm:h-[350px]">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="py-6 sm:py-10 text-center text-muted-foreground">
              <Bell className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8 opacity-30" />
              <p className="text-sm sm:text-base">No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div key={notification.id}>
                  <div
                    className={`flex p-4 cursor-pointer ${!notification.read ? 'bg-gray-50' : ''} hover:bg-gray-100`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mr-3">
                      <div className={`p-2 rounded-full ${getNotificationTypeClass(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm sm:text-base font-medium ${!notification.read ? 'text-black' : 'text-gray-700'}`}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1).replace('_', ' ')}
                        </p>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {notification.createdAt ? format(new Date(notification.createdAt), 'HH:mm') : ''}
                        </span>
                      </div>
                      <p className={`text-xs sm:text-sm line-clamp-2 ${!notification.read ? 'text-gray-800' : 'text-gray-500'}`}>
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.createdAt ? format(new Date(notification.createdAt), 'MMM d, yyyy') : ''}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}