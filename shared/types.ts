// Extend types for frontend use
import { User, Motorcycle, Auction, Bid, Message, Notification } from './schema';

// Extended Auction with related Motorcycle data
export interface AuctionWithDetails extends Auction {
  motorcycle: Motorcycle;
  bids: Bid[];
  currentBid?: number;
  totalBids: number;
}

// Activity item for dashboard
export interface ActivityItem {
  id: number;
  type: 'bid' | 'auction_ending' | 'auction_completed' | 'message';
  title: string;
  description: string;
  timestamp: Date;
  icon: string; // icon identifier
  color: string; // color class for the icon background
}

// Stats for dashboard
export interface DashboardStats {
  activeListings: number;
  totalBids: number;
  pendingCompletion: number;
  revenue: number;
  trendUp?: boolean;
  trendValue?: number;
}

// WebSocket message types
export type WSMessageType = 
  'register' |
  'new_bid' | 
  'auction_ending' | 
  'auction_completed' | 
  'new_message' | 
  'auction_created' |
  'bid_accepted' | 
  'deal_confirmed' | 
  'collection_scheduled' |
  'collection_confirmed';

export interface WSMessage {
  type: WSMessageType;
  data: any;
  timestamp: number;
}
