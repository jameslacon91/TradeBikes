import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Simplified router component
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Simplified App component with minimal providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold text-primary">TradeBikes</div>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <a href="/" className="text-gray-600 hover:text-primary">Home</a>
                </li>
                <li>
                  <a href="/about" className="text-gray-600 hover:text-primary">About</a>
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
    </QueryClientProvider>
  );
}

export default App;
