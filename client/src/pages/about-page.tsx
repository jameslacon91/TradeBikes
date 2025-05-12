import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <Layout>
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">About TradeBikes</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Modernizing the way used motorcycles are traded between dealerships and traders
          </p>
        </div>

        {/* Our Story */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Story</h2>
              <p className="mb-4">
                TradeBikes was founded by a team of motorcycle enthusiasts who saw the need to modernize the way used motorcycles are traded in the B2B market.
              </p>
              <p className="mb-4">
                Traditional physical auctions and private sales channels were inefficient, costly, and offered limited reach. We believed there had to be a better way to connect dealers with traders.
              </p>
              <p>
                In 2022, we launched TradeBikes as a digital platform that facilitates real-time trading of used motorcycles, offering transparency, efficiency, and competitive pricing for both dealers and traders.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1558981852-426c6c22a060" 
                alt="Motorcycle showroom" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Our Mission */}
        <div className="bg-primary-light rounded-2xl p-8 md:p-12 text-white mb-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl">
              "To create the most efficient, transparent marketplace for motorcycle trading in the UK, saving time and maximizing value for both dealers and traders."
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How TradeBikes Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="h-12 w-12 bg-primary-light rounded-full flex items-center justify-center text-white mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">List Your Motorcycle</h3>
              <p className="text-muted-foreground">
                Dealers can easily list motorcycles with detailed specifications, high-quality photos, and set their desired pricing and auction duration.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="h-12 w-12 bg-primary-light rounded-full flex items-center justify-center text-white mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Bidding</h3>
              <p className="text-muted-foreground">
                Traders receive notifications of new listings, can browse available motorcycles, and place competitive bids in real-time.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="h-12 w-12 bg-primary-light rounded-full flex items-center justify-center text-white mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
              <p className="text-muted-foreground">
                Once an auction ends, both parties are notified and our platform facilitates the exchange of information to complete the transaction securely.
              </p>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col">
              <h3 className="font-semibold mb-2">Role-Based Access</h3>
              <p className="text-sm text-muted-foreground flex-grow">
                Separate dashboards and features for Dealers, Traders, and Administrators, each with tailored functionality
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col">
              <h3 className="font-semibold mb-2">Comprehensive Listings</h3>
              <p className="text-sm text-muted-foreground flex-grow">
                Create detailed motorcycle listings with registration details, full specifications, and up to 20 high-quality photos
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col">
              <h3 className="font-semibold mb-2">Real-Time Bidding</h3>
              <p className="text-sm text-muted-foreground flex-grow">
                Live auction system with built-in messaging between dealers and traders to facilitate negotiation
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col">
              <h3 className="font-semibold mb-2">Post-Sale Tracking</h3>
              <p className="text-sm text-muted-foreground flex-grow">
                Complete auction history and transaction management for both buyers and sellers
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col">
              <h3 className="font-semibold mb-2">Smart Notification System</h3>
              <p className="text-sm text-muted-foreground flex-grow">
                Customizable alerts for new listings, bids, messages, and auction completions to keep you informed
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col">
              <h3 className="font-semibold mb-2">Private Listings</h3>
              <p className="text-sm text-muted-foreground flex-grow">
                Option to create invitation-only auctions for select traders, perfect for special or high-value motorcycles
              </p>
            </div>
          </div>
        </div>
        
        {/* Pricing */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Subscription Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="col-span-1 lg:col-span-1">
              {/* Free Trial */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-8 h-full flex flex-col">
                <h3 className="text-xl font-bold mb-2">Free Trial</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">£0</span>
                  <span className="text-gray-500 ml-1">/ 14 days</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Experience all platform features with no commitment
                </p>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Full platform access</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Card-on-file required</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">No obligation</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register">Start Free Trial</Link>
                </Button>
              </div>
            </div>
            
            <div className="col-span-1 lg:col-span-1">
              {/* Basic Subscription */}
              <div className="bg-white rounded-lg border-2 border-primary p-8 h-full flex flex-col relative">
                <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
                <h3 className="text-xl font-bold mb-2">Basic Subscription</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">£125</span>
                  <span className="text-gray-500 ml-1">/ month + VAT</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Perfect for most dealers and traders
                </p>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Unlimited listings</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Real-time bidding</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Full notification system</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Basic reporting</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Email support</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/register">Subscribe Now</Link>
                </Button>
              </div>
            </div>
            
            <div className="col-span-1 lg:col-span-1">
              {/* Pro Tier (Coming soon) */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-8 h-full flex flex-col relative opacity-75">
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  COMING SOON
                </div>
                <h3 className="text-xl font-bold mb-2">Pro Subscription</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">Contact Sales</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Advanced features for power users
                </p>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">All Basic features</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Integrated HPI checks</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">ANPR integration</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">API data exports</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Platform Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Increased Efficiency</h3>
              <p className="text-sm text-muted-foreground">
                No more time wasted at physical auctions or managing multiple private inquiries
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Wider Market Reach</h3>
              <p className="text-sm text-muted-foreground">
                Connect with dealers and traders across the entire UK, expanding your network
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Transparent Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Real-time competitive bidding ensures fair market value for every motorcycle
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Access comprehensive data on market trends, pricing, and buyer preferences
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-4 overflow-hidden rounded-full mx-auto w-32 h-32">
                <img 
                  src="https://randomuser.me/api/portraits/men/32.jpg" 
                  alt="CEO" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold">Michael Thompson</h3>
              <p className="text-primary">Founder & CEO</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Former motorcycle dealer with 15+ years of industry experience
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 overflow-hidden rounded-full mx-auto w-32 h-32">
                <img 
                  src="https://randomuser.me/api/portraits/women/44.jpg" 
                  alt="CTO" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold">Sarah Williams</h3>
              <p className="text-primary">CTO</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tech entrepreneur with experience building marketplace platforms
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 overflow-hidden rounded-full mx-auto w-32 h-32">
                <img 
                  src="https://randomuser.me/api/portraits/men/67.jpg" 
                  alt="COO" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold">David Clarke</h3>
              <p className="text-primary">COO</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Operations specialist with background in automotive logistics
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Revolutionize Your Motorcycle Trading?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join hundreds of dealers and traders who are already benefiting from our modern trading platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/register">Register Now</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}