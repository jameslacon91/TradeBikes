// Use relative path instead of alias
import logoImage from "../assets/logo.jpeg";

export function TradeBikesLogo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <img 
      src={logoImage} 
      alt="TradeBikes Logo" 
      className={className} 
    />
  );
}