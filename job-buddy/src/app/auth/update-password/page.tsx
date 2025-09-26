'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // This page should only be accessed via the password reset email link
    const accessToken = searchParams.get('access_token');
    if (!accessToken) {
      router.push('/auth');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      
      if (updateError) throw updateError;
      
      setSuccess(true);
      
      toast({
        title: 'Success',
        description: 'Your password has been updated successfully.',
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
      
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Password Updated</CardTitle>
              <CardDescription>
                Your password has been updated successfully. Redirecting to login...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>
              Please enter your new password below.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Password
              </Button>
            </CardContent>
          </form>
          
          <CardFooter className="flex flex-col space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <a href="/auth" className="text-primary hover:underline">
                Sign in
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
