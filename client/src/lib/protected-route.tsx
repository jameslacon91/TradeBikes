import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element | null;
}) {
  const { user, isLoading, refetchUser } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const [, navigate] = useLocation();
  
  // Enhanced auth checking with retry and timeout safety
  useEffect(() => {
    console.log("Protected route auth check - Path:", path);
    console.log("Auth status:", { user: !!user, isLoading });
    
    // If still loading, wait for it
    if (isLoading) {
      return;
    }
    
    // If no user after loading completes, retry once more
    // This handles edge cases where the session exists but the initial check failed
    if (!user) {
      console.log("Auth check failed, retrying once...");
      refetchUser().then(() => {
        // Set a timeout to prevent infinite redirects
        setTimeout(() => {
          setLocalLoading(false);
        }, 500);
      });
    } else {
      // User is authenticated
      setLocalLoading(false);
    }
  }, [user, isLoading, path, refetchUser]);

  // Show loading state when checking authentication
  if (isLoading || localLoading) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Checking authentication...</p>
        </div>
      </Route>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("User not authenticated, redirecting to /auth");
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // User is authenticated, render the protected component
  console.log("User authenticated, rendering protected component");
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
