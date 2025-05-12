export function TradeBikesLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <circle cx="50" cy="50" r="45" fill="#3B82F6" />
      <g fill="white">
        <path d="M30 30 L70 30 L70 35 L55 35 L55 70 L45 70 L45 35 L30 35 Z" />
        <circle cx="50" cy="55" r="20" fillOpacity="0.3" />
        <circle cx="35" cy="75" r="10" />
        <circle cx="65" cy="75" r="10" />
      </g>
    </svg>
  );
}