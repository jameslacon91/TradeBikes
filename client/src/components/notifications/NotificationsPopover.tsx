import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Bell, Check, Trash, CheckSquare } from 'lucide-react';
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

export default function NotificationsPopover() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (notification: any) => {
    if (notification.icon) {
      return notification.icon;
    }

    switch (notification.type) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'error':
        return <Bell className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <Bell className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationTypeClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-blue-50 border-blue-200';
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
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7 text-white hover:bg-primary-dark"
              onClick={clearNotifications}
              disabled={notifications.length === 0}
              title="Clear all notifications"
            >
              <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[300px] sm:h-[350px]">
          {notifications.length === 0 ? (
            <div className="py-6 sm:py-10 text-center text-muted-foreground">
              <Bell className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8 opacity-30" />
              <p className="text-sm sm:text-base">No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div key={notification.id}>
                  <div
                    className={`flex p-4 cursor-pointer ${!notification.isRead ? 'bg-gray-50' : ''} hover:bg-gray-100`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mr-3">
                      <div className={`p-2 rounded-full ${getNotificationTypeClass(notification.type)}`}>
                        {getNotificationIcon(notification)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm sm:text-base font-medium ${!notification.isRead ? 'text-black' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {format(notification.timestamp, 'HH:mm')}
                        </span>
                      </div>
                      <p className={`text-xs sm:text-sm line-clamp-2 ${!notification.isRead ? 'text-gray-800' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(notification.timestamp, 'MMM d, yyyy')}
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