import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout/Layout';
import AuctionGrid from '@/components/auctions/AuctionGrid';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function AuctionsPage() {
  const { user } = useAuth();
  const isDealer = user?.role === 'dealer';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Bids</h1>
              <p className="mt-1 text-sm text-gray-500">
                View all the bids you've placed on motorcycles.
              </p>
            </div>
            
            <Link href="/search-map">
              <Button>
                <Search className="mr-2 h-5 w-5" />
                Search Now
              </Button>
            </Link>
          </div>

          <AuctionGrid />
        </div>
      </div>
    </Layout>
  );
}
