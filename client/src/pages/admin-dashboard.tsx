import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dealers");
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
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Manage dealers, motorcycles, auctions, and messages.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="dealers">Dealers</TabsTrigger>
          <TabsTrigger value="motorcycles">Motorcycles</TabsTrigger>
          <TabsTrigger value="auctions">Listings</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="dealers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Dealers</CardTitle>
              <CardDescription>
                List of all registered dealers in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DealersList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motorcycles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Motorcycles</CardTitle>
              <CardDescription>
                List of all motorcycles in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MotorcyclesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auctions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Listings</CardTitle>
              <CardDescription>
                List of all listings (active, ended, and pending collection)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuctionsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Messages</CardTitle>
              <CardDescription>
                List of all messages between dealers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MessagesList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DealersList() {
  const { data: dealers, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/admin/dealers"],
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message="Failed to load dealers" error={error} />;
  }

  if (!dealers || dealers.length === 0) {
    return <div className="py-4">No dealers found in the system.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Username
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Company Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Role
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Email
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {dealers.map((dealer: User) => (
            <tr key={dealer.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {dealer.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {dealer.username}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {dealer.companyName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Badge variant={dealer.role === "admin" ? "destructive" : "default"}>
                  {dealer.role}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {dealer.email || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MotorcyclesList() {
  const { data: motorcycles, isLoading, error } = useQuery<Motorcycle[]>({
    queryKey: ["/api/admin/motorcycles"],
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message="Failed to load motorcycles" error={error} />;
  }

  if (!motorcycles || motorcycles.length === 0) {
    return <div className="py-4">No motorcycles found in the system.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Make
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Model
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Year
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Dealer ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {motorcycles.map((motorcycle: Motorcycle) => (
            <tr key={motorcycle.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {motorcycle.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {motorcycle.make}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {motorcycle.model}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {motorcycle.year}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {motorcycle.dealerId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Badge variant={motorcycle.status === "available" ? "success" : motorcycle.status === "sold" ? "secondary" : "outline"}>
                  {motorcycle.status || "N/A"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuctionsList() {
  const { data: auctions, isLoading, error } = useQuery<Auction[]>({
    queryKey: ["/api/admin/auctions"],
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message="Failed to load listings" error={error} />;
  }

  if (!auctions || auctions.length === 0) {
    return <div className="py-4">No listings found in the system.</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "ended":
        return <Badge variant="secondary">Ended</Badge>;
      case "pending_collection":
        return <Badge variant="warning">Pending Collection</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "no_sale":
        return <Badge variant="outline">No Sale</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Motorcycle ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Seller ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Start Time
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              End Time
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {auctions.map((auction: Auction) => (
            <tr key={auction.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {auction.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {auction.motorcycleId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {auction.dealerId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {format(new Date(auction.startTime), "dd MMM yyyy HH:mm")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {format(new Date(auction.endTime), "dd MMM yyyy HH:mm")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {getStatusBadge(auction.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MessagesList() {
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["/api/admin/messages"],
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message="Failed to load messages" error={error} />;
  }

  if (!messages || messages.length === 0) {
    return <div className="py-4">No messages found in the system.</div>;
  }

  return (
    <div className="space-y-4">
      {messages.map((message: any) => (
        <Card key={message.id} className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle className="text-sm font-medium">
                From: User #{message.senderId} 
                <span className="mx-2">→</span> 
                To: User #{message.receiverId}
              </CardTitle>
              <Badge variant={message.read ? "outline" : "secondary"}>
                {message.read ? "Read" : "Unread"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {format(new Date(message.createdAt), "dd MMM yyyy HH:mm")}
              {message.auctionId && <span> • Regarding Listing #{message.auctionId}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{message.content}</p>
          </CardContent>
        </Card>
      ))}
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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">{message}</h3>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  );
}