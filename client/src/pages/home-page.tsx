export default function HomePage() {
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            TradeBikes
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            The B2B platform for trading used motorcycles
          </p>
        </div>

        <div className="mt-12 bg-blue-100 rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Revolutionizing motorcycle trading
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A modern platform connecting dealers and traders
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">Live Auctions</h3>
            <p className="mt-2 text-gray-600">
              Bid in real-time on available motorcycles
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">Secure Transactions</h3>
            <p className="mt-2 text-gray-600">
              Safely complete trades with our platform
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">Verified Listings</h3>
            <p className="mt-2 text-gray-600">
              All motorcycles undergo verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}