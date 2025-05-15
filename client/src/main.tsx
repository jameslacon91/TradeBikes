import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { register as registerServiceWorker } from './serviceWorkerRegistration';

// CLIENT_DEPLOYMENT_VERSION: May 15, 2025 - 12:16 PM - Latest version with WebSocket improvements

// Register the service worker for PWA functionality
registerServiceWorker();

// Render the app - providers have been moved inside App.tsx
createRoot(document.getElementById("root")!).render(<App />);
