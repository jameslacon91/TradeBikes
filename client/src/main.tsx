import React from "react";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import App from "./App";
import "./index.css";
import "./styles/mobile.css"; // Import mobile-specific styles
import { register as registerServiceWorker } from './serviceWorkerRegistration';

// CLIENT_DEPLOYMENT_VERSION: May 19, 2025 - Production stability improvements

// Error boundary component to catch React rendering errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('React rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fall back to a simple error UI
      return (
        <div style={{ 
          padding: '20px', 
          maxWidth: '600px', 
          margin: '0 auto', 
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center' 
        }}>
          <h1>TradeBikes</h1>
          <p>We're experiencing technical difficulties</p>
          <p>Our team has been notified and is working to fix this issue. Please try again later.</p>
          <button onClick={() => window.location.reload()} style={{
            padding: '8px 16px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Detect platform for native styling optimizations
const MobileOptimizedApp = () => {
  useEffect(() => {
    // Report successful load to the console
    console.log('Application mounted successfully');
    
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

  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
};

// Register the service worker for PWA functionality
try {
  registerServiceWorker();
  console.log('Service worker registered successfully');
} catch (error) {
  console.error('Failed to register service worker:', error);
}

// Render the app with mobile optimizations
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('Initializing React application');
  createRoot(rootElement).render(<MobileOptimizedApp />);
  console.log('React application rendered successfully');
} catch (error) {
  console.error('Failed to initialize React application:', error);
  // Show fallback UI when React fails to initialize
  document.body.innerHTML = `
    <div style="padding:20px;max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;text-align:center">
      <h1>TradeBikes</h1>
      <p>We're experiencing technical difficulties</p>
      <p>Our team has been notified and is working to fix this issue. Please try again later.</p>
      <button onclick="window.location.reload()" style="padding:8px 16px;background:#0066cc;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:20px">
        Refresh Page
      </button>
    </div>
  `;
}
