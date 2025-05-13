import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bike } from "lucide-react";
import { TradeBikesLogo } from "@/components/logo";

// Login Form Schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration Form Schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
  // All users are dealers in the unified model
  role: z.literal("dealer").default("dealer"),
  companyName: z.string().min(1, "Company name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      role: "dealer", // All users are dealers in the unified model
      companyName: "",
      phone: "",
      address: "",
      city: "",
      postcode: "",
    },
  });

  // Reset form errors when switching tabs
  useEffect(() => {
    loginForm.clearErrors();
    registerForm.clearErrors();
  }, [activeTab]);

  // Form submission handlers
  const onLoginSubmit = (data: LoginFormValues) => {
    console.log("Login form submitted:", data.username);
    loginMutation.mutate(data, {
      onSuccess: () => {
        // Navigate to dashboard on successful login
        setTimeout(() => {
          if (user) navigate("/dashboard");
        }, 800);
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    console.log("Registration form submitted:", data.username);
    registerMutation.mutate(data, {
      onSuccess: () => {
        // Navigate to dashboard on successful registration
        setTimeout(() => {
          if (user) navigate("/dashboard");
        }, 800);
      }
    });
  };

  return (
    <div className="min-h-screen bg-primary-dark flex">
      {/* Left column (forms) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <TradeBikesLogo className="h-12 w-auto text-white" />
              <span className="ml-2 text-3xl font-bold text-white tracking-tight">TradeBikes</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <div className="bg-primary-dark border border-border/30 py-8 px-4 shadow-md sm:rounded-lg sm:px-10">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                  Welcome Back
                </h2>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              autoComplete="username"
                              disabled={loginMutation.isPending}
                              className="focus:border-primary"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              autoComplete="current-password"
                              disabled={loginMutation.isPending}
                              className="focus:border-primary"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Logging in...
                          </span>
                        ) : "Sign In"}
                      </Button>
                      
                      <p className="text-center text-sm text-muted-foreground">
                        Test account: <code>johndealer</code> / <code>password123</code>
                      </p>
                      <div className="mt-4 text-center">
                        <Button
                          type="button"
                          variant="outline" 
                          className="w-full"
                          asChild
                        >
                          <Link href="/register">Register New Account</Link>
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <div className="bg-primary-dark border border-border/30 py-8 px-4 shadow-md sm:rounded-lg sm:px-10">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                  Create Your Account
                </h2>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    {/* All users are dealers in the unified model */}

                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Username</FormLabel>
                            <FormControl>
                              <Input 
                              placeholder="Choose a username" 
                              autoComplete="username"
                              disabled={registerMutation.isPending}
                              className="focus:border-primary"
                              {...field} 
                            />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Your email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create a password" 
                              autoComplete="new-password"
                              disabled={registerMutation.isPending}
                              className="focus:border-primary"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={registerForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">City (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Your city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="postcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Postcode (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Your postcode" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Address (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Link href="/register">
                      <Button 
                        type="button" 
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        Register Now
                      </Button>
                    </Link>
                  </form>
                </Form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right column (hero) */}
      <div className="hidden md:block md:w-1/2 bg-primary">
        <div className="h-full flex flex-col justify-center p-8 text-white">
          <div className="max-w-lg mx-auto">
            <h1 className="text-4xl font-bold mb-6">
              Trade Motorcycles Better
            </h1>
            <p className="text-xl mb-6">
              TradeBikes is a B2B digital platform that modernizes used motorcycle trading between dealerships and traders.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Real-time auctions and bidding</p>
              </div>
              <div className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Transparent and professional trading environment</p>
              </div>
              <div className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Centralized platform for all trading activities</p>
              </div>
              <div className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Verified users maintaining trust in the marketplace</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
