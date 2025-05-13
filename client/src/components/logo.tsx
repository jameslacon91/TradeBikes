import logoImg from "@/assets/logo.jpeg";

export function TradeBikesLogo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <img 
      src={logoImg} 
      alt="TradeBikes Logo" 
      className={className} 
    />
  );
}