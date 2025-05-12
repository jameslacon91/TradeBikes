import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Tag 
} from 'lucide-react';

export default function NotificationTest() {
  const { addNotification } = useNotifications();

  // Helper function to create test notifications
  const createTestNotification = (type: 'info' | 'success' | 'warning' | 'error') => {
    const notifications = {
      info: {
        title: 'New Bid Received',
        message: 'Someone placed a bid of £8,750 on your Honda CBR1000RR',
        icon: <Tag className="h-5 w-5" />,
        link: '/auctions/1'
      },
      success: {
        title: 'Auction Won',
        message: 'Congratulations! You won the auction for Yamaha MT-09',
        icon: <CheckCircle className="h-5 w-5" />,
        link: '/auctions/2'
      },
      warning: {
        title: 'Auction Ending Soon',
        message: 'Your auction for Ducati Panigale ends in 15 minutes',
        icon: <Clock className="h-5 w-5" />,
        link: '/auctions/3'
      },
      error: {
        title: 'Payment Failed',
        message: 'Your payment for Kawasaki Ninja ZX-6R could not be processed',
        icon: <AlertTriangle className="h-5 w-5" />,
        link: '/payment/failure'
      }
    };

    addNotification({
      ...notifications[type],
      type
    });
  };

  // Test for browser notification permission
  const requestNotificationPermission = async () => {
    // Check if we're in a browser environment and if Notification API is supported
    const isBrowser = typeof window !== 'undefined';
    const hasNotificationSupport = isBrowser && 'Notification' in window;
    
    if (!hasNotificationSupport) {
      addNotification({
        title: 'Notifications Not Supported',
        message: 'This browser or environment does not support desktop notifications',
        type: 'warning',
        icon: <Bell className="h-5 w-5" />
      });
      return;
    }
    
    try {
      if (Notification.permission === "granted") {
        addNotification({
          title: 'Notifications Enabled',
          message: 'You will now receive push notifications',
          type: 'success',
          icon: <Bell className="h-5 w-5" />
        });
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
          addNotification({
            title: 'Notifications Enabled',
            message: 'You will now receive push notifications',
            type: 'success',
            icon: <Bell className="h-5 w-5" />
          });
        }
      }
    } catch (error) {
      console.error('Error with notification permission:', error);
      addNotification({
        title: 'Notification Error',
        message: 'Could not request notification permissions',
        type: 'error',
        icon: <Bell className="h-5 w-5" />
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Testing Panel</CardTitle>
        <CardDescription>Use these controls to test different types of notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="border-blue-200 hover:bg-blue-50"
            onClick={() => createTestNotification('info')}
          >
            <Bell className="mr-2 h-4 w-4 text-blue-500" />
            Test Info Notification
          </Button>
          
          <Button 
            variant="outline" 
            className="border-green-200 hover:bg-green-50"
            onClick={() => createTestNotification('success')}
          >
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Test Success Notification
          </Button>
          
          <Button 
            variant="outline" 
            className="border-amber-200 hover:bg-amber-50"
            onClick={() => createTestNotification('warning')}
          >
            <Clock className="mr-2 h-4 w-4 text-amber-500" />
            Test Warning Notification
          </Button>
          
          <Button 
            variant="outline" 
            className="border-red-200 hover:bg-red-50"
            onClick={() => createTestNotification('error')}
          >
            <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
            Test Error Notification
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="default" 
          className="w-full"
          onClick={requestNotificationPermission}
        >
          <Bell className="mr-2 h-4 w-4" />
          {Notification.permission === "granted" 
            ? "Notifications Enabled" 
            : "Enable Browser Notifications"}
        </Button>
      </CardFooter>
    </Card>
  );
}