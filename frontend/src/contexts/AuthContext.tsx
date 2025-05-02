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
    setLoading(true); // Start with loading true

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Don't set isAuthenticated here yet
        fetchAndSetUser(session.user.id); // Fetch first
      } else {
        // No session, definitely not authenticated
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

     // Listen for changes on auth state (sign in, sign out, etc.)
     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       setLoading(true); // Set loading true on any auth change
       if (session?.access_token && session?.user) {
       console.log(`[AuthContext] Auth state changed: User signed in. User ID: ${session.user.id}`);
       localStorage.setItem('token', session.access_token); // Store token on sign in/refresh
       fetchAndSetUser(session.user.id); // Fetch user details
     } else {
       console.log('[AuthContext] Auth state changed: User signed out or session invalid.');
         localStorage.removeItem('token'); // Remove token on sign out
         setUser(null);
         setProfile(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAndSetUser = async (userId: string) => {
    try {
     console.log(`[AuthContext] Starting fetchAndSetUser for User ID: ${userId}`);

     // First verify that the user exists in Supabase auth
     console.log(`[AuthContext] Verifying user session with Supabase auth for ${userId}`);
     const { data: authData, error: authError } = await supabase.auth.getUser();

     if (authError || !authData?.user) {
       console.error(`[AuthContext] Failed to verify Supabase auth session for ${userId}. Error:`, authError);
       setUser(null);
       setProfile(null);
       setIsAuthenticated(false);
       console.log(`[AuthContext] Setting isAuthenticated = false due to failed Supabase auth verification for ${userId}.`);
       setLoading(false);
       return;
     }
     console.log(`[AuthContext] Supabase auth session verified for ${userId}. User email: ${authData.user.email}`);


     // Get user directly from the users table in public schema
     console.log(`[AuthContext] Attempting to fetch user from 'users' table for ID: ${userId}`);
     const { data: userData, error: userError } = await supabase
       .from('users')
       .select('*')
       .eq('id', userId)
       .single();

     // Log the result of the first attempt
     if (userError) {
       console.error(`[AuthContext] Error fetching user ${userId} from 'users' table (Attempt 1):`, userError);
     } else {
       console.log(`[AuthContext] User data fetched from 'users' table (Attempt 1) for ${userId}:`, userData);
     }


     if (userError || !userData) {
       // Log before retry, specifically if it's a 'Not Found' error
       if (userError?.code === 'PGRST116') {
         console.log(`[AuthContext] User ${userId} not found in 'users' table (Attempt 1), waiting 1s and retrying...`);
         await new Promise(resolve => setTimeout(resolve, 1000));

         console.log(`[AuthContext] Retrying fetch user from 'users' table for ID: ${userId}`);
         const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            // Removed duplicated .select().eq() here
            .single();

         // Log the result of the retry attempt
         if (retryError) {
            console.error(`[AuthContext] Error fetching user ${userId} from 'users' table (Retry Attempt):`, retryError);
         } else {
            console.log(`[AuthContext] User data fetched from 'users' table (Retry Attempt) for ${userId}:`, retryData);
         }

         if (retryError || !retryData) {
           console.error(`[AuthContext] User ${userId} still not found in 'users' table after retry. Setting isAuthenticated = false.`);
           setUser(null); // Clear potentially stale data
           setProfile(null);
           setIsAuthenticated(false);
           setLoading(false);
           return; // Exit fetchAndSetUser
         }
         // User found on retry
         console.log(`[AuthContext] User ${userId} found successfully in 'users' table on retry.`);
         setUser(retryData); // Use the retry data

       } else {
         // Handle other errors (not 'PGRST116') immediately
         console.error(`[AuthContext] Unrecoverable error fetching user ${userId} from 'users' table (Attempt 1): ${userError?.message}. Setting isAuthenticated = false.`);
         setUser(null);
         setProfile(null);
         setIsAuthenticated(false);
         setLoading(false);
         return; // Exit fetchAndSetUser
       }
     } else {
       // User found on the first try
       console.log(`[AuthContext] User ${userId} found successfully in 'users' table on first attempt.`);
       setUser(userData);
     }

     // --- Profile Fetching ---
     // This part runs only if the user was successfully found in the 'users' table above.
     console.log(`[AuthContext] Attempting to fetch profile from 'user_profiles' table for user_id: ${userId}`);
     const { data: profileData, error: profileError } = await supabase
       .from('user_profiles')
       .select('*')
       .eq('user_id', userId)
       .single();

     // Log profile fetch results
     if (profileError && profileError.code !== 'PGRST116') { // Log errors other than 'Not Found'
       console.error(`[AuthContext] Error fetching profile for user ${userId}:`, profileError);
     } else if (profileError?.code === 'PGRST116') {
       console.warn(`[AuthContext] Profile not found for user ${userId}. This might be expected if profile creation is separate or failed.`);
     } else {
       console.log(`[AuthContext] Profile data fetched for user ${userId}:`, profileData);
     }

     // Set profile if found
     setProfile(profileData || null);

     // *** Authentication Success Point ***
     // This point is reached ONLY if the user was successfully retrieved from the 'users' table.
     console.log(`[AuthContext] User ${userId} data retrieved from 'users' table. Setting isAuthenticated = true.`);
     setIsAuthenticated(true);

   } catch (error) {
     console.error(`[AuthContext] Unexpected error during fetchAndSetUser for ${userId}:`, error);
     setUser(null);
     setProfile(null);
     setIsAuthenticated(false); // Ensure authenticated is false on unexpected errors
     console.log(`[AuthContext] Setting isAuthenticated = false due to unexpected error for ${userId}.`);
   } finally {
     // Ensure loading is always set to false at the end
     console.log(`[AuthContext] fetchAndSetUser finished for ${userId}. Setting loading to false.`);
     setLoading(false);
   }
 };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            name: `${firstName} ${lastName}`,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      // Return early because user will need to confirm their email
      return;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const updatedProfile = await UserService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
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
