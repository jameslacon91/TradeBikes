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
import RegisterPage from "@/pages/register-page";
import VerifyEmailPage from "@/pages/verify-email";
import SubscriptionPage from "@/pages/subscription-page";
import AboutPage from "@/pages/about-page";
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
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/about" component={AboutPage} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={() => {
        const { user } = useAuth();
        if (!user) return null; // Handle case when user might be null
        return user.role === 'dealer' ? <DealerDashboard /> : <TraderDashboard />;
      }} />
      
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/auctions" component={AuctionsPage} />
      <ProtectedRoute path="/auctions/:id" component={AuctionDetail} />
      <ProtectedRoute path="/create-auction" component={CreateAuction} />
      
      {/* Stock viewing route - can be accessed without login */}
      <Route path="/stock" component={AuctionsPage} />
      
      {/* Account related routes */}
      <ProtectedRoute path="/account" component={() => {
        const { user } = useAuth();
        if (!user) return null; // Handle case when user might be null
        return user.role === 'dealer' ? <DealerDashboard /> : <TraderDashboard />;
      }} />
      
      {/* Map and search routes */}
      <ProtectedRoute path="/search-map" component={AuctionsPage} />
      <ProtectedRoute path="/search-list" component={AuctionsPage} />
      
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
