import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Render the app - providers have been moved inside App.tsx
createRoot(document.getElementById("root")!).render(<App />);
