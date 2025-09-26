"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { FaUserShield } from 'react-icons/fa';
import { Loader2, X } from 'lucide-react';
import * as Toast from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import dynamic from 'next/dynamic';

// Dynamically import the BackgroundAnimation component with no SSR
const BackgroundAnimation = dynamic(
  () => import('@/components/ui/background-animation'),
  { ssr: false }
);

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
}).omit({ rememberMe: true });

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Toast state
  const [open, setOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState('');
  const [toastDescription, setToastDescription] = useState('');
  const [toastVariant, setToastVariant] = useState<'default' | 'destructive'>('default');

  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    setToastTitle(title);
    setToastDescription(description);
    setToastVariant(variant);
    setOpen(true);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData | SignupFormData>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    mode: 'onChange',
  });

  // Handle viewport changes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset form when toggling between login/signup
  useEffect(() => {
    reset();
  }, [isLogin, reset]);

  // Form submission handler
  const router = useRouter();

  // Define a type for Supabase auth error
  type SupabaseAuthError = {
    status?: number;
    message?: string;
    error_description?: string;
  };

  const getErrorMessage = (error: unknown): string => {
    if (!error) return 'An unknown error occurred';
    
    // Type guard to check if error is a SupabaseAuthError
    const isSupabaseError = (err: unknown): err is SupabaseAuthError => {
      return (
        typeof err === 'object' &&
        err !== null &&
        ('status' in err || 'message' in err || 'error_description' in err)
      );
    };

    // Handle Supabase AuthError
    if (isSupabaseError(error) && error.status) {
      switch (error.status) {
        case 400:
          return error.message || 'Invalid email or password';
        case 401:
          return 'Invalid login credentials';
        case 404:
          return 'No account found with this email';
        case 429:
          return 'Too many login attempts. Please try again later.';
      }
    }
    
    // Handle other error formats
    if (error instanceof Error) {
      return error.message;
    }
    return 'An error occurred during authentication';
  };

  const onSubmit = async (data: LoginFormData | SignupFormData) => {
    try {
      setIsLoading(true);
      
      if (isLogin) {
        // Handle login
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          const errorMessage = getErrorMessage(error);
          throw new Error(errorMessage);
        }
        
        showToast('Success', 'Logged in successfully!');
        router.push('/dashboard'); // Redirect to dashboard after successful login
      } else {
        // Handle signup
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: (data as SignupFormData).name,
            },
          },
        });

        if (error) throw error;
        
        showToast('Success', 'Account created successfully! Please check your email for verification.');
        setIsLogin(true); // Switch back to login form
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showToast('Authentication Failed', errorMessage, 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = useCallback(() => {
    setIsLogin(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen relative">
      <BackgroundAnimation />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <Toast.Provider>
        <div className="w-full max-w-4xl bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-gray-700 z-10">
          {/* Left Side - Auth Form */}
          <div className="p-6 md:p-8 flex flex-col">
            <div className="mb-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-2.5 bg-indigo-600/20 rounded-full">
                  <FaUserShield className="text-3xl text-indigo-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {isLogin ? 'Welcome back!' : 'Create an account'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {isLogin ? 'Sign in to your account' : 'Get started with JobBuddy'}
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                type="button"
                variant="outline" 
                className="w-full flex items-center justify-center gap-2 border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white text-sm py-2"
                disabled={isLoading}
              >
                <FcGoogle className="w-4 h-4" />
                {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">
                    or continue with
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs font-medium text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className={cn("bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500", {
                        "border-red-500": 'name' in errors && errors.name
                      })}
                      {...register('name' as const)}
                      disabled={isLoading}
                    />
                    {'name' in errors && errors.name && (
                      <p className="text-xs text-red-500">{String(errors.name.message)}</p>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-300">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className={cn("bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500", {
                      "border-red-500": errors.email
                    })}
                    {...register('email')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{String(errors.email.message)}</p>
                  )}
                </div>

                <div className="space-y-1 mb-10">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium text-gray-300">
                      Password
                    </Label>
                    {isLogin && (
                      <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={cn("bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500", {
                      "border-red-500": errors.password
                    })}
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{String(errors.password.message)}</p>
                  )}
                </div>

                {isLogin && (
                  <div className="flex items-center">
                    <Checkbox
                      id="rememberMe"
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                      {...register('rememberMe')}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="ml-2 block text-sm text-gray-300"
                    >
                      Remember me
                    </Label>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/30"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : isLogin ? (
                    'Sign in'
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="font-medium text-indigo-400 hover:text-indigo-300"
                disabled={isLoading}
              >
                {isLogin ? 'Create an account' : 'Sign in'}
              </button>
            </div>
          </div>

          {/* Right Side - Illustration */}
          {!isMobile && (
            <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-indigo-900/80 to-indigo-800/80 p-6 relative overflow-hidden">
              <div className="relative z-10 text-center text-white px-6">
                <h3 className="text-2xl font-bold mb-3">
                  {isLogin ? 'New here?' : 'Welcome!'}
                </h3>
                <p className="text-indigo-100 mb-6">
                  {isLogin
                    ? 'Join JobBuddy today and take control of your job search.'
                    : 'Sign in to access your personalized job search dashboard.'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white transition-colors"
                  onClick={toggleAuthMode}
                  disabled={isLoading}
                >
                  {isLogin ? 'Create an account' : 'Sign in'}
                </Button>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          )}
        </div>

        {/* Toast Component */}
        <Toast.Root 
          className={cn(
            "fixed top-4 right-4 z-[100] p-4 rounded-md shadow-lg max-w-sm w-full",
            "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-80 data-[state=open]:fade-in-80",
            "data-[state=closed]:slide-out-to-right-2 data-[state=open]:slide-in-from-right-2",
            toastVariant === 'destructive' ? "bg-red-500 text-white" : ""
          )}
          open={open} 
          onOpenChange={setOpen}
        >
          <div className="flex justify-between items-start">
            <div>
              <Toast.Title className="font-semibold">{toastTitle}</Toast.Title>
              <Toast.Description className="text-sm mt-1">
                {toastDescription}
              </Toast.Description>
            </div>
            <Toast.Close asChild>
              <button className="ml-4 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </Toast.Close>
          </div>
        </Toast.Root>
        <Toast.Viewport className="fixed top-0 right-0 p-4 w-full max-w-sm m-0 z-[100] outline-none" />
      </Toast.Provider>
      </div>
    </div>
  );
}