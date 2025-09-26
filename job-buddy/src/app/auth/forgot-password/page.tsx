'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) throw error;
      
      setMessage('Check your email for a link to reset your password.');
      
      toast({
        title: 'Email sent',
        description: 'Check your email for a link to reset your password.',
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      setMessage(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.includes('Check your email') 
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                    : 'bg-destructive/15 text-destructive'
                }`}>
                  {message}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || message.includes('Check your email')}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading || message.includes('Check your email')}>
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Reset Link
              </Button>
            </CardContent>
          </form>
          
          <CardFooter className="flex flex-col space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/auth" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
