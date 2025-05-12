import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { WebSocketProvider } from "./hooks/use-websocket";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <WebSocketProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </WebSocketProvider>
  </QueryClientProvider>
);
