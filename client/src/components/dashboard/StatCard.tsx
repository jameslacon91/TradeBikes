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
    <div className={`card shadow-md hover:shadow-lg transition-all ${className}`}>
      <div className={`card-body p-5 ${bgColor} text-white`}>
        <div className="flex justify-between items-start">
          <h2 className="card-title font-semibold text-white">{title}</h2>
          <div className="text-white/90 badge badge-outline badge-lg">
            {icon}
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="text-sm opacity-80 mt-1">{subtitle}</p>
            )}
          </div>
          
          {trend && (
            <div className={`badge ${trend.up ? 'badge-success' : 'badge-error'} flex items-center gap-1`}>
              {trend.up ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}