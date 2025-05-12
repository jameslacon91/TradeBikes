import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useToast } from './use-toast';
import { Bell, AlertCircle, Tag, ShoppingCart, Clock } from 'lucide-react';
import { useWebSocket } from './use-websocket';
import { WSMessage } from '@shared/types';

// Types for notifications
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  isRead: boolean;
  link?: string;
  icon?: JSX.Element;
}

// Context type for notifications
interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
}

// Create the context
const NotificationsContext = createContext<NotificationsContextType | null>(null);

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Provider component
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const webSocket = useWebSocket();

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Check if browser supports notifications and request permission if needed
  useEffect(() => {
    if (isBrowser && "Notification" in window) {
      if (Notification.permission !== "denied" && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Listen for WebSocket messages that should trigger notifications
  useEffect(() => {
    if (!webSocket.connected) return;

    const handleWebSocketMessage = (message: WSMessage) => {
      switch (message.type) {
        case 'new_bid':
          addNotification({
            title: 'New Bid Placed',
            message: `A bid of £${message.data.amount} has been placed on ${message.data.motorcycleName}`,
            type: 'info',
            link: `/auctions/${message.data.auctionId}`,
            icon: <Tag className="h-5 w-5" />
          });
          break;

        case 'auction_ending':
          addNotification({
            title: 'Auction Ending Soon',
            message: `${message.data.motorcycleName} auction ends in 15 minutes`,
            type: 'warning',
            link: `/auctions/${message.data.auctionId}`,
            icon: <Clock className="h-5 w-5" />
          });
          break;

        case 'auction_completed':
          const isWinner = message.data.winnerId === message.data.currentUserId;
          
          addNotification({
            title: isWinner ? 'Auction Won!' : 'Auction Ended',
            message: isWinner 
              ? `You won the auction for ${message.data.motorcycleName}`
              : `The auction for ${message.data.motorcycleName} has ended`,
            type: isWinner ? 'success' : 'info',
            link: `/auctions/${message.data.auctionId}`,
            icon: <ShoppingCart className="h-5 w-5" />
          });
          break;

        case 'new_message':
          addNotification({
            title: 'New Message',
            message: `New message from ${message.data.senderName}`,
            type: 'info',
            link: `/messages/${message.data.conversationId}`,
            icon: <Bell className="h-5 w-5" />
          });
          break;
      }
    };

    // Define a function to handle incoming WebSocket messages for notifications
    if (webSocket.connected) {
      // Create a message handler that will process notification events
      const notificationHandler = (message: WSMessage) => {
        // Process the message for notifications
        handleWebSocketMessage(message);
      };
      
      // Set our handler
      webSocket.handleWebSocketMessage = notificationHandler;
    }

    // No cleanup needed as we're just hooking into the existing WebSocket
  }, [webSocket.connected, webSocket]);

  // Function to add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      isRead: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show in-app toast for the notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });

    // Show system notification if permission granted
    if (isBrowser && "Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/notification-icon.png', // Use app icon
      });
    }
  };

  // Function to remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Function to mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  // Function to mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Function to clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Return the provider
  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        clearNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

// Hook to use the notifications context
export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}