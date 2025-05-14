import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isValid, parseISO } from 'date-fns';
import StatCard from '@/components/dashboard/StatCard';
import ActivityItem from '@/components/dashboard/ActivityItem';
import AuctionCard from '@/components/auctions/AuctionCard';
import { 
  Package, AlertCircle, Clock, DollarSign, BarChart4, Users,
  Gavel, PlusCircle, Link as LinkIcon, Home, Search
} from 'lucide-react';
import { Link } from 'wouter';
import Layout from '@/components/layout/Layout';
import { DashboardStats, AuctionWithDetails, ActivityItem as ActivityItemType } from '@shared/types';

// Lazy-loaded components
const FavoriteDealers = lazy(() => import('@/components/dashboard/FavoriteDealers'));
const BidAcceptance = lazy(() => import('@/components/dashboard/BidAcceptance'));

export default function DealerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    enabled: activeTab === 'dashboard'
  });
  
  // Fetch dealer auctions - needed for multiple tabs
  const { data: activeAuctions, isLoading: auctionsLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions/dealer'],
    enabled: activeTab === 'ongoing-underwrites' || activeTab === 'dashboard' || activeTab === 'pending-completion' || activeTab === 'past-listings'
  });
  
  // Fetch activity feed
  const { data: activityItems = [], isLoading: activityLoading } = useQuery<ActivityItemType[]>({
    queryKey: ['/api/activity'],
    enabled: activeTab === 'dashboard'
  });
  
  // Get auctions by user role
  const userAuctions = activeAuctions?.filter(auction => 
    user?.role === 'dealer' ? 
    auction.dealerId === user?.id : 
    auction.bids?.some(bid => bid.dealerId === user?.id)
  ) || [];
  
  const hasListings = userAuctions.length > 0;
  
  // Filter auctions by status
  const activeListings = userAuctions.filter(a => a.status === 'active');
  const pastListings = userAuctions.filter(a => a.status === 'completed');
  
  // Get pending collection auctions and sort them by motorcycle availability date
  const pendingCollection = userAuctions
    .filter(a => a.status === 'pending_collection')
    .sort((a, b) => {
      try {
        // Try to get and parse dates - if dateAvailable is a string date format
        let aDate, bDate;
        
        if (a.motorcycle?.dateAvailable && typeof a.motorcycle.dateAvailable === 'string') {
          // First try to parse as ISO date if it looks like one
          if (a.motorcycle.dateAvailable.includes('-') || a.motorcycle.dateAvailable.includes('T')) {
            aDate = parseISO(a.motorcycle.dateAvailable);
          } else {
            // Handle text dates like "Immediate" or "End of the month" by giving them relative priority
            if (a.motorcycle.dateAvailable.toLowerCase().includes('immediate')) {
              aDate = new Date(); // Today
            } else if (a.motorcycle.dateAvailable.toLowerCase().includes('week')) {
              aDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Roughly a week from now
            } else {
              aDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to roughly a month
            }
          }
        } else {
          aDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Far future if no date
        }
        
        if (b.motorcycle?.dateAvailable && typeof b.motorcycle.dateAvailable === 'string') {
          if (b.motorcycle.dateAvailable.includes('-') || b.motorcycle.dateAvailable.includes('T')) {
            bDate = parseISO(b.motorcycle.dateAvailable);
          } else {
            if (b.motorcycle.dateAvailable.toLowerCase().includes('immediate')) {
              bDate = new Date(); 
            } else if (b.motorcycle.dateAvailable.toLowerCase().includes('week')) {
              bDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            } else {
              bDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }
          }
        } else {
          bDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        }
        
        // Check if dates are valid and sort
        const aValid = isValid(aDate);
        const bValid = isValid(bDate);
        
        // Sort by date if both are valid
        if (aValid && bValid) {
          return aDate.getTime() - bDate.getTime();
        }
        
        // Handle case where only one is valid
        if (aValid) return -1;
        if (bValid) return 1;
        
        return 0;
      } catch (error) {
        console.log("Error sorting by date availability:", error);
        return 0; // Keep original order if there's an error
      }
    });
    
  const completedDeals = userAuctions.filter(a => a.status === 'completed');
  
  return (
    <Layout>
      <main className="container px-2 sm:px-4 py-6">
        <div className="flex flex-col space-y-6">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.companyName || 'Dealer'}
              </p>
            </div>
            <div className="flex space-x-2">
              <Link href="/create-auction">
                <Button className="bg-amber-500 hover:bg-amber-600">
                  <Gavel className="mr-2 h-5 w-5" />
                  List Motorcycle
                </Button>
              </Link>
              <Link href="/auctions">
                <Button variant="outline">
                  <LinkIcon className="mr-2 h-5 w-5" />
                  View Underwrites
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Tabs Navigation */}
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="dashboard">Overview</TabsTrigger>
              <TabsTrigger value="ongoing-underwrites">Ongoing Underwrites</TabsTrigger>
              <TabsTrigger value="past-listings">Past Listings</TabsTrigger>
              <TabsTrigger value="pending-completion">Pending Completion</TabsTrigger>
            </TabsList>
            
            {/* Dashboard Overview */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Listings */}
                <div onClick={() => setActiveTab("ongoing-underwrites")}>
                  <StatCard 
                    title="Active Listings" 
                    value={statsLoading || auctionsLoading ? "Loading..." : activeListings.length}
                    icon={<Package className="h-6 w-6 text-white" />}
                    bgColor="bg-primary"
                    trend={stats?.trendUp ? { up: true, value: stats.trendValue || 0 } : undefined}
                    className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                  />
                </div>

                {/* Total Bids */}
                <div onClick={() => setActiveTab("ongoing-underwrites")}>
                  <StatCard 
                    title="Total Bids Received" 
                    value={statsLoading ? "Loading..." : stats?.totalBids || 0}
                    icon={<Clock className="h-6 w-6 text-white" />}
                    bgColor="bg-accent"
                    trend={stats?.trendUp ? { up: true, value: stats.trendValue || 0 } : undefined}
                    className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                  />
                </div>

                {/* Pending Completion */}
                <div onClick={() => setActiveTab("pending-completion")}>
                  <StatCard 
                    title="Pending Completion" 
                    value={statsLoading || auctionsLoading ? "Loading..." : pendingCollection.length}
                    icon={<AlertCircle className="h-6 w-6 text-white" />}
                    bgColor="bg-yellow-500"
                    className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                  />
                </div>

                {/* Total Revenue */}
                <div onClick={() => setActiveTab("past-listings")}>
                  <StatCard 
                    title="Revenue (MTD)" 
                    value={statsLoading ? "Loading..." : `£${stats?.revenue?.toLocaleString() || 0}`}
                    icon={<DollarSign className="h-6 w-6 text-white" />}
                    bgColor="bg-green-500"
                    className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                  />
                </div>
              </div>

              {/* My Active Underwrites Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">My Active Underwrites</h2>
                  <Link href="/auctions/dealer">
                    <Button variant="link" className="gap-1">
                      View All <LinkIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                {auctionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="h-[340px]">
                        <CardContent className="p-0">
                          <Skeleton className="h-[200px] w-full" />
                          <div className="p-4">
                            <Skeleton className="h-5 w-[180px] mb-2" />
                            <Skeleton className="h-4 w-[150px] mb-4" />
                            <div className="flex justify-between">
                              <Skeleton className="h-10 w-[80px]" />
                              <Skeleton className="h-10 w-[80px]" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !hasListings ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Underwrites</h3>
                    <p className="text-muted-foreground mb-6">You don't have any active underwrites yet.</p>
                    <Link href="/create-auction">List Your First Bike</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeListings.slice(0, 3).map(auction => (
                      <AuctionCard 
                        key={auction.id} 
                        auction={auction}
                        showDealerInfo={false} 
                        hideEndingSoon
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Recent Activity & Favorite Dealers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activityLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-3 w-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activityItems?.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart4 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <h3 className="text-muted-foreground">No recent activity</h3>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activityItems?.map((item: ActivityItemType) => (
                          <ActivityItem key={item.id} item={item} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Favorite Dealers */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Favorite Dealers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <React.Suspense fallback={<div className="text-center py-10">Loading favorite dealers...</div>}>
                      <FavoriteDealers />
                    </React.Suspense>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Active Listings Tab */}
            <TabsContent value="ongoing-underwrites" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Active Listings</h2>
                <p className="text-muted-foreground">Manage your active listings and bids.</p>
                
                {auctionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <Skeleton className="h-40 w-full mb-3" />
                        <Skeleton className="h-5 w-2/3 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <div className="flex justify-between">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeListings.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">You don't have any active underwrites.</h3>
                    <Link href="/create-auction">
                      <Button>List your first bike</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeListings.map(auction => (
                      <AuctionCard 
                        key={auction.id}
                        auction={auction}
                        showDealerInfo={false}
                      />
                    ))}
                  </div>
                )}
                
                {/* Bid Acceptance Section (dealers only) */}
                {user?.role === 'dealer' && (
                  <React.Suspense fallback={<div className="text-center py-10">Loading bids...</div>}>
                    <BidAcceptance auctions={activeListings.filter(a => a.totalBids > 0)} />
                  </React.Suspense>
                )}
              </div>
            </TabsContent>
            
            {/* Past Listings Tab */}
            <TabsContent value="past-listings" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Past Listings</h2>
                <p className="text-muted-foreground">View your completed underwrites.</p>
                
                {auctionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <Skeleton className="h-40 w-full mb-3" />
                        <Skeleton className="h-5 w-2/3 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <div className="flex justify-between">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pastListings.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">You don't have any completed underwrites.</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pastListings.map(auction => (
                      <AuctionCard 
                        key={auction.id}
                        auction={auction}
                        showDealerInfo={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Pending Completion Tab */}
            <TabsContent value="pending-completion" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Pending Completion</h2>
                <p className="text-muted-foreground">Manage your deals in process.</p>
                
                {auctionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <Skeleton className="h-40 w-full mb-3" />
                        <Skeleton className="h-5 w-2/3 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <div className="flex justify-between">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pendingCollection.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <Home className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">You don't have any underwrites pending collection.</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingCollection.map(auction => (
                      <AuctionCard 
                        key={auction.id}
                        auction={auction}
                        showDealerInfo={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </Layout>
  );
}