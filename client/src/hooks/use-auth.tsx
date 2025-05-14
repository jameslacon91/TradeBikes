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
      queryClient.setQueryData(["/api/user"], user);
      
      // Explicitly refetch user data to ensure session is established
      setTimeout(() => {
        console.log("Refetching user data after login");
        refetchUser();
      }, 500);
      
      // Notify about successful login
      dispatchAuthEvent(user.id);
      
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
      queryClient.setQueryData(["/api/user"], user);
      
      // Explicitly refetch user data to ensure session is established
      setTimeout(() => {
        console.log("Refetching user data after registration");
        refetchUser();
      }, 500);
      
      // Notify about successful registration
      dispatchAuthEvent(user.id);
      
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
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear all query caches to prevent data from persisting between user sessions
      queryClient.clear();
      
      // Still set user data to null explicitly
      queryClient.setQueryData(["/api/user"], null);
      
      // Notify about logout
      dispatchAuthEvent(undefined);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refetchUser, // Include the refetch function
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
