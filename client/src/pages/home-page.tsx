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
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary to-primary">
        {/* Background pattern overlay for better contrast */}
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 border-4 border-white rounded-full"></div>
        </div>
        
        <div className="container relative z-10 mx-auto px-4 py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-4 bg-primary/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg">
              <p className="text-white font-medium tracking-wide uppercase text-sm">B2B Motorcycle Trading Platform</p>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Revolutionizing <span className="text-accent">Motorcycle Trading</span>
            </h1>
            
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl shadow-xl mb-8">
              <p className="text-xl text-white leading-relaxed">
                TradeBikes is the modern way to trade used motorcycles between dealerships and traders with real-time auctions.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8">
                  Register Now
                </Button>
              </Link>
            </div>
            
            <p className="mt-6 text-white text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
              Free 1-month trial • £125/month + VAT thereafter • No credit card required
            </p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Why Choose TradeBikes?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform offers a streamlined approach to motorcycle trading with powerful features designed for dealers and traders.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="group relative bg-card p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary to-primary-dark p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-md group-hover:-translate-y-1 transition-transform duration-300">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">Real-time Auctions</h3>
                <p className="text-muted-foreground mb-4">
                  Bid in real-time on available motorcycles with live updates and instant notifications when you're outbid.
                </p>
                <Link href="/auctions" className="text-primary font-medium inline-flex items-center group-hover:translate-x-2 transition-transform duration-300">
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
            
            <div className="group relative bg-card p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary to-primary-dark p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-md group-hover:-translate-y-1 transition-transform duration-300">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">Map Search</h3>
                <p className="text-muted-foreground mb-4">
                  Find available motorcycles based on your location and preferred radius for convenient trading and logistics.
                </p>
                <Link href="/map" className="text-primary font-medium inline-flex items-center group-hover:translate-x-2 transition-transform duration-300">
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
            
            <div className="group relative bg-card p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary to-primary-dark p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-md group-hover:-translate-y-1 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">Verified Listings</h3>
                <p className="text-muted-foreground mb-4">
                  All motorcycles undergo verification checks to ensure quality and accurate information for confident bidding.
                </p>
                <Link href="/about" className="text-primary font-medium inline-flex items-center group-hover:translate-x-2 transition-transform duration-300">
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute left-0 top-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mt-32"></div>
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mb-48"></div>
        </div>
      
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Getting started with TradeBikes is simple. Follow these steps to begin trading motorcycles efficiently.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row max-w-5xl mx-auto">
            <div className="flex-1 relative mb-16 md:mb-0">
              {/* Step 1 */}
              <div className="relative flex items-start mb-12">
                <div className="min-w-[80px] mr-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-lg flex items-center justify-center text-2xl font-bold">1</div>
                    {/* Connector line */}
                    <div className="absolute top-full left-1/2 w-1 bg-gray-200 h-16 -translate-x-1/2 mt-4 hidden md:block"></div>
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold mb-3 text-foreground">Register Your Company</h3>
                  <p className="text-muted-foreground">
                    Create your account and specify your role as a dealer or trader. We'll verify your business details to ensure platform security.
                  </p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="relative flex items-start mb-12">
                <div className="min-w-[80px] mr-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-lg flex items-center justify-center text-2xl font-bold">2</div>
                    {/* Connector line */}
                    <div className="absolute top-full left-1/2 w-1 bg-gray-200 h-16 -translate-x-1/2 mt-4 hidden md:block"></div>
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold mb-3 text-foreground">List or Bid on Motorcycles</h3>
                  <p className="text-muted-foreground">
                    Dealers can list motorcycles with detailed information and up to 20 high-quality photos. Traders can browse auctions and place bids in real-time.
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="relative flex items-start">
                <div className="min-w-[80px] mr-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-lg flex items-center justify-center text-2xl font-bold">3</div>
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold mb-3 text-foreground">Complete Transactions</h3>
                  <p className="text-muted-foreground">
                    Once an auction ends, both parties are notified and can securely exchange payment and arrange delivery through our platform's messaging system.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="md:flex-1">
              <div className="bg-primary-dark rounded-2xl shadow-xl overflow-hidden relative h-[500px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bike className="h-32 w-32 text-primary-foreground/10" strokeWidth={1} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                  <p className="text-sm text-amber-300 font-medium mb-2">READY TO GET STARTED?</p>
                  <h3 className="text-2xl font-bold text-white mb-4">Join hundreds of dealers and traders on TradeBikes</h3>
                  <Link href="/register">
                    <Button className="bg-white text-primary hover:bg-gray-100">
                      Register Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Types */}
      <div className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Built For Both Buyers & Sellers</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform offers tailored features for both sides of the motorcycle trading ecosystem.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* For Dealers */}
              <div className="bg-card p-10 rounded-3xl shadow-xl border border-border relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 -mr-20 -mt-20 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 -ml-12 -mb-12 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                
                <div className="relative">
                  <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                    </div>
                    <span className="font-medium text-primary">For Sellers</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-6">Sell Your Motorcycles Faster</h3>
                  
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">Easy motorcycle listing with up to 20 images per listing</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">Set flexible auction durations from 15 minutes to 24 hours</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">Instant notifications for new bids and auction results</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">Comprehensive dashboard to manage all listings</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">Trader ratings to ensure quality transactions</span>
                    </li>
                  </ul>
                  
                  <Link href="/auth">
                    <Button className="bg-primary hover:bg-primary-dark text-white w-full md:w-auto transition-all duration-300 shadow-md hover:shadow-lg">
                      Register Now
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* For Traders */}
              <div className="bg-card p-10 rounded-3xl shadow-xl border border-border relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 -mr-20 -mt-20 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 -ml-12 -mb-12 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                
                <div className="relative">
                  <div className="inline-flex items-center px-4 py-2 bg-amber-500/10 rounded-full mb-6">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium text-amber-600">For Buyers</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-6">Find the Best Motorcycles</h3>
                  
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">Browse all available motorcycles with advanced filters</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">Real-time bidding with countdown timers</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">Location-based search to find motorcycles nearby</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">Save searches and get alerts for new listings</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">Rate dealers after completed transactions</span>
                    </li>
                  </ul>
                  
                  <Link href="/auth">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white w-full md:w-auto transition-all duration-300 shadow-md hover:shadow-lg">
                      Register Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#1a3469] py-24">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 z-0">
          <svg 
            className="absolute right-0 top-0 w-full h-full opacity-10"
            viewBox="0 0 678 600" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="75" cy="75" r="100" fill="white" />
            <circle cx="540" cy="400" r="200" fill="white" />
            <path d="M320,50 Q400,350 200,450 T450,550" stroke="white" strokeWidth="10" fill="none" />
          </svg>
        </div>
        
        <div className="container relative z-10 mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full">
              <p className="text-white text-sm font-medium tracking-wide">LIMITED TIME OFFER</p>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Motorcycle Trading?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join TradeBikes today and experience a faster, more efficient way to buy and sell used motorcycles.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 md:p-10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="font-bold text-2xl text-white mb-2">Basic Subscription</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-bold text-white">£125</span>
                  <span className="ml-1 text-white/70">/month + VAT</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-amber-300 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white">Unlimited listings</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-amber-300 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white">Real-time bidding</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-amber-300 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white">1-month free trial</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between md:justify-end space-x-4 mb-8">
                  <p className="text-white text-sm">No setup fees</p>
                  <div className="h-4 border-l border-white/20"></div>
                  <p className="text-white text-sm">Cancel anytime</p>
                </div>
                <div className="flex flex-col space-y-4">
                  <Link href="/register" className="w-full">
                    <Button size="lg" className="w-full bg-white text-primary hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/about" className="w-full">
                    <Button size="lg" variant="outline" className="w-full text-white border-white hover:bg-white/10 transition-all duration-300">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}