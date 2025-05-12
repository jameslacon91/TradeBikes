import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function VerifyEmailPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isResent, setIsResent] = useState(false);

  // If email is in URL params, use it
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else if (user?.email) {
      // If not in params, but user is in context, use that
      setEmail(user.email);
    }
  }, [user]);

  // Redirect if no email is available
  useEffect(() => {
    if (!email && !user) {
      navigate("/register");
    }
  }, [email, user, navigate]);

  const handleResendEmail = () => {
    setIsResending(true);
    
    // Mock API call to resend verification email
    setTimeout(() => {
      setIsResending(false);
      setIsResent(true);
      
      // Reset the "Resent" state after 5 seconds
      setTimeout(() => {
        setIsResent(false);
      }, 5000);
    }, 1500);
  };

  return (
    <Layout>
      <div className="container max-w-screen-lg mx-auto py-20">
        <Card className="mx-auto max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification email to: <span className="font-medium">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2 pb-4">
              <p className="text-muted-foreground">
                Please check your inbox and click on the verification link to complete your registration.
              </p>
              <p className="text-muted-foreground">
                If you don't see the email, please check your spam folder.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleResendEmail}
                disabled={isResending || isResent}
              >
                {isResending ? "Sending..." : isResent ? (
                  <span className="flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Email Resent
                  </span>
                ) : "Resend Verification Email"}
              </Button>
              
              <Button 
                variant="link" 
                className="w-full" 
                onClick={() => navigate("/auth")}
              >
                Back to Login
              </Button>
            </div>
            
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Need help? <a href="/contact" className="text-primary hover:underline">Contact Support</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}