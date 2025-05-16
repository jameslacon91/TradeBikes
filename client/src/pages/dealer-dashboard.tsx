import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isValid, parseISO } from 'date-fns';
import StatCard from '@/components/dashboard/StatCard';
import ActivityItem from '@/components/dashboard/ActivityItem';
import AuctionCard from '@/components/auctions/AuctionCard';
import { 
  Package, AlertCircle, Clock, CheckCircle, BarChart4, Users,
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
  const { toast } = useToast();
  
  // Get query references for manual refetching
  const { refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats', user?.id],
    enabled: false // Just to get the refetch function
  });
  
  const { refetch: refetchDealerAuctions } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions/dealer', user?.id],
    enabled: false // Just to get the refetch function
  });
  
  const { refetch: refetchActivity } = useQuery<ActivityItemType[]>({
    queryKey: ['/api/activity', user?.id],
    enabled: false // Just to get the refetch function
  });
  
  const { refetch: refetchBids } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions/bids', user?.id],
    enabled: false // Just to get the refetch function
  });
  
  // Force a refetch of all data when the user changes
  useEffect(() => {
    // This effect runs when the user ID changes, ensuring fresh data
    if (user) {
      console.log("User ID changed, refetching all dashboard data");
      
      // Manually refetch all data to ensure fresh state
      refetchStats();
      refetchDealerAuctions();
      refetchActivity();
      refetchBids();
    }
  }, [user?.id, refetchStats, refetchDealerAuctions, refetchActivity, refetchBids]);
  
  // Listen for the force-data-refresh event from WebSocket notifications
  useEffect(() => {
    const handleForceDataRefresh = () => {
      console.log("Force data refresh event received, refetching all dashboard data");
      
      // Only refetch if we have a user
      if (user) {
        // Manually refetch everything to avoid stale data
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/bids'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        
        // Ensure we trigger fresh fetches
        setTimeout(() => {
          refetchStats();
          refetchDealerAuctions();
          refetchActivity();
          refetchBids();
          
          // Provide a visual cue that data is refreshing
          toast({
            title: "Data refreshed",
            description: "Dashboard data has been updated with the latest changes",
            variant: "default",
          });
        }, 300);
      }
    };
    
    // Add event listener for the force refresh
    window.addEventListener('force-data-refresh', handleForceDataRefresh);
    
    // Clean up
    return () => {
      window.removeEventListener('force-data-refresh', handleForceDataRefresh);
    };
  }, [user, refetchStats, refetchDealerAuctions, refetchActivity, refetchBids, toast]);
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats', user?.id], // Include user ID in cache key for isolation
    staleTime: 0, // Always consider data stale to force refetching
    enabled: activeTab === 'dashboard' && !!user
  });
  
  // Fetch dealer auctions - needed for multiple tabs
  const { data: activeAuctions, isLoading: auctionsLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions/dealer', user?.id],
    enabled: (activeTab === 'active-listings' || activeTab === 'dashboard' || activeTab === 'pending-completion' || 
              activeTab === 'completed-deals' || activeTab === 'placed-bids') && !!user,
    staleTime: 0 // Always refetch when query key changes
  });
  
  // Fetch activity feed
  const { data: activityItems = [], isLoading: activityLoading } = useQuery<ActivityItemType[]>({
    queryKey: ['/api/activity', user?.id],
    enabled: activeTab === 'dashboard' && !!user,
    staleTime: 0 // Always refetch when query key changes
  });
  
  // Get auctions by user role
  const userAuctions = activeAuctions?.filter(auction => 
    user?.role === 'dealer' ? 
    auction.dealerId === user?.id : 
    auction.bids?.some(bid => bid.dealerId === user?.id)
  ) || [];
  
  const hasListings = userAuctions.length > 0;
  
  // Fetch auctions where the user has placed bids
  const { data: biddedAuctions = [], isLoading: bidsLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ['/api/auctions/bids', user?.id], // Include user ID in query key to handle user switching
    enabled: !!user, // Load as soon as user is authenticated
    staleTime: 0 // Always refetch when query key changes
  });
  
  // Filter to show ALL auctions where the current user has placed a bid
  // The stat card should match the total number of bids placed, not the filtered view
  console.log('Filtering placed bids from these auctions:', biddedAuctions);
  
  // Store the total number of bids placed for stats (this is the raw count that appears in the stats card)
  const allBidsPlaced = biddedAuctions;

  // Then create a filtered view for the UI that excludes pending collection items
  const placedBids = biddedAuctions.filter(auction => {
    // This auction already has an accepted bid and is pending collection
    const isPendingCollection = auction.status === 'pending_collection' || auction.bidAccepted === true;
    // User is the winning bidder
    const isWinningBidder = auction.winningBidderId === user?.id;
    
    console.log(`Auction ${auction.id} - isPendingCollection: ${isPendingCollection}, isWinningBidder: ${isWinningBidder}, status: ${auction.status}, bidAccepted: ${auction.bidAccepted}`);
    
    // Show in "Placed Bids" ONLY IF it's not pending collection OR the user is not the winning bidder
    // This ensures items don't appear in both Placed Bids and Pending Collection tabs
    return !isPendingCollection || !isWinningBidder;
  });
  
  // Calculate total bid amount for the user
  const totalBidAmount = biddedAuctions.reduce((total, auction) => {
    // Find the highest bid made by this user for this auction
    const userBids = auction.bids?.filter(bid => bid.dealerId === user?.id) || [];
    if (userBids.length > 0) {
      // Get the highest bid amount
      const highestUserBid = userBids.reduce((highest, bid) => 
        bid.amount > highest ? bid.amount : highest, 0);
      return total + highestUserBid;
    }
    return total;
  }, 0);
  
  // Filter auctions by status
  const activeListings = userAuctions.filter(a => a.status === 'active');
  
  // Create a combined set of auctions to check for completed listings (both user-created and bidded)
  const allAuctionsToCheck = [...(userAuctions || [])];
  
  // Add bidded auctions that aren't already in the userAuctions list
  if (biddedAuctions && biddedAuctions.length > 0) {
    biddedAuctions.forEach(auction => {
      if (!allAuctionsToCheck.some(a => a.id === auction.id)) {
        allAuctionsToCheck.push(auction);
      }
    });
  }
  
  // Past listings should include completed auctions and collections that have been confirmed
  // from both listings created by the user and auctions they've bid on and won
  const completedDeals = allAuctionsToCheck.filter(a => {
    // Include any completed auctions or where collection is confirmed
    const isCompleted = a.status === 'completed' || a.collectionConfirmed === true;
    
    // For bidding user, check if they were the winning bidder
    const userIsWinner = a.winningBidderId === user?.id;
    
    // For selling user, check if they were the seller
    const userIsSeller = a.dealerId === user?.id;
    
    console.log(`Checking past listing ${a.id}: completed=${isCompleted}, userIsWinner=${userIsWinner}, userIsSeller=${userIsSeller}`);
    
    // Include in past listings if it's completed AND the user was either the seller or winning bidder
    return isCompleted && (userIsSeller || userIsWinner);
  });
  
  // Get pending collection auctions (for both sellers and buyers)
  let pendingCollection: AuctionWithDetails[] = [];
  
  // DEBUG LOGGING
  console.log(`DEBUG: activeAuctions for ${user?.username}:`, activeAuctions);
  console.log(`DEBUG: biddedAuctions for ${user?.username}:`, biddedAuctions);
  
  // Create a combined list of auctions to check for pending collection (from both active and bidded lists)
  // This is needed because we need to show pending collections for both dealers who listed AND dealers who won
  const combinedAuctions = [...(activeAuctions || [])];
  
  // Add bidded auctions that aren't already in the active auctions list
  if (biddedAuctions && biddedAuctions.length > 0) {
    biddedAuctions.forEach(auction => {
      if (!combinedAuctions.some(a => a.id === auction.id)) {
        combinedAuctions.push(auction);
      }
    });
  }
  
  console.log(`DEBUG: Combined auctions to check for pending collection:`, combinedAuctions);
  
  if (combinedAuctions.length > 0) {
    // First filter for pending collections and accepted bids (but exclude those that have been marked as completed)
    const filteredAuctions = combinedAuctions.filter(auction => {
      console.log(`Checking auction ${auction.id} - status: ${auction.status}, bidAccepted: ${auction.bidAccepted}, collectionConfirmed: ${auction.collectionConfirmed}, dealerId: ${auction.dealerId}, winningBidderId: ${auction.winningBidderId}, currentUser: ${user?.id}`);
      
      // Include auctions that are explicitly in "pending_collection" status OR have bidAccepted=true 
      const isPendingCollection = auction.status === 'pending_collection' || auction.bidAccepted === true;
      
      // Collection is not yet confirmed
      const notCollected = auction.collectionConfirmed !== true;
      
      // User is either the seller or the winning bidder
      const userInvolved = auction.dealerId === user?.id || auction.winningBidderId === user?.id;
      
      // Only include auctions in "pending collection" section if they are pending collection and user is involved
      const shouldInclude = isPendingCollection && notCollected && userInvolved;
      
      console.log(`Auction ${auction.id} - Including in pending collection? ${shouldInclude}`);
      
      return shouldInclude;
    });
    
    // Then sort by availability date
    pendingCollection = filteredAuctions.sort((a, b) => {
      
    console.log(`Final pending collection list for ${user?.username}:`, pendingCollection.map(a => ({ id: a.id, status: a.status, bidAccepted: a.bidAccepted })));
      try {
        // Convert availability dates to comparable Date objects
        const getDate = (auction: AuctionWithDetails): Date => {
          const dateStr = auction.motorcycle?.dateAvailable;
          
          if (!dateStr || typeof dateStr !== 'string') {
            return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days in future
          }
          
          if (dateStr.includes('-') || dateStr.includes('T')) {
            const parsed = parseISO(dateStr);
            return isValid(parsed) ? parsed : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          }
          
          if (dateStr.toLowerCase().includes('immediate')) {
            return new Date();
          } else if (dateStr.toLowerCase().includes('week')) {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          } else {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          }
        };
        
        const aDate = getDate(a);
        const bDate = getDate(b);
        
        return aDate.getTime() - bDate.getTime();
      } catch (error) {
        console.log("Error sorting by date availability:", error);
        return 0;
      }
    });
  }
    
  // Create a combined list of all auctions for the user (both as seller and as bidder)
  const allAuctionsForStats = [...userAuctions];
  
  // Add bidded auctions that aren't already in the list
  if (biddedAuctions && biddedAuctions.length > 0) {
    biddedAuctions.forEach(auction => {
      if (!allAuctionsForStats.some(a => a.id === auction.id)) {
        allAuctionsForStats.push(auction);
      }
    });
  }
  
  // Filter completed deals - count as completed if the user either created it or won it
  const completedDealsForStats = allAuctionsForStats.filter(a => {
    const isCompleted = a.status === 'completed';
    const userIsWinner = a.winningBidderId === user?.id; 
    const userIsSeller = a.dealerId === user?.id;
    
    // Count in stats if completed and user was involved as either seller or winner
    return isCompleted && (userIsSeller || userIsWinner);
  });
  
  console.log("Completed deals for stat card:", completedDealsForStats.map(a => ({
    id: a.id, 
    isWinner: a.winningBidderId === user?.id,
    isSeller: a.dealerId === user?.id
  })));
  
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
              <Link href="/search-map">
                <Button variant="outline">
                  <Search className="mr-2 h-5 w-5" />
                  Search Stock
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Responsive Tabs Navigation */}
          <div className="tabs tabs-boxed bg-base-200 p-1 overflow-x-auto scrollbar-hide whitespace-nowrap flex flex-nowrap">
            <button 
              className={`tab flex-shrink-0 ${activeTab === "dashboard" ? "tab-active bg-primary text-white" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Overview
            </button>
            <button 
              className={`tab flex-shrink-0 ${activeTab === "active-listings" ? "tab-active bg-primary text-white" : ""}`}
              onClick={() => setActiveTab("active-listings")}
            >
              Active Listings
            </button>
            <button 
              className={`tab flex-shrink-0 ${activeTab === "placed-bids" ? "tab-active bg-primary text-white" : ""}`}
              onClick={() => setActiveTab("placed-bids")}
            >
              Placed Bids
            </button>
            <button 
              className={`tab flex-shrink-0 ${activeTab === "pending-completion" ? "tab-active bg-primary text-white" : ""}`}
              onClick={() => setActiveTab("pending-completion")}
            >
              Pending Completion
            </button>
            <button 
              className={`tab flex-shrink-0 ${activeTab === "completed-deals" ? "tab-active bg-primary text-white" : ""}`}
              onClick={() => setActiveTab("completed-deals")}
            >
              Completed Deals
            </button>
          </div>
          
          {/* Content Container */}
          <div className="mt-6">
            {/* Using Tabs component to handle tab content while DaisyUI handles the tab buttons */}
            <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
            
              {/* Dashboard Overview */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Active Listings */}
                  <div onClick={() => setActiveTab("active-listings")}>
                    <StatCard 
                      title="Active Listings" 
                      value={statsLoading || auctionsLoading ? "Loading..." : activeListings.length}
                      icon={<Package className="h-6 w-6 text-white" />}
                      bgColor="bg-primary"
                      trend={stats?.trendUp ? { up: true, value: stats.trendValue || 0 } : undefined}
                      className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                    />
                  </div>

                  {/* Total Bids Received - Only for active listings */}
                  <div onClick={() => setActiveTab("active-listings")}>
                    <StatCard 
                      title="Active Bids Received" 
                      value={statsLoading || auctionsLoading ? "Loading..." : 
                        activeListings.reduce((total, auction) => total + (auction.bids?.length || 0), 0)}
                      icon={<Clock className="h-6 w-6 text-white" />}
                      bgColor="bg-accent"
                      className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                    />
                  </div>
                  
                  {/* Placed Bids */}
                  <div onClick={() => setActiveTab("placed-bids")}>
                    <StatCard 
                      title="Placed Bids" 
                      value={statsLoading || bidsLoading ? "Loading..." : placedBids.length}
                      subtitle={statsLoading || bidsLoading ? "" : totalBidAmount > 0 ? `Total: £${totalBidAmount.toLocaleString()}` : "No bids"}
                      icon={<Gavel className="h-6 w-6 text-white" />}
                      bgColor="bg-blue-500"
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

                  {/* Completed Deals */}
                  <div onClick={() => setActiveTab("completed-deals")}>
                    <StatCard 
                      title="Completed Deals" 
                      value={statsLoading || auctionsLoading ? "Loading..." : completedDealsForStats.length}
                      icon={<CheckCircle className="h-6 w-6 text-white" />}
                      bgColor="bg-green-500"
                      className="cursor-pointer transition-transform hover:translate-y-[-5px]"
                    />
                  </div>
                </div>
                
                {/* Two column layout for activity feed and quick view */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Activity Feed */}
                  <Card className="col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activityLoading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="py-3 border-b last:border-0">
                              <div className="flex items-center">
                                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-[250px]" />
                                  <Skeleton className="h-3 w-[180px]" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : activityItems.length === 0 ? (
                        <div className="py-8 text-center">
                          <BarChart4 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                          <h3 className="text-lg font-medium mb-1">No recent activity</h3>
                          <p className="text-sm text-muted-foreground">
                            Your recent activity will appear here
                          </p>
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
                  
                  {/* Right sidebar */}
                  <div className="space-y-6">
                    {/* Favorite Dealers */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Favorite Dealers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Suspense fallback={
                          <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex items-center space-x-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1">
                                  <Skeleton className="h-4 w-[120px]" />
                                </div>
                              </div>
                            ))}
                          </div>
                        }>
                          <FavoriteDealers />
                        </Suspense>
                      </CardContent>
                    </Card>
                    
                    {/* Pending Bids */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Bid Acceptance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Suspense fallback={
                          <div className="space-y-3">
                            <Skeleton className="h-16 w-full rounded" />
                            <Skeleton className="h-16 w-full rounded" />
                          </div>
                        }>
                          <BidAcceptance auctions={userAuctions || []} />
                        </Suspense>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Active Listings Tab */}
              <TabsContent value="active-listings">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Active Listings</h2>
                  <p className="text-muted-foreground">Motorcycles you currently have for underwriting.</p>
                
                  {auctionsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
                    <div className="text-center py-12 border rounded-lg mt-4">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">You don't have any active listings</h3>
                      <Link href="/create-auction">
                        <Button className="bg-amber-500 hover:bg-amber-600">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Your First Listing
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {activeListings.map(auction => (
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
              
              {/* Placed Bids Tab */}
              <TabsContent value="placed-bids">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Placed Bids</h2>
                  <p className="text-muted-foreground">Bids you've placed on other dealers' listings.</p>
                
                  {bidsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
                  ) : placedBids.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg mt-4">
                      <Gavel className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">You haven't placed any bids yet</h3>
                      <Link href="/auctions">
                        <Button variant="outline">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Browse Available Motorcycles
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {placedBids.map(auction => (
                        <AuctionCard 
                          key={auction.id}
                          auction={auction}
                          showDealerInfo={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Completed Deals Tab */}
              <TabsContent value="completed-deals">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Completed Deals</h2>
                  <p className="text-muted-foreground">Your historical deals (both as seller and buyer).</p>
                
                  {auctionsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
                  ) : completedDeals.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg mt-4">
                      <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">You don't have any completed deals yet</h3>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {completedDeals.map(auction => (
                        <AuctionCard 
                          key={auction.id}
                          auction={auction}
                          showDealerInfo={auction.dealerId !== user?.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Pending Collection Tab */}
              <TabsContent value="pending-completion">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Pending Completion</h2>
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
        </div>
      </main>
    </Layout>
  );
}