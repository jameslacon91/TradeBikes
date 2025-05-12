import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AboutPage from "@/pages/about-page";
import AuthPage from "@/pages/auth-page";
import RegisterPage from "@/pages/register-page";
import VerifyEmailPage from "@/pages/verify-email";
import SubscriptionPage from "@/pages/subscription-page";
import DealerDashboard from "@/pages/dealer-dashboard";
import TraderDashboard from "@/pages/trader-dashboard";
import AuctionsPage from "@/pages/auctions-page";
import AuctionDetail from "@/pages/auction-detail";
import CreateAuction from "@/pages/create-auction";
import MapSearchPage from "@/pages/map-search-page";
import { Link } from "wouter";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth } from "./hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { WebSocketProvider } from "./hooks/use-websocket";

// Main router component
function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      
      {/* Stock viewing route - limited view without login */}
      <Route path="/stock" component={AuctionsPage} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={() => {
        const { user } = useAuth();
        if (!user) return null;
        return user.role === 'dealer' ? <DealerDashboard /> : <TraderDashboard />;
      }} />
      
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/auctions" component={AuctionsPage} />
      <ProtectedRoute path="/auctions/:id" component={AuctionDetail} />
      <ProtectedRoute path="/create-auction" component={CreateAuction} />
      
      {/* Map and search routes */}
      <ProtectedRoute path="/search-map" component={MapSearchPage} />
      <ProtectedRoute path="/search-list" component={AuctionsPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// App component with providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <div className="min-h-screen flex flex-col">
              <header className="border-b bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                  <Link href="/">
                    <div className="text-2xl font-bold text-primary cursor-pointer">TradeBikes</div>
                  </Link>
                  <nav>
                    <ul className="flex space-x-4">
                      <li>
                        <Link href="/">
                          <a className="text-gray-600 hover:text-primary">Home</a>
                        </Link>
                      </li>
                      <li>
                        <Link href="/about">
                          <a className="text-gray-600 hover:text-primary">About</a>
                        </Link>
                      </li>
                      <li>
                        <Link href="/stock">
                          <a className="text-gray-600 hover:text-primary">View Stock</a>
                        </Link>
                      </li>
                      <li>
                        <Link href="/auth">
                          <a className="text-gray-600 hover:text-primary">Login</a>
                        </Link>
                      </li>
                      <li>
                        <Link href="/register">
                          <a className="text-gray-600 hover:text-primary">Register</a>
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </header>
              <main className="flex-grow">
                <Router />
              </main>
              <footer className="bg-gray-100 py-6">
                <div className="container mx-auto px-4 text-center text-gray-600">
                  © {new Date().getFullYear()} TradeBikes. All rights reserved.
                </div>
              </footer>
            </div>
          </TooltipProvider>
        </AuthProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
