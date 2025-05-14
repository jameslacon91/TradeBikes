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
  type: 'bid' | 'auction_ending' | 'auction_completed' | 'underwrite_completed' | 'message';
  title: string;
  description: string;
  timestamp: Date;
  icon: string; // icon identifier
  color: string; // color class for the icon background
}

// Stats for dashboard
export interface DashboardStats {
  // Selling stats
  activeListings: number;
  totalBids: number;
  pendingCompletion: number;
  revenue: number;
  trendUp?: boolean;
  trendValue?: number;
  
  // Buying stats
  activeBids: number;
  wonAuctions: number;
  pendingCollection: number;
  amountSpent: number;
}

// WebSocket message types
export type WSMessageType = 
  'register' |
  'new_bid' | 
  'bid_placed' |
  'auction_ending' | 
  'auction_completed' | 
  'underwrite_completed' |
  'new_message' | 
  'auction_created' |
  'auction_updated' |
  'underwrite_created' |
  'bid_accepted' | 
  'deal_confirmed' | 
  'collection_scheduled' |
  'collection_confirmed' |
  'date_extended' |
  'refresh_stats';

export interface WSMessage {
  type: WSMessageType;
  data: any;
  timestamp: number;
}
