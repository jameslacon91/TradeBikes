import { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  bgColor: string;
  trend?: {
    up: boolean;
    value: number;
  };
  subtitle?: string;
  className?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  bgColor, 
  trend, 
  subtitle,
  className = "" 
}: StatCardProps) {
  return (
    <div className={`rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className={`p-4 ${bgColor}`}>
        <div className="flex justify-between">
          <span className="text-white font-medium">{title}</span>
          <div className="text-white/80">
            {icon}
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="text-sm text-white/80 mt-1">{subtitle}</p>
            )}
          </div>
          
          {trend && (
            <div className={`flex items-center text-sm ${trend.up ? 'text-green-100' : 'text-red-100'}`}>
              {trend.up ? (
                <ArrowUp className="h-4 w-4 mr-0.5" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-0.5" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}