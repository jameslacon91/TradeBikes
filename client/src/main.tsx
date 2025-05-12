import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { register as registerServiceWorker } from './serviceWorkerRegistration';

// Register the service worker for PWA functionality
registerServiceWorker();

// Render the app - providers have been moved inside App.tsx
createRoot(document.getElementById("root")!).render(<App />);
