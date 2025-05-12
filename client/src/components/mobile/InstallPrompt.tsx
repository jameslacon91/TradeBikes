import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';

// Define the type for the BeforeInstallPromptEvent that's not in the standard TypeScript definitions
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Extend the Window interface to include our custom event
declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

const InstallPrompt = () => {
  // State to control visibility of the prompt
  const [showPrompt, setShowPrompt] = useState(false);
  // Store the event to use it later
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // State to track if the app is installed
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome <= 67 from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowPrompt(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      // Hide the install button
      setShowPrompt(false);
      setIsAppInstalled(true);
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      // Optionally log the installation to analytics
      console.log('TradeBikes app was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // If there's no deferred prompt, we can't do anything
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Log the outcome
    console.log(`User response to install prompt: ${outcome}`);
    
    // If the user accepted, hide the prompt
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    // Clear the deferredPrompt since it can only be used once
    setDeferredPrompt(null);
  };

  // If the app is already installed or the prompt shouldn't be shown, don't render anything
  if (isAppInstalled || !showPrompt) {
    return null;
  }

  // Render the install prompt banner
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary text-white p-4 shadow-lg z-50">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Install TradeBikes</h3>
          <p className="text-sm">Add TradeBikes to your home screen for a better experience</p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <Button 
            onClick={handleInstallClick} 
            variant="outline" 
            className="text-white border-white hover:bg-white hover:text-primary"
          >
            <Download className="mr-2 h-4 w-4" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;