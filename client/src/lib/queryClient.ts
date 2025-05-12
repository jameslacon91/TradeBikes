import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Log the request being made
  console.log(`API Request: ${method} ${url}`);
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        // Add these headers to ensure cookies work correctly
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Handle successful responses
    if (res.ok) {
      console.log(`API Response: ${method} ${url} - Success (${res.status})`);
      return res;
    }
    
    // Handle errors
    const errorText = await res.text();
    console.error(`API Error: ${method} ${url} - Status ${res.status}`, errorText);
    
    throw new Error(`${res.status}: ${errorText || res.statusText}`);
  } catch (error) {
    console.error(`API Request failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`Query request: ${url}`);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      });

      // Handle 401 based on specified behavior
      if (res.status === 401) {
        console.log(`Auth required for: ${url}`);
        if (unauthorizedBehavior === "returnNull") {
          console.log("Returning null due to unauthorized status");
          return null;
        }
      }

      // Handle success
      if (res.ok) {
        console.log(`Query successful: ${url}`);
        const data = await res.json();
        return data;
      }
      
      // Handle errors
      const errorText = await res.text();
      console.error(`Query error: ${url} - Status ${res.status}`, errorText);
      throw new Error(`${res.status}: ${errorText || res.statusText}`);
    } catch (error) {
      console.error(`Query failed: ${url}`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
