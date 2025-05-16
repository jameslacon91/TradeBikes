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
    <div className={`card motorcycle-shadow transition-all rounded-lg overflow-hidden cursor-pointer active:opacity-90 ${className}`}>
      <div className={`p-4 sm:p-5 ${bgColor} text-white relative`}>
        {/* Chrome-like top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/40 to-transparent"></div>
        
        <div className="flex justify-between items-start">
          <h2 className="font-semibold text-white text-base sm:text-lg">{title}</h2>
          <div className="text-white/90 rounded-full p-2 bg-white/10 backdrop-blur-sm">
            {icon}
          </div>
        </div>
        
        <div className="mt-3 sm:mt-4 flex items-end justify-between">
          <div className="speedometer">
            <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="text-xs sm:text-sm opacity-80 mt-1">{subtitle}</p>
            )}
          </div>
          
          {trend && (
            <div className={`badge badge-lg ${trend.up ? 'bg-success text-success-content' : 'bg-error text-error-content'} flex items-center gap-1 shadow-md`}>
              {trend.up ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        
        {/* Bottom decorative speedometer line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20"></div>
      </div>
    </div>
  );
}