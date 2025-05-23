import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { Motorcycle } from "@shared/schema"; 
import { Auction } from "@shared/schema";
import { Loader2, AlertTriangle, ArrowLeft, Users, Building2, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

interface DealerStats {
  activeListings: number;
  pendingCollection: number;
  completedDeals: number;
  totalBids: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [selectedDealer, setSelectedDealer] = useState<User | null>(null);
  const { toast } = useToast();

  // Redirect non-admin users
  if (user && user.role !== "admin") {
    toast({
      title: "Access Denied",
      description: "You do not have permission to access the admin dashboard.",
      variant: "destructive",
    });
    return <Redirect to="/dashboard" />;
  }

  // If still checking auth status, show loading
  if (!user) {
    return <LoadingState message="Checking authentication..." />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        {selectedDealer && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedDealer(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Dealers
          </Button>
        )}
        <h1 className="text-3xl font-bold">
          {selectedDealer ? `${selectedDealer.companyName || selectedDealer.username} Details` : "Admin Dashboard"}
        </h1>
      </div>

      {!selectedDealer ? (
        <DealersOverview onSelectDealer={setSelectedDealer} />
      ) : (
        <DealerDetails dealer={selectedDealer} />
      )}
    </div>
  );
}

function DealersOverview({ onSelectDealer }: { onSelectDealer: (dealer: User) => void }) {
  const { data: dealers, isLoading: dealersLoading, error: dealersError } = useQuery<User[]>({
    queryKey: ["/api/admin/dealers"],
  });

  const { data: motorcycles, isLoading: motorcyclesLoading } = useQuery<Motorcycle[]>({
    queryKey: ["/api/admin/motorcycles"],
  });

  const { data: auctions, isLoading: auctionsLoading } = useQuery<Auction[]>({
    queryKey: ["/api/admin/auctions"],
  });

  if (dealersLoading) {
    return <LoadingState message="Loading dealers..." />;
  }

  if (dealersError) {
    return <ErrorState message="Failed to load dealers" />;
  }

  const getDealerStats = (dealer: User): DealerStats => {
    const dealerMotorcycles = motorcycles?.filter(m => m.dealerId === dealer.id) || [];
    const dealerAuctions = auctions?.filter(a => 
      dealerMotorcycles.some(m => m.id === a.motorcycleId)
    ) || [];

    return {
      activeListings: dealerAuctions.filter(a => a.status === 'active').length,
      pendingCollection: dealerAuctions.filter(a => a.status === 'pending_collection').length,
      completedDeals: dealerAuctions.filter(a => a.status === 'completed').length,
      totalBids: dealerAuctions.length, // Using auction count as proxy for bids
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dealers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealers?.filter(d => d.role === 'dealer').length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auctions?.filter(a => a.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Collection</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auctions?.filter(a => a.status === 'pending_collection').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auctions?.filter(a => a.status === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Registered Dealers</CardTitle>
          <CardDescription>
            Click on a dealer to view their detailed activity and listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dealersLoading || motorcyclesLoading || auctionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {dealers?.filter(dealer => dealer.role === 'dealer').map((dealer) => {
                const stats = getDealerStats(dealer);
                return (
                  <Card 
                    key={dealer.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onSelectDealer(dealer)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {dealer.companyName || dealer.username}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Username: {dealer.username} | Email: {dealer.email}
                          </p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-blue-600">{stats.activeListings}</div>
                            <div className="text-muted-foreground">Active</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-orange-600">{stats.pendingCollection}</div>
                            <div className="text-muted-foreground">Pending</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-green-600">{stats.completedDeals}</div>
                            <div className="text-muted-foreground">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-purple-600">{stats.totalBids}</div>
                            <div className="text-muted-foreground">Total Listings</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {dealers?.filter(dealer => dealer.role === 'dealer').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No dealers registered yet
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DealerDetails({ dealer }: { dealer: User }) {
  const { data: motorcycles, isLoading: motorcyclesLoading } = useQuery<Motorcycle[]>({
    queryKey: ["/api/admin/motorcycles"],
  });

  const { data: auctions, isLoading: auctionsLoading } = useQuery<Auction[]>({
    queryKey: ["/api/admin/auctions"],
  });

  const dealerMotorcycles = motorcycles?.filter(m => m.dealerId === dealer.id) || [];
  const dealerAuctions = auctions?.filter(a => 
    dealerMotorcycles.some(m => m.id === a.motorcycleId)
  ) || [];

  const activeAuctions = dealerAuctions.filter(a => a.status === 'active');
  const pendingAuctions = dealerAuctions.filter(a => a.status === 'pending_collection');
  const completedAuctions = dealerAuctions.filter(a => a.status === 'completed');

  if (motorcyclesLoading || auctionsLoading) {
    return <LoadingState message="Loading dealer details..." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dealer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Company Name</label>
              <p className="text-lg">{dealer.companyName || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <p className="text-lg">{dealer.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-lg">{dealer.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <Badge variant="secondary">{dealer.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active Listings ({activeAuctions.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Collection ({pendingAuctions.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed Deals ({completedAuctions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <AuctionsList auctions={activeAuctions} motorcycles={dealerMotorcycles} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <AuctionsList auctions={pendingAuctions} motorcycles={dealerMotorcycles} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <AuctionsList auctions={completedAuctions} motorcycles={dealerMotorcycles} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuctionsList({ auctions, motorcycles }: { auctions: Auction[], motorcycles: Motorcycle[] }) {
  if (auctions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No listings in this category
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {auctions.map((auction) => {
        const motorcycle = motorcycles.find(m => m.id === auction.motorcycleId);
        if (!motorcycle) return null;

        return (
          <Card key={auction.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {motorcycle.year} {motorcycle.make} {motorcycle.model}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Mileage: {motorcycle.mileage?.toLocaleString()} | 
                    Engine: {motorcycle.engineSize || 'Not specified'}
                  </p>
                  {auction.endTime && (
                    <p className="text-sm text-muted-foreground">
                      Ends: {format(new Date(auction.endTime), "PPP 'at' p")}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Badge 
                    variant={
                      auction.status === 'active' ? 'default' :
                      auction.status === 'pending_collection' ? 'secondary' :
                      'outline'
                    }
                  >
                    {auction.status.replace('_', ' ')}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Auction #{auction.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Helper components for loading and error states
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin mr-2" />
      <span>{message}</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-red-500">
      <AlertTriangle className="h-8 w-8 mr-2" />
      <span>{message}</span>
    </div>
  );
}