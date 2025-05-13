import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Notification } from '@shared/types';

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    // Refresh every minute
    refetchInterval: 60000,
  });
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('POST', `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
  
  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/read-all');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
  
  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter(notif => !notif.read).length;
    setUnreadCount(count);
  }, [notifications]);
  
  // Filter notifications based on selected tab
  const filteredNotifications = notifications.filter(notification => {
    if (tabValue === 'all') return true;
    if (tabValue === 'unread') return !notification.read;
    return false;
  });
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Close the popover
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-4 text-[10px] flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex justify-between items-center">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="h-3 w-3 mr-1" /> 
              Mark all as read
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="all" value={tabValue} onValueChange={setTabValue}>
          <TabsList className="w-full grid grid-cols-2 p-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={tabValue} className="p-0">
            <ScrollArea className="max-h-[300px]">
              {isLoading ? (
                <div className="text-center p-6 text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center p-6 text-sm text-muted-foreground">
                  {tabValue === 'unread' 
                    ? 'No unread notifications' 
                    : 'No notifications'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map(notification => (
                    <Link 
                      key={notification.id} 
                      href={notification.link || '#'}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div 
                        className={`p-3 hover:bg-accent/50 cursor-pointer ${
                          !notification.read ? 'bg-accent/20' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium text-sm">
                            {notification.title}
                          </h5>
                          {notification.link && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true 
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}