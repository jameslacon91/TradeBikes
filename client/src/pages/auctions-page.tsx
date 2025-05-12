import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout/Layout';
import AuctionGrid from '@/components/auctions/AuctionGrid';
import { Button } from '@/components/ui/button';

export default function AuctionsPage() {
  const { user } = useAuth();
  const isDealer = user?.role === 'dealer';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Underwrites</h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse and bid on motorcycles currently available for underwriting.
              </p>
            </div>
            
            {isDealer && (
              <Link href="/create-auction">
                <Button>
                  <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Underwrite
                </Button>
              </Link>
            )}
          </div>

          <AuctionGrid />
        </div>
      </div>
    </Layout>
  );
}
