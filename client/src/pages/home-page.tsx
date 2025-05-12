import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { TradeBikesLogo } from "@/components/logo";

export default function HomePage() {
  const [_, navigate] = useLocation();

  // Temporarily disable redirection
  const { user } = useAuth();
  /* 
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  */

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold mb-4">Welcome to TradeBikes</h2>
          <p className="text-lg text-gray-600 mb-4">
            The B2B platform for trading used motorcycles
          </p>
        </div>

        {/* Hero Section */}
        <div className="bg-primary-light py-12 md:py-24 rounded-lg">
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

        {/* Just a small section to end the page */}
        <div className="py-16 text-center">
          <Button 
            size="lg" 
            variant="default" 
            asChild
          >
            <Link href="/auth">Sign Up Today</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
