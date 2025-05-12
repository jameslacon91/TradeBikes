import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, CreditCard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

export default function SubscriptionPage() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  // Redirect if not logged in
  if (!user) {
    navigate("/auth");
    return null;
  }

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic Subscription',
      price: billingInterval === 'month' ? 125 : 1350, // £125/month, yearly with 10% discount
      interval: billingInterval,
      features: [
        'Unlimited listings',
        'Real-time bidding system',
        'Full notification system',
        'In-app messaging',
        'Basic reporting',
        'Email support',
        'High-quality image uploads'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Subscription',
      price: billingInterval === 'month' ? 250 : 2700, // £250/month (estimated), yearly with 10% discount
      interval: billingInterval,
      features: [
        'All Basic features',
        'Integrated HPI checks',
        'ANPR integration',
        'API data exports',
        'Advanced analytics',
        'Priority support',
        'Custom branding options',
        'Coming soon'
      ]
    }
  ];

  const handleSubscribe = (planId: string) => {
    // Mock subscription processing
    console.log(`Subscribing to ${planId} plan with ${billingInterval} billing`);
    navigate("/account");
  };

  return (
    <Layout>
      <div className="container max-w-screen-xl mx-auto py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Choose Your Subscription Plan</h1>
          <p className="text-muted-foreground mt-2">Select the right plan for your business needs</p>
        </div>

        <div className="flex justify-center mb-8">
          <Tabs
            value={billingInterval}
            onValueChange={(value) => setBillingInterval(value as 'month' | 'year')}
            className="w-72"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="year">
                Yearly <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">Save 20%</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {subscriptionPlans.map((plan) => (
            <Card key={plan.id} className={plan.id === 'basic' ? 'border-primary shadow-lg' : ''}>
              {plan.id === 'basic' && (
                <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-sm font-medium rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
              )}
              {plan.id === 'pro' && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg rounded-tr-lg">
                  COMING SOON
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-bold">£{plan.price}</span>
                    <span className="ml-1 text-muted-foreground">/{plan.interval}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.id === 'basic' ? 'default' : 'outline'} 
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.id === 'pro'}
                >
                  {plan.id === 'pro' ? 'Coming Soon' : `Select ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Secure & Flexible Payments</h2>
          <p className="text-muted-foreground mb-6">
            All payments are processed securely. You can cancel or change your plan at any time.
          </p>
          <div className="flex justify-center space-x-4">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
            <img src="/visa.svg" alt="Visa" className="h-6" />
            <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
            <img src="/amex.svg" alt="American Express" className="h-6" />
          </div>
        </div>
      </div>
    </Layout>
  );
}