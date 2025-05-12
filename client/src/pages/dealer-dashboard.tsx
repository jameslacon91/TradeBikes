import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import ActivityItem from '@/components/dashboard/ActivityItem';
import AuctionCard from '@/components/auctions/AuctionCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityItem as ActivityItemType, AuctionWithDetails, DashboardStats } from '@shared/types';
import { Clipboard, Clock, AlertCircle, DollarSign, Filter } from 'lucide-react';

export default function DealerDashboard() {
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard'],
  });

  // Fetch dealer's auctions
  const { data: auctions = [], isLoading: auctionsLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions/dealer'],
  });

  // Fetch recent activity
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityItemType[]>({
    queryKey: ['/api/activity'],
  });

  // Filter to show only active auctions in the dashboard
  const activeAuctions = auctions.filter(auction => auction.status === 'active');
  
  // Take the first 3 for display
  const displayedAuctions = activeAuctions.slice(0, 3);

  return (
    <Layout showRoleSwitcher>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Dealer Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Welcome back to TradeBikes. Manage your listings and track auction activity.</p>
          </div>

          {/* Stats overview */}
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
              title="Total Bids" 
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
              value={statsLoading ? "Loading..." : `£${stats?.revenue.toLocaleString() || 0}`}
              icon={<DollarSign className="h-6 w-6 text-white" />}
              bgColor="bg-green-500"
            />
          </div>

          {/* Active Auctions Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Active Auctions</h2>
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

            {auctionsLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Loading your auctions...</p>
              </div>
            ) : displayedAuctions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">You don't have any active auctions.</p>
                <Button className="mt-4" asChild>
                  <Link href="/create-auction">Create Your First Auction</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayedAuctions.map((auction) => (
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
              <Link href="/auctions">
                <a className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary">
                  View all auctions
                  <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
              </Link>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="mt-8">
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
        </div>
      </div>
    </Layout>
  );
}
