import { Switch, Route, Link, useLocation } from "wouter";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AboutPage from "@/pages/about-page";
import AuthPage from "@/pages/auth-page";
import RegisterPage from "@/pages/register-page";
import VerifyEmailPage from "@/pages/verify-email";
import SubscriptionPage from "@/pages/subscription-page";
import DealerDashboard from "@/pages/dealer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
// Dealer dashboard handles both selling and buying functionality
import AuctionsPage from "@/pages/auctions-page";
import AuctionDetail from "@/pages/auction-detail";
import CreateAuction from "@/pages/create-auction";
import MapSearchPage from "@/pages/map-search-page";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth } from "./hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { WebSocketProvider } from "./hooks/use-websocket";
import { LogOut, UserCircle, Plus, TrendingUp, Menu, X } from "lucide-react";
import InstallPrompt from "./components/mobile/InstallPrompt";
import BottomNavigation from "./components/mobile/BottomNavigation";
import ChatWidget from "./components/chat/ChatWidget";

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
      
      {/* Stock viewing route - login required */}
      <ProtectedRoute path="/stock" component={AuctionsPage} />
      <ProtectedRoute path="/stock/:id" component={AuctionDetail} />
      
      {/* Protected routes */}
      {/* All users are dealers who can both sell and buy */}
      <ProtectedRoute path="/dashboard" component={DealerDashboard} />
      
      {/* Admin dashboard route */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/auctions" component={MapSearchPage} />
      <ProtectedRoute path="/underwrites" component={MapSearchPage} /> {/* Alias for /auctions */}
      <ProtectedRoute path="/auctions/:id" component={AuctionDetail} />
      <ProtectedRoute path="/underwrites/:id" component={AuctionDetail} /> {/* Alias for /auctions/:id */}
      <ProtectedRoute path="/create-auction" component={CreateAuction} />
      <ProtectedRoute path="/create-underwrite" component={CreateAuction} /> {/* Alias for /create-auction */}
      
      {/* Map and search routes */}
      <ProtectedRoute path="/search-map" component={MapSearchPage} />
      <ProtectedRoute path="/search-list" component={AuctionsPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Navigation component with authentication awareness
function MainNavigation() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/">
            <div className="text-2xl font-bold text-primary cursor-pointer">TradeBikes</div>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden flex items-center text-gray-600 dark:text-gray-300 hover:text-primary" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-4 items-center">
              <li>
                <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-primary">Home</Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-primary">About</Link>
              </li>

              
              {user ? (
                // Navigation for logged in users
                <>
                  <li>
                    <Link 
                      href="/dashboard" 
                      className="text-white bg-primary hover:bg-primary/90 rounded-md px-3 py-2 flex items-center"
                    >
                      <UserCircle className="w-4 h-4 mr-1" />
                      Dashboard
                    </Link>
                  </li>
                  
                  {/* Admin dashboard link - only show for admin users */}
                  {user.role === 'admin' && (
                    <li>
                      <Link 
                        href="/admin" 
                        className="text-white bg-red-600 hover:bg-red-700 rounded-md px-3 py-2 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/>
                          <path d="M19.5 10.5h-15a1.5 1.5 0 0 0 0 3h15a1.5 1.5 0 0 0 0-3Z"/>
                          <path d="M16.5 18h-9a1.5 1.5 0 0 0 0 3h9a1.5 1.5 0 0 0 0-3Z"/>
                        </svg>
                        Admin
                      </Link>
                    </li>
                  )}
                  
                  <li>
                    <Link 
                      href="/search-map" 
                      className="text-white bg-primary hover:bg-primary/90 rounded-md px-3 py-2 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="10" r="3"/>
                        <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8z"/>
                      </svg>
                      Search Stock
                    </Link>
                  </li>
                  
                  {/* All dealers can both list and bid */}
                  <li>
                    <Link 
                      href="/create-auction" 
                      className="text-white bg-primary hover:bg-primary/90 rounded-md px-3 py-2 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      List Motorcycle
                    </Link>
                  </li>
                  

                  
                  <li>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-600 dark:text-gray-300 hover:text-primary flex items-center" 
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Logout
                    </Button>
                  </li>
                </>
              ) : (
                // Navigation for guests
                <>
                  <li>
                    <Link 
                      href="/auth" 
                      className="text-white bg-primary hover:bg-primary-dark rounded-md px-3 py-2"
                    >
                      Login
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t dark:border-gray-800 mt-4">
            <nav>
              <ul className="space-y-3">
                <li>
                  <Link onClick={closeMobileMenu} href="/" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary">Home</Link>
                </li>
                <li>
                  <Link onClick={closeMobileMenu} href="/about" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary">About</Link>
                </li>

                
                {user ? (
                  // Mobile Navigation for logged in users
                  <>
                    {/* Highlight the List Motorcycle option */}
                    <li className="py-2">
                      <Link 
                        onClick={closeMobileMenu}
                        href="/create-auction" 
                        className="flex items-center justify-center py-3 text-white bg-primary hover:bg-primary/90 rounded-md"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        List Motorcycle
                      </Link>
                    </li>
                    

                    
                    <li>
                      <Link onClick={closeMobileMenu} href="/dashboard" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary flex items-center">
                        <UserCircle className="w-5 h-5 mr-2" />
                        Dashboard
                      </Link>
                    </li>
                    
                    {/* Admin dashboard link - only show for admin users */}
                    {user.role === 'admin' && (
                      <li>
                        <Link 
                          onClick={closeMobileMenu} 
                          href="/admin" 
                          className="block py-2 text-red-600 hover:text-red-700 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/>
                            <path d="M19.5 10.5h-15a1.5 1.5 0 0 0 0 3h15a1.5 1.5 0 0 0 0-3Z"/>
                            <path d="M16.5 18h-9a1.5 1.5 0 0 0 0 3h9a1.5 1.5 0 0 0 0-3Z"/>
                          </svg>
                          Admin Panel
                        </Link>
                      </li>
                    )}
                    
                    <li>
                      <Link onClick={closeMobileMenu} href="/search-map" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="10" r="3"/>
                          <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8z"/>
                        </svg>
                        Search Stock
                      </Link>
                    </li>
                    
                    <li>
                      <button 
                        className="w-full flex items-center py-2 text-gray-600 dark:text-gray-300 hover:text-primary" 
                        onClick={handleLogout}
                      >
                        <LogOut className="w-5 h-5 mr-2" />
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  // Mobile Navigation for not logged in users
                  <>
                    <li>
                      <Link 
                        onClick={closeMobileMenu}
                        href="/auth" 
                        className="block py-3 text-center text-white bg-primary hover:bg-primary-dark rounded-md"
                      >
                        Login
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// Import the theme provider
import { ThemeProvider } from "next-themes";

// App component with providers
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <AppContent />
            </TooltipProvider>
          </AuthProvider>
        </WebSocketProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

// Separate component to access auth context after it's provided
function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MainNavigation />
      <main className="flex-grow">
        <Router />
      </main>
      <InstallPrompt />
      {user && <BottomNavigation />}
      {/* ChatWidget now handled as standalone JS */}
    </div>
  );
}

// Version with chat widget added (May 18, 2025)
export default App;
