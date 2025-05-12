import { Bid } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { timeAgo } from '@/lib/countdownTimer';

interface BidHistoryProps {
  auctionId: number;
  currentBid?: number;
}

export default function BidHistory({ auctionId, currentBid }: BidHistoryProps) {
  const { data: bids = [], isLoading } = useQuery<Bid[]>({
    queryKey: [`/api/bids/auction/${auctionId}`],
  });

  // Sort bids by amount (highest first)
  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);

  if (isLoading) {
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Bid History</h4>
        <div className="h-36 flex items-center justify-center border border-gray-200 rounded-md">
          <div className="text-sm text-gray-500">Loading bid history...</div>
        </div>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Bid History</h4>
        <div className="h-36 flex items-center justify-center border border-gray-200 rounded-md">
          <div className="text-sm text-gray-500">No bids yet. Be the first to bid!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-500 mb-2">Bid History</h4>
      <div className="overflow-hidden overflow-y-auto max-h-36 border border-gray-200 rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trader</th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bid</th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedBids.map((bid) => (
              <tr key={bid.id} className={bid.amount === currentBid ? "bg-green-50" : ""}>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">Trader #{bid.traderId}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 text-right">£{bid.amount.toLocaleString()}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 text-right">{bid.createdAt ? timeAgo(new Date(bid.createdAt)) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}