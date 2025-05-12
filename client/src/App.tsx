import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DealerDashboard from "@/pages/dealer-dashboard";
import TraderDashboard from "@/pages/trader-dashboard";
import AuctionsPage from "@/pages/auctions-page";
import AuctionDetail from "@/pages/auction-detail";
import CreateAuction from "@/pages/create-auction";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth } from "./hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { WebSocketProvider } from "./hooks/use-websocket";

// The main router component
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/dashboard" component={() => {
        const { user } = useAuth();
        return user?.role === 'dealer' ? <DealerDashboard /> : <TraderDashboard />;
      }} />
      
      <ProtectedRoute path="/auctions" component={AuctionsPage} />
      <ProtectedRoute path="/auctions/:id" component={AuctionDetail} />
      <ProtectedRoute path="/create-auction" component={CreateAuction} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Base App component with providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
