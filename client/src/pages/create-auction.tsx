import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import Layout from '@/components/layout/Layout';
import BikeUploadForm from '@/components/forms/BikeUploadForm';

export default function CreateAuction() { // Component name kept as-is for compatibility
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // Only dealers can create underwrites
  useEffect(() => {
    if (user && user.role !== 'dealer') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">List a New Motorcycle</h1>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the details below to create a new underwrite listing for your motorcycle.
            </p>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="p-6">
              <BikeUploadForm />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
