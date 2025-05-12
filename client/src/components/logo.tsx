export function TradeBikesLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Main circular background */}
      <circle cx="50" cy="50" r="45" fill="#3B82F6" />
      
      {/* Motorcycle silhouette */}
      <g fill="white">
        {/* Motorcycle body */}
        <path d="M25 60 L60 60 L70 45 L45 45 L25 60Z" />
        
        {/* Handlebars */}
        <path d="M70 45 L75 40 L80 45 L75 50 Z" />
        
        {/* Wheels */}
        <circle cx="30" cy="70" r="12" fillOpacity="0.7" />
        <circle cx="70" cy="70" r="12" fillOpacity="0.7" />
        <circle cx="30" cy="70" r="8" fill="#3B82F6" />
        <circle cx="70" cy="70" r="8" fill="#3B82F6" />
        <circle cx="30" cy="70" r="4" fill="white" />
        <circle cx="70" cy="70" r="4" fill="white" />
        
        {/* Seat */}
        <rect x="50" y="45" width="15" height="5" rx="2" />
        
        {/* Small decorative elements */}
        <circle cx="75" cy="45" r="2" />
        <rect x="35" y="30" width="30" height="6" rx="3" />
      </g>
      
      {/* Auction/trade symbol */}
      <g fill="white">
        <path d="M45 25 L55 25 L60 35 L40 35 Z" />
        <path d="M30 25 L40 25 L40 20 L30 20 Z" fillOpacity="0.7" />
        <path d="M60 25 L70 25 L70 20 L60 20 Z" fillOpacity="0.7" />
      </g>
    </svg>
  );
}