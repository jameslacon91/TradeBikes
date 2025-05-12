import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import ActivityItem from '@/components/dashboard/ActivityItem';
import AuctionCard from '@/components/auctions/AuctionCard';
import FavoriteDealers from '@/components/dealers/FavoriteDealers';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityItem as ActivityItemType, AuctionWithDetails, DashboardStats } from '@shared/types';
import { Clipboard, Clock, AlertCircle, DollarSign, Filter, TrendingUp, Truck, Archive } from 'lucide-react';

// Extended dashboard stats interface to include buyer-specific metrics
interface ExtendedDashboardStats extends DashboardStats {
  activeBids?: number;
  wonAuctions?: number;
  pendingCollection?: number; 
  amountSpent?: number;
}

export default function DealerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("selling");

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<ExtendedDashboardStats>({
    queryKey: ['/api/dashboard'],
  });

  // Fetch all auctions (for buying)
  const { data: allAuctions = [], isLoading: allAuctionsLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions'],
  });

  // Fetch dealer's own auctions (for selling)
  const { data: myAuctions = [], isLoading: myAuctionsLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions/dealer'],
  });

  // Fetch recent activity
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityItemType[]>({
    queryKey: ['/api/activity'],
  });

  // Filter auctions for each tab
  const activeSellingAuctions = myAuctions.filter(auction => auction.status === 'active');
  const displayedSellingAuctions = activeSellingAuctions.slice(0, 3);
  
  const availableBuyingAuctions = allAuctions.filter(auction => 
    auction.status === 'active' && auction.dealerId !== user?.id
  );
  const displayedBuyingAuctions = availableBuyingAuctions.slice(0, 3);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dealer Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back to TradeBikes. Buy and sell motorcycles with ease.</p>
        </div>

        <Tabs defaultValue="selling" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="selling">Selling</TabsTrigger>
            <TabsTrigger value="buying">Buying</TabsTrigger>
            <TabsTrigger value="favorites">Favorite Dealers</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          {/* SELLING TAB CONTENT */}
          <TabsContent value="selling">
            {/* Stats for Selling */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Active Listings */}
              <StatCard 
                title="Active Listings" 
                value={statsLoading ? "Loading..." : stats?.activeListings || 0}
                icon={<Clipboard className="h-6 w-6 text-white" />}
                bgColor="bg-primary-light"
                trend={stats?.trendUp ? { up: true, value: stats.trendValue || 0 } : undefined}
              />

              {/* Total Bids */}
              <StatCard 
                title="Total Bids Received" 
                value={statsLoading ? "Loading..." : stats?.totalBids || 0}
                icon={<Clock className="h-6 w-6 text-white" />}
                bgColor="bg-accent"
                trend={stats?.trendUp ? { up: true, value: stats.trendValue || 0 } : undefined}
              />

              {/* Pending Completion */}
              <StatCard 
                title="Pending Completion" 
                value={statsLoading ? "Loading..." : stats?.pendingCompletion || 0}
                icon={<AlertCircle className="h-6 w-6 text-white" />}
                bgColor="bg-yellow-500"
              />

              {/* Total Revenue */}
              <StatCard 
                title="Revenue (MTD)" 
                value={statsLoading ? "Loading..." : `£${stats?.revenue?.toLocaleString() || 0}`}
                icon={<DollarSign className="h-6 w-6 text-white" />}
                bgColor="bg-green-500"
              />
            </div>

            {/* My Active Auctions Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Active Listings</h2>
                <div className="flex items-center">
                  <Button variant="outline" size="sm" className="mr-3">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Makes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Makes</SelectItem>
                      <SelectItem value="honda">Honda</SelectItem>
                      <SelectItem value="yamaha">Yamaha</SelectItem>
                      <SelectItem value="ducati">Ducati</SelectItem>
                      <SelectItem value="bmw">BMW</SelectItem>
                      <SelectItem value="kawasaki">Kawasaki</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {myAuctionsLoading ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Loading your listings...</p>
                </div>
              ) : displayedSellingAuctions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">You don't have any active listings.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/create-auction">Create Your First Auction</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedSellingAuctions.map((auction) => (
                    <AuctionCard
                      key={auction.id}
                      id={auction.id}
                      motorcycle={auction.motorcycle}
                      currentBid={auction.currentBid}
                      totalBids={auction.totalBids}
                      endTime={new Date(auction.endTime)}
                      status={auction.status}
                    />
                  ))}
                </div>
              )}

              <div className="mt-4 text-right">
                <Button variant="ghost" className="text-primary" asChild>
                  <Link href="/auctions/dealer">
                    View all your listings
                    <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* BUYING TAB CONTENT */}
          <TabsContent value="buying">
            {/* Stats for Buying */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Active Bids */}
              <StatCard 
                title="Active Bids" 
                value={statsLoading ? "Loading..." : stats?.activeBids || 0}
                icon={<TrendingUp className="h-6 w-6 text-white" />}
                bgColor="bg-primary-light"
              />

              {/* Won Auctions */}
              <StatCard 
                title="Won Auctions" 
                value={statsLoading ? "Loading..." : stats?.wonAuctions || 0}
                icon={<Archive className="h-6 w-6 text-white" />}
                bgColor="bg-accent"
              />

              {/* Pending Collection */}
              <StatCard 
                title="Pending Collection" 
                value={statsLoading ? "Loading..." : stats?.pendingCollection || 0}
                icon={<Truck className="h-6 w-6 text-white" />}
                bgColor="bg-yellow-500"
              />

              {/* Total Spent */}
              <StatCard 
                title="Total Spent" 
                value={statsLoading ? "Loading..." : `£${stats?.amountSpent || 0}`}
                icon={<DollarSign className="h-6 w-6 text-white" />}
                bgColor="bg-green-500"
              />
            </div>

            {/* Available Auctions Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Available Auctions</h2>
                <div className="flex items-center">
                  <Button variant="outline" size="sm" className="mr-3">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Makes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Makes</SelectItem>
                      <SelectItem value="honda">Honda</SelectItem>
                      <SelectItem value="yamaha">Yamaha</SelectItem>
                      <SelectItem value="ducati">Ducati</SelectItem>
                      <SelectItem value="bmw">BMW</SelectItem>
                      <SelectItem value="kawasaki">Kawasaki</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {allAuctionsLoading ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Loading available auctions...</p>
                </div>
              ) : displayedBuyingAuctions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No active auctions found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedBuyingAuctions.map((auction) => (
                    <AuctionCard
                      key={auction.id}
                      id={auction.id}
                      motorcycle={auction.motorcycle}
                      currentBid={auction.currentBid}
                      totalBids={auction.totalBids}
                      endTime={new Date(auction.endTime)}
                      status={auction.status}
                    />
                  ))}
                </div>
              )}

              <div className="mt-4 text-right">
                <Button variant="ghost" className="text-primary" asChild>
                  <Link href="/auctions">
                    View all available auctions
                    <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ACTIVITY TAB CONTENT */}
          <TabsContent value="activity">
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {activitiesLoading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">Loading recent activity...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No recent activity to display.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {activities.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        icon={activity.icon}
                        iconColor={activity.color}
                        title={activity.title}
                        description={activity.description}
                        timestamp={new Date(activity.timestamp)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </TabsContent>

          {/* FAVORITE DEALERS TAB CONTENT */}
          <TabsContent value="favorites">
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Favorite Dealers</h2>
              
              {/* Import and use the FavoriteDealers component */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                <React.Suspense fallback={<div className="text-center py-10">Loading favorite dealers...</div>}>
                  <FavoriteDealers />
                </React.Suspense>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}