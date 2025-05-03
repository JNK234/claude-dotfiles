import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, UserProfile } from '../lib/supabase';
import { UserService } from '../services/UserService';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check active sessions and set the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log(`[AuthContext] Found existing session for user: ${session.user.id}`);
        handleAuthChange(session);
      } else {
        // No session, reset auth state
        resetAuthState();
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthContext] Auth state changed: ${event}`);
      
      if (session) {
        console.log(`[AuthContext] User session available: ${session.user.id}`);
        handleAuthChange(session);
      } else {
        // No session, reset auth state
        resetAuthState();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle authentication state change
  const handleAuthChange = async (session: any) => {
    try {
      setLoading(true);
      
      // Store token for API requests
      localStorage.setItem('token', session.access_token);
      
      // Extract basic user data from session 
      const userData = {
        id: session.user.id,
        email: session.user.email,
        first_name: session.user.user_metadata?.first_name || '',
        last_name: session.user.user_metadata?.last_name || '',
        role: session.user.user_metadata?.role || 'user',
        is_onboarded: session.user.user_metadata?.is_onboarded || false,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Fetch extended profile data
      await fetchProfile(session.user.id);
    } catch (error) {
      console.error('[AuthContext] Error handling auth change:', error);
      resetAuthState();
    } finally {
      setLoading(false);
    }
  };

  // Reset authentication state
  const resetAuthState = () => {
    console.log('[AuthContext] Resetting auth state');
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      console.log(`[AuthContext] Fetching profile for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`[AuthContext] Profile not found for user: ${userId}, will create one`);
          // Profile doesn't exist yet, create it
          await createProfile(userId);
          return;
        }
        
        console.error(`[AuthContext] Error fetching profile:`, error);
        return;
      }
      
      console.log(`[AuthContext] Profile fetched successfully:`, data);
      setProfile(data);
    } catch (error) {
      console.error(`[AuthContext] Unexpected error fetching profile:`, error);
    }
  };

  // Create a new user profile
  const createProfile = async (userId: string) => {
    try {
      if (!user) return;
      
      console.log(`[AuthContext] Creating new profile for user: ${userId}`);
      
      const profileData = {
        id: userId,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_metadata: {}
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (error) {
        console.error(`[AuthContext] Error creating profile:`, error);
        return;
      }
      
      console.log(`[AuthContext] Profile created successfully:`, data);
      setProfile(data);
    } catch (error) {
      console.error(`[AuthContext] Unexpected error creating profile:`, error);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log(`[AuthContext] Signing in user: ${email}`);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error(`[AuthContext] Sign in error:`, error);
        throw error;
      }
      
      console.log(`[AuthContext] Sign in successful`);
    } catch (error) {
      console.error('[AuthContext] Error signing in:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      console.log(`[AuthContext] Signing up user: ${email}`);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            name: `${firstName} ${lastName}`,
            role: 'user',
            is_onboarded: false
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error(`[AuthContext] Sign up error:`, error);
        throw error;
      }
      
      console.log(`[AuthContext] Sign up successful, awaiting email verification`);
    } catch (error) {
      console.error('[AuthContext] Error signing up:', error);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      console.log(`[AuthContext] Initiating Google sign in`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error(`[AuthContext] Google sign in error:`, error);
        throw error;
      }
    } catch (error) {
      console.error('[AuthContext] Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log(`[AuthContext] Signing out user`);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error(`[AuthContext] Sign out error:`, error);
        throw error;
      }
      
      console.log(`[AuthContext] Sign out successful`);
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      console.error('[AuthContext] Cannot update profile: No user logged in');
      throw new Error('No user logged in');
    }

    try {
      console.log(`[AuthContext] Updating profile for user: ${user.id}`);
      
      // Update profile in Supabase directly
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error(`[AuthContext] Profile update error:`, error);
        throw error;
      }
      
      console.log(`[AuthContext] Profile updated successfully:`, data);
      setProfile(data);
      
      // Update user metadata if needed
      if (updates.first_name || updates.last_name) {
        await supabase.auth.updateUser({
          data: {
            first_name: updates.first_name || user.first_name,
            last_name: updates.last_name || user.last_name
          }
        });
      }
    } catch (error) {
      console.error('[AuthContext] Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
