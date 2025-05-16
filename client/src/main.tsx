import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import App from "./App";
import "./index.css";
import "./styles/mobile.css"; // Import mobile-specific styles
import { register as registerServiceWorker } from './serviceWorkerRegistration';

// CLIENT_DEPLOYMENT_VERSION: May 16, 2025 - Cross-platform optimizations

// Detect platform for native styling optimizations
const MobileOptimizedApp = () => {
  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Detect Android
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Apply platform-specific class
    if (isIOS) {
      document.body.classList.add('ios-style');
    } else if (isAndroid) {
      document.body.classList.add('android-style');
    }
    
    // For mobile apps, prevent overscroll behavior
    if (isIOS || isAndroid) {
      document.documentElement.style.overscrollBehavior = 'none';
    }
  }, []);

  return <App />;
};

// Register the service worker for PWA functionality
registerServiceWorker();

// Render the app with mobile optimizations
createRoot(document.getElementById("root")!).render(<MobileOptimizedApp />);
