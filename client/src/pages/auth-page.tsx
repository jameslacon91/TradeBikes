import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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
  role: z.enum(["dealer", "trader"], {
    required_error: "Please select a role",
  }),
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
      role: "dealer",
      companyName: "",
      phone: "",
      address: "",
      city: "",
      postcode: "",
    },
  });

  // Form submission handlers
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left column (forms) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <TradeBikesLogo className="h-10 w-auto" />
              <span className="ml-2 text-2xl font-bold text-gray-900">TradeBikes</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Welcome Back
                </h2>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
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
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Create Your Account
                </h2>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <RadioGroup 
                              onValueChange={field.onChange} 
                              defaultValue={field.value} 
                              className="flex space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dealer" id="dealer" />
                                <label htmlFor="dealer" className="cursor-pointer">Dealer</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="trader" id="trader" />
                                <label htmlFor="trader" className="cursor-pointer">Trader</label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
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
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
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
                            <FormLabel>Email</FormLabel>
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
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
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
                          <FormLabel>Phone (Optional)</FormLabel>
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
                            <FormLabel>City (Optional)</FormLabel>
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
                            <FormLabel>Postcode (Optional)</FormLabel>
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
                          <FormLabel>Address (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
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
