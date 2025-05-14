import React, { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  refetchUser: () => Promise<User | null>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

// Custom event for auth state changes that WebSocket can listen to
export const dispatchAuthEvent = (userId?: number) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('auth-state-change', { 
      detail: { userId } 
    });
    window.dispatchEvent(event);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1,
    retryDelay: 1000,
  });

  // Detect authentication status and page load
  useEffect(() => {
    console.log("Auth provider mounted or user state changed");
    
    if (user) {
      console.log("User is authenticated:", user.username);
      dispatchAuthEvent(user.id);
    } else if (!isLoading) {
      console.log("User is not authenticated (after loading)");
    }
    
    // When the page first loads, always refetch user status
    const handlePageVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log("Page became visible, refreshing auth status");
        refetchUser();
      }
    };
    
    // Setup page visibility detection
    document.addEventListener('visibilitychange', handlePageVisibility);
    window.addEventListener('focus', () => refetchUser());
    
    // Initial fetch
    refetchUser();
    
    return () => {
      document.removeEventListener('visibilitychange', handlePageVisibility);
      window.removeEventListener('focus', () => refetchUser());
    };
  }, [user, isLoading, refetchUser]);

  // Helper to perform a full reset of application state
  const resetAppState = (user: User, redirectTo: string = '/dashboard') => {
    // 1. Clear all existing cached data
    console.log("Performing full application state reset");
    queryClient.clear();
    
    // 2. Set the basic user data in cache
    queryClient.setQueryData(["/api/user"], user);
    
    // 3. Dispatch auth event
    dispatchAuthEvent(user.id);
    
    // 4. After a brief delay to allow other components to react:
    setTimeout(() => {
      // 5. Force reload the entire page to reset all components
      if (typeof window !== 'undefined') {
        // Use replace to prevent back button from causing issues
        window.location.replace(redirectTo);
      }
    }, 300);
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log("Attempting login for:", credentials.username);
        const res = await apiRequest("POST", "/api/login", credentials);
        const userData = await res.json();
        console.log("Login successful, user data received:", userData);
        return userData;
      } catch (error) {
        console.error("Login API error:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      console.log("Login mutation successful, updating user data");
      
      // Do a complete app state reset with the new user
      resetAppState(user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.companyName}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        console.log("Attempting registration for:", credentials.username);
        const res = await apiRequest("POST", "/api/register", credentials);
        const userData = await res.json();
        console.log("Registration successful, user data received:", userData);
        return userData;
      } catch (error) {
        console.error("Registration API error:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      console.log("Registration mutation successful, updating user data");
      
      // Use the same app state reset helper as login
      resetAppState(user);
      
      toast({
        title: "Registration successful",
        description: `Welcome to TradeBikes, ${user.companyName}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log("Sending logout request to server");
        await apiRequest("POST", "/api/logout");
        // Don't return anything to match void return type
      } catch (error) {
        console.error("Logout API error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Logout successful, clearing all application state");
      
      // 1. Clear all cached data
      queryClient.clear();
      
      // 2. Set user to null in cache
      queryClient.setQueryData(["/api/user"], null);
      
      // 3. Dispatch auth event for null user
      dispatchAuthEvent(undefined);
      
      // 4. Show toast notification
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      
      // 5. Force a complete page reload to ensure all components are reset
      if (typeof window !== 'undefined') {
        // Use replace to prevent back button from restoring previous state
        setTimeout(() => {
          window.location.replace('/auth');
        }, 300);
      }
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: error.message || "Unable to log out. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Wrapper for refetchUser to return the user data
  const refetchUserData = async (): Promise<User | null> => {
    try {
      console.log("Manually refreshing user data");
      const result = await refetchUser();
      return result.data || null;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refetchUser: refetchUserData, // Use our wrapper that returns User | null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
