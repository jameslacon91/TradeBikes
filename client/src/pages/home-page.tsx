import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { TradeBikesLogo } from "@/components/logo";

export default function HomePage() {
  const [_, navigate] = useLocation();

  // Re-enable redirection for authenticated users
  const { user } = useAuth();
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <Layout>
      <div className="relative">
        {/* Hero Section */}
        <div className="bg-primary-light py-12 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-1/2 text-white">
                <div className="flex items-center mb-6">
                  <TradeBikesLogo className="h-12 w-auto mr-4" />
                  <h1 className="text-4xl font-bold">
                    Modernizing Used Motorcycle Trading
                  </h1>
                </div>
                <p className="text-xl mb-8">
                  TradeBikes is a B2B platform that replaces outdated methods with a
                  real-time, user-friendly solution for dealerships and traders.
                </p>
                <div className="space-x-4">
                  <Button 
                    size="lg" 
                    variant="secondary"
                    asChild
                  >
                    <Link href="/auth">Get Started</Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-transparent border-white text-white hover:bg-white hover:text-primary"
                    asChild
                  >
                    <Link href="#how-it-works">Learn More</Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
                  <img 
                    src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87" 
                    alt="Motorcycle auction platform preview" 
                    className="w-full h-60 object-cover rounded-md mb-4"
                  />
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="text-sm text-gray-500">Current Bid</p>
                        <p className="text-lg font-bold">£5,850</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time Left</p>
                        <p className="text-lg font-bold text-accent">01:23:45</p>
                      </div>
                    </div>
                    <Button className="w-full">Join Platform</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">How TradeBikes Works</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                Our platform streamlines the used motorcycle trading process for both dealers and traders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-12 w-12 bg-primary-light rounded-md flex items-center justify-center text-white mb-4">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">1. List Your Motorcycle</h3>
                <p className="text-gray-600">
                  Dealers can quickly upload motorcycle details, add photos, set pricing expectations, and choose auction duration.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-12 w-12 bg-primary-light rounded-md flex items-center justify-center text-white mb-4">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Real-Time Bidding</h3>
                <p className="text-gray-600">
                  Traders browse active auctions, place bids, and receive instant notifications as auctions progress.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-12 w-12 bg-primary-light rounded-md flex items-center justify-center text-white mb-4">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Complete the Sale</h3>
                <p className="text-gray-600">
                  When an auction ends, both parties are notified, and our platform facilitates the transaction details securely.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Roles */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Made for Both Sides of the Trade</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                Whether you're a dealership looking to sell or a trader looking to buy, TradeBikes has features designed specifically for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Dealers */}
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-primary mb-4">For Dealers</h3>
                <ul className="space-y-3">
                  <li className="flex">
                    <svg className="h-6 w-6 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Simple motorcycle upload with detailed specifications</span>
                  </li>
                  <li className="flex">
                    <svg className="h-6 w-6 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Flexible auction time settings (15 mins to 24 hours)</span>
                  </li>
                  <li className="flex">
                    <svg className="h-6 w-6 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Real-time bid notifications and auction monitoring</span>
                  </li>
                  <li className="flex">
                    <svg className="h-6 w-6 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Comprehensive dashboard to manage listings and history</span>
                  </li>
                </ul>
                <Button className="mt-6" asChild>
                  <Link href="/auth">Register as a Dealer</Link>
                </Button>
              </div>

              {/* Traders */}
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-accent mb-4">For Traders</h3>
                <ul className="space-y-3">
                  <li className="flex">
                    <svg className="h-6 w-6 text-accent mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Browse all active auctions with powerful filters</span>
                  </li>
                  <li className="flex">
                    <svg className="h-6 w-6 text-accent mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Place live bids with real-time countdown timers</span>
                  </li>
                  <li className="flex">
                    <svg className="h-6 w-6 text-accent mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save searches and get alerts for matching motorcycles</span>
                  </li>
                  <li className="flex">
                    <svg className="h-6 w-6 text-accent mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Direct messaging with dealers for transaction details</span>
                  </li>
                </ul>
                <Button className="mt-6 bg-accent hover:bg-accent-dark" asChild>
                  <Link href="/auth">Register as a Trader</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Modernize Your Motorcycle Trading?</h2>
            <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
              Join TradeBikes today and experience the future of used motorcycle trading between dealers and traders.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-primary hover:bg-gray-100"
              asChild
            >
              <Link href="/auth">Get Started Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
