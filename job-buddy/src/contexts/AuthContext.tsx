'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';

type AuthResponse<T = unknown> = {
  error: Error | null;
  data?: T;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Define the async function
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    // Call the async function
    getSession();

    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      return { error };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
