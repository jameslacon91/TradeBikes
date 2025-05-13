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
import { Clipboard, Clock, AlertCircle, DollarSign, Filter, TrendingUp, Truck, Archive, Star } from 'lucide-react';

// Extended dashboard stats interface to include buyer-specific metrics
interface ExtendedDashboardStats extends DashboardStats {
  activeBids?: number;
  wonUnderwrites?: number; // Renamed from wonAuctions
  pendingCollection?: number; 
  amountSpent?: number;
}

export default function DealerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("current-listings");

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<ExtendedDashboardStats>({
    queryKey: ['/api/dashboard'],
  });

  // Fetch all underwrites (for buying)
  const { data: allAuctions = [], isLoading: allAuctionsLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions'],
  });

  // Fetch dealer's own underwrites (for selling)
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

        <Tabs defaultValue="current-listings" className="w-full" onValueChange={setActiveTab}>
          <div className="overflow-x-auto">
            <TabsList className="mb-6 inline-flex w-auto min-w-full">
              <TabsTrigger value="current-listings">Current Listings</TabsTrigger>
              <TabsTrigger value="past-listings">Past Listings</TabsTrigger>
              <TabsTrigger value="ongoing-underwrites">Ongoing Underwrites</TabsTrigger>
              <TabsTrigger value="past-purchases">Past Purchases</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
          </div>
          
          {/* CURRENT LISTINGS TAB CONTENT */}
          <TabsContent value="current-listings">
            {/* Stats for Selling */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Active Listings */}
              <Link href="/listing/active">
                <StatCard 
                  title="Active Listings" 
                  value={statsLoading ? "Loading..." : stats?.activeListings || 0}
                  icon={<Clipboard className="h-6 w-6 text-white" />}
                  bgColor="bg-primary"
                  trend={stats?.trendUp ? { up: true, value: stats.trendValue || 0 } : undefined}
                  className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                />
              </Link>

              {/* Total Bids */}
              <Link href="/bids/received">
                <StatCard 
                  title="Total Bids Received" 
                  value={statsLoading ? "Loading..." : stats?.totalBids || 0}
                  icon={<Clock className="h-6 w-6 text-white" />}
                  bgColor="bg-accent"
                  trend={stats?.trendUp ? { up: true, value: stats.trendValue || 0 } : undefined}
                  className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                />
              </Link>

              {/* Pending Completion */}
              <Link href="/auctions/pending">
                <StatCard 
                  title="Pending Completion" 
                  value={statsLoading ? "Loading..." : stats?.pendingCompletion || 0}
                  icon={<AlertCircle className="h-6 w-6 text-white" />}
                  bgColor="bg-yellow-500"
                  className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                />
              </Link>

              {/* Total Revenue */}
              <Link href="/revenue">
                <StatCard 
                  title="Revenue (MTD)" 
                  value={statsLoading ? "Loading..." : `£${stats?.revenue?.toLocaleString() || 0}`}
                  icon={<DollarSign className="h-6 w-6 text-white" />}
                  bgColor="bg-green-500"
                  className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                />
              </Link>
            </div>

            {/* My Active Underwrites Section */}
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
                    <Link href="/create-auction">List Your First Bike</Link>
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
                  <Link href="/auctions?filter=dealer">
                    View all your listings
                    <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* ONGOING UNDERWRITES TAB CONTENT */}
          <TabsContent value="ongoing-underwrites">
            {/* Stats for Buying */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Active Bids */}
              <Link href="/underwrites?filter=active-bids">
                <StatCard 
                  title="Active Bids" 
                  value={statsLoading ? "Loading..." : stats?.activeBids || 0}
                  icon={<TrendingUp className="h-6 w-6 text-white" />}
                  bgColor="bg-primary-light"
                  className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                />
              </Link>

              {/* Won Underwrites */}
              <Link href="/underwrites?filter=won">
                <StatCard 
                  title="Won Underwrites" 
                  value={statsLoading ? "Loading..." : stats?.wonUnderwrites || 0}
                  icon={<Archive className="h-6 w-6 text-white" />}
                  bgColor="bg-accent"
                  className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                />
              </Link>

              {/* Pending Collection */}
              <Link href="/auctions?filter=pending-collection">
                <StatCard 
                  title="Pending Collection" 
                  value={statsLoading ? "Loading..." : stats?.pendingCollection || 0}
                  icon={<Truck className="h-6 w-6 text-white" />}
                  bgColor="bg-yellow-500"
                  className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                />
              </Link>

              {/* Total Spent */}
              <Link href="/auctions?filter=completed">
                <StatCard 
                  title="Total Spent" 
                  value={statsLoading ? "Loading..." : `£${stats?.amountSpent || 0}`}
                  icon={<DollarSign className="h-6 w-6 text-white" />}
                  bgColor="bg-green-500"
                  className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                />
              </Link>
            </div>

            {/* Available Underwrites Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Available Underwrites</h2>
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
                  <p className="text-gray-500">Loading available underwrites...</p>
                </div>
              ) : displayedBuyingAuctions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No active underwrites found.</p>
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
                    View all available underwrites
                    <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* PAST LISTINGS TAB CONTENT */}
          <TabsContent value="past-listings">
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Past Listings</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                <p className="text-gray-500 text-center py-4">
                  Your completed listings will appear here.
                </p>
                <Button className="mt-4 mx-auto block" asChild>
                  <Link href="/auctions/dealer?filter=completed">View All Past Listings</Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* PAST PURCHASES TAB CONTENT */}
          <TabsContent value="past-purchases">
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Past Purchases</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                <p className="text-gray-500 text-center py-4">
                  Your completed purchases will appear here.
                </p>
                <Button className="mt-4 mx-auto block" asChild>
                  <Link href="/auctions?filter=purchased">View All Purchases</Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* MESSAGES TAB CONTENT */}
          <TabsContent value="messages">
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

          {/* REVIEWS TAB CONTENT */}
          <TabsContent value="reviews">
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Reviews</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                <p className="text-gray-500 text-center py-4">
                  Ratings and reviews from other dealers will appear here.
                </p>
                <div className="flex justify-center items-center mt-4">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className={`h-6 w-6 ${i < (user?.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600">
                      {user?.rating?.toFixed(1) || "No"} rating ({user?.totalRatings || 0} reviews)
                    </span>
                  </div>
                </div>
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