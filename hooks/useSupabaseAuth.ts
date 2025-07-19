import { useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { showToast } from '../lib/utils/toast';
import { STORAGE_KEYS } from '../lib/utils/config';
import logger from '../lib/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  logger.info('Supabase client initialized', { url: supabaseUrl }, 'useSupabaseAuth');
} else {
  logger.error('Supabase configuration missing', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey }, 'useSupabaseAuth');
}

export interface UseSupabaseAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

export const useSupabaseAuth = (): UseSupabaseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      logger.error('Supabase not initialized', {}, 'useSupabaseAuth.init');
      setIsLoading(false);
      return;
    }

    logger.debug('Initializing auth state', {}, 'useSupabaseAuth.init');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('Failed to get initial session', error, 'useSupabaseAuth.getSession');
        setError(error.message);
      } else {
        logger.info('Initial session retrieved', { hasSession: !!session, userId: session?.user?.id }, 'useSupabaseAuth.getSession');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.access_token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
          logger.debug('Auth token stored', {}, 'useSupabaseAuth.getSession');
        }
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.auth(`Auth state changed: ${event}`, { userId: session?.user?.id, hasSession: !!session });
      
      setSession(session);
      setUser(session?.user ?? null);
      setError(null);

      if (session?.access_token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
        logger.debug('Auth token updated', {}, 'useSupabaseAuth.onAuthStateChange');
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        logger.debug('Auth token removed', {}, 'useSupabaseAuth.onAuthStateChange');
      }
    });

    return () => {
      logger.debug('Cleaning up auth subscription', {}, 'useSupabaseAuth.cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      const error = 'Supabase not available';
      logger.error(error, {}, 'useSupabaseAuth.signIn');
      throw new Error(error);
    }

    logger.info('Attempting sign in', { email }, 'useSupabaseAuth.signIn');
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Sign in failed', { email, error: error.message }, 'useSupabaseAuth.signIn');
        setError(error.message);
        throw error;
      }

      logger.info('Sign in successful', { email, userId: data.user?.id }, 'useSupabaseAuth.signIn');
    } catch (error: any) {
      logger.error('Sign in error', { email, error: error.message }, 'useSupabaseAuth.signIn');
      setError(error.message);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      const error = 'Supabase not available';
      logger.error(error, {}, 'useSupabaseAuth.signUp');
      throw new Error(error);
    }

    logger.info('Attempting sign up', { email }, 'useSupabaseAuth.signUp');
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        logger.error('Sign up failed', { email, error: error.message }, 'useSupabaseAuth.signUp');
        setError(error.message);
        throw error;
      }

      logger.info('Sign up successful', { email, userId: data.user?.id }, 'useSupabaseAuth.signUp');
    } catch (error: any) {
      logger.error('Sign up error', { email, error: error.message }, 'useSupabaseAuth.signUp');
      setError(error.message);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      const error = 'Supabase not available';
      logger.error(error, {}, 'useSupabaseAuth.signOut');
      throw new Error(error);
    }

    logger.info('Attempting sign out', { userId: user?.id }, 'useSupabaseAuth.signOut');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Sign out failed', { error: error.message }, 'useSupabaseAuth.signOut');
        throw error;
      }

      logger.info('Sign out successful', {}, 'useSupabaseAuth.signOut');
    } catch (error: any) {
      logger.error('Sign out error', { error: error.message }, 'useSupabaseAuth.signOut');
      throw error;
    }
  }, [user?.id]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    error,
  };
}; 