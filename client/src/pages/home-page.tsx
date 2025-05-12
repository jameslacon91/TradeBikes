import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  SearchIcon, 
  Bike, 
  Clock, 
  Bell, 
  Shield, 
  MapPin,
  TrendingUp
} from "lucide-react";
import Layout from "@/components/layout/Layout";

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Revolutionizing Motorcycle Trading
              </h1>
              <p className="text-xl text-white/90 mb-8">
                TradeBikes is a B2B platform that modernizes the way used motorcycles are traded between dealerships and traders.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                    Register Now
                  </Button>
                </Link>
                <Link href="/stock">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                    View Current Stock
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="aspect-video bg-gray-100 rounded-md mb-4 flex items-center justify-center">
                  <Bike className="h-24 w-24 text-gray-400"/>
                </div>
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Bid</p>
                    <p className="text-lg font-bold">£5,850</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time Left</p>
                    <p className="text-lg font-bold text-red-500">01:23:45</p>
                  </div>
                </div>
                <Button className="w-full" size="lg">
                  Join Auction
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose TradeBikes?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Auctions</h3>
              <p className="text-gray-600">
                Bid in real-time on available motorcycles with live updates and instant notifications.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Map Search</h3>
              <p className="text-gray-600">
                Find available motorcycles based on your location and preferred radius for convenient trading.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Listings</h3>
              <p className="text-gray-600">
                All motorcycles undergo verification checks to ensure quality and accurate information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2">Register Your Company</h3>
              <p className="text-gray-600">
                Sign up as a dealer or trader with your business details.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2">List or Bid on Motorcycles</h3>
              <p className="text-gray-600">
                Dealers list motorcycles, traders place bids in real-time.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2">Complete Transactions</h3>
              <p className="text-gray-600">
                Connect with buyer/seller and finalize the transaction securely.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Types */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Built For Both Dealers & Traders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-bold mb-4 text-primary">For Dealers</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-green-500">✓</span>
                  <span>Easy motorcycle listing with full details and images</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-green-500">✓</span>
                  <span>Set auction duration from 15 minutes to 24 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-green-500">✓</span>
                  <span>Instant notifications for new bids and auction results</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-green-500">✓</span>
                  <span>Comprehensive dashboard to manage all listings</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-green-500">✓</span>
                  <span>Trader ratings to ensure quality transactions</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/register">
                  <Button>Register as Dealer</Button>
                </Link>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-bold mb-4 text-primary">For Traders</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-green-500">✓</span>
                  <span>Browse all available motorcycles with advanced filters</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-green-500">✓</span>
                  <span>Real-time bidding with countdown timers</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-green-500">✓</span>
                  <span>Location-based search to find motorcycles nearby</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-green-500">✓</span>
                  <span>Save searches and get alerts for new listings</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-green-500">✓</span>
                  <span>Rate dealers after completed transactions</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/register">
                  <Button>Register as Trader</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Motorcycle Trading?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join TradeBikes today and experience a faster, more efficient way to buy and sell used motorcycles.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                Register Now
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
          <p className="text-white/80 mt-6">
            £149 monthly subscription for unlimited purchases and sales
          </p>
        </div>
      </div>
    </Layout>
  );
}