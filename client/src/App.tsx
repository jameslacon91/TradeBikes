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

function Router() {
  const { user } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/dashboard" component={
        user?.role === 'dealer' ? DealerDashboard : TraderDashboard
      } />
      
      <ProtectedRoute path="/auctions" component={AuctionsPage} />
      <ProtectedRoute path="/auctions/:id" component={AuctionDetail} />
      <ProtectedRoute path="/create-auction" component={CreateAuction} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
