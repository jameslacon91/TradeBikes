import { useState, useEffect } from "react";
import { Navigate } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Users, Bike, Bell, MessageSquare, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { User, Motorcycle, Auction } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dealers");

  // Navigate away if not an admin
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">TradeBikes Admin</h1>
          <div className="flex items-center gap-4">
            <span className="hidden md:block">Logged in as: {user.username}</span>
            <Badge variant="outline">Admin</Badge>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="dealers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="dealers" className="flex gap-2 items-center">
              <Users className="h-4 w-4" />
              <span>Dealers</span>
            </TabsTrigger>
            <TabsTrigger value="motorcycles" className="flex gap-2 items-center">
              <Bike className="h-4 w-4" />
              <span>Motorcycles</span>
            </TabsTrigger>
            <TabsTrigger value="auctions" className="flex gap-2 items-center">
              <Bell className="h-4 w-4" />
              <span>Auctions</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex gap-2 items-center">
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dealers">
            <DealersList />
          </TabsContent>

          <TabsContent value="motorcycles">
            <MotorcyclesList />
          </TabsContent>

          <TabsContent value="auctions">
            <AuctionsList />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DealersList() {
  const { data: dealers, isLoading, error } = useQuery({
    queryKey: ['/api/admin/dealers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/dealers');
      return response.json();
    }
  });

  if (isLoading) {
    return <LoadingState message="Loading dealers..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load dealers" error={error} />;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Dealers</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dealers?.length > 0 ? (
          dealers.map((dealer: User) => (
            <Card key={dealer.id} className="overflow-hidden">
              <CardHeader className="bg-muted pb-2">
                <CardTitle>{dealer.username}</CardTitle>
                <CardDescription>{dealer.companyName}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{dealer.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Role:</span>
                    <Badge>{dealer.role}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{dealer.phone || "Not provided"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Location:</span>
                    <span>{dealer.city || "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Joined:</span>
                    <span>{new Date(dealer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No dealers found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MotorcyclesList() {
  const { data: motorcycles, isLoading, error } = useQuery({
    queryKey: ['/api/admin/motorcycles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/motorcycles');
      return response.json();
    }
  });

  if (isLoading) {
    return <LoadingState message="Loading motorcycles..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load motorcycles" error={error} />;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Motorcycles</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {motorcycles?.length > 0 ? (
          motorcycles.map((motorcycle: Motorcycle) => (
            <Card key={motorcycle.id} className="overflow-hidden">
              <CardHeader className="bg-muted pb-2">
                <CardTitle>{motorcycle.year} {motorcycle.make} {motorcycle.model}</CardTitle>
                <CardDescription>
                  <Badge variant={motorcycle.status === 'available' ? 'default' : 
                                 motorcycle.status === 'pending' ? 'secondary' : 'outline'}>
                    {motorcycle.status}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {motorcycle.images && motorcycle.images.length > 0 && (
                  <div className="aspect-video overflow-hidden rounded-md mb-4">
                    <img 
                      src={motorcycle.images[0]} 
                      alt={`${motorcycle.make} ${motorcycle.model}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex flex-col space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Mileage:</span>
                    <span>{motorcycle.mileage.toLocaleString()} miles</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Engine:</span>
                    <span>{motorcycle.engineSize || "Not specified"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Color:</span>
                    <span>{motorcycle.color}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Condition:</span>
                    <span>{motorcycle.condition}</span>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No motorcycles found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AuctionsList() {
  const { data: auctions, isLoading, error } = useQuery({
    queryKey: ['/api/admin/auctions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/auctions');
      return response.json();
    }
  });

  if (isLoading) {
    return <LoadingState message="Loading auctions..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load auctions" error={error} />;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Auctions/Underwrites</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions?.length > 0 ? (
          auctions.map((auction: Auction) => (
            <Card key={auction.id} className="overflow-hidden">
              <CardHeader className="bg-muted pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>Auction #{auction.id}</CardTitle>
                  <Badge variant={auction.status === 'active' ? 'default' : 
                                 auction.status === 'pending' ? 'secondary' : 
                                 auction.status === 'completed' ? 'success' : 'outline'}>
                    {auction.status}
                  </Badge>
                </div>
                <CardDescription>
                  Motorcycle ID: {auction.motorcycleId}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Seller:</span>
                    <span>Dealer #{auction.dealerId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Started:</span>
                    <span>{new Date(auction.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Ends:</span>
                    <span>{new Date(auction.endTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Visibility:</span>
                    <span>{auction.visibilityType}</span>
                  </div>
                  {auction.bidAccepted && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Winner:</span>
                      <span>Dealer #{auction.winningBidderId}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No auctions found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MessagesList() {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-2">Messages Dashboard</h2>
      <p className="text-muted-foreground">Messages monitoring and management coming soon.</p>
    </div>
  );
}

function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function ErrorState({ message, error }: { message: string; error: Error }) {
  return (
    <div className="text-center py-12">
      <h3 className="text-xl font-semibold text-destructive mb-2">{message}</h3>
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  );
}