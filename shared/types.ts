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
  // Connection & system messages
  'register' |
  'register_confirmed' |
  'ping' |
  'pong' |
  
  // Bid-related messages
  'new_bid' | 
  'bid_placed' |
  'bid_accepted' | 
  'bid_accepted_confirm' |
  
  // Auction/Underwrite messages
  'auction_ending' | 
  'auction_completed' | 
  'underwrite_completed' |
  'auction_created' |
  'auction_updated' |
  'underwrite_created' |
  'auction_status_changed' |
  
  // Transaction flow messages
  'deal_confirmed' | 
  'collection_scheduled' |
  'collection_confirmed' |
  'date_extended' |
  
  // Communication & notifications
  'new_message' |
  'refresh_stats' |
  'force_data_refresh';

export interface WSMessage {
  type: WSMessageType;
  data: any;
  timestamp: number;
}
