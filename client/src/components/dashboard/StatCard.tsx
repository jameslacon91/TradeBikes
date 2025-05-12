import { ReactNode } from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  bgColor: string;
  trend?: {
    up: boolean;
    value: number;
  };
  className?: string;
}

export default function StatCard({ title, value, icon, bgColor, trend, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${bgColor} rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {trend && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${trend.up ? 'text-green-600' : 'text-red-600'}`}>
                  <svg 
                    className={`self-center flex-shrink-0 h-5 w-5 ${trend.up ? 'text-green-500' : 'text-red-500'}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d={trend.up 
                        ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" 
                        : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"} 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span className="sr-only">{trend.up ? 'Increased by' : 'Decreased by'}</span>
                  {trend.value}
                </div>
              )}
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
}
