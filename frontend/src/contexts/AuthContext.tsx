import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, UserProfile } from '../lib/supabase';
import { UserService } from '../services/UserService';

// Combined type for profile updates, allowing fields from both User and UserProfile
type ProfileUpdateData = Partial<UserProfile> & {
  first_name?: string;
  last_name?: string;
  // Add other User fields here if they might be updated via profile form
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // Update signature to use the combined type
  updateProfile: (updates: ProfileUpdateData) => Promise<void>;
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
          // Redirect to a page that prompts login after email confirmation
          emailRedirectTo: `${window.location.origin}/email-confirmed-login`, 
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

  // Update user profile (handles both 'profiles' table and auth.users metadata)
  const updateProfile = async (updates: ProfileUpdateData) => {
    if (!user) {
      console.error('[AuthContext] Cannot update profile: No user logged in');
      throw new Error('No user logged in');
    }

    try {
      console.log(`[AuthContext] Updating profile for user: ${user.id}`);

      // 1. Prepare updates for auth.users metadata (User fields like first_name, last_name)
      const userMetadataUpdates: { first_name?: string; last_name?: string } = {};
      if ('first_name' in updates && updates.first_name !== undefined) {
        userMetadataUpdates.first_name = updates.first_name;
      }
      if ('last_name' in updates && updates.last_name !== undefined) {
        userMetadataUpdates.last_name = updates.last_name;
      }
      // Add checks for other User fields here if needed (e.g., role, if updatable)

      // 2. Prepare updates for the 'profiles' table (UserProfile fields)
      // We explicitly pick only the keys belonging to UserProfile from the input 'updates'
      const profileTableUpdates: Partial<UserProfile> = {};
      const userProfileKeys: Array<keyof UserProfile> = [
        'phone_number', 'company_name', 'job_title', 'country',
        'timezone', 'language', 'avatar_url', 'profile_metadata'
        // Add any other keys defined in the UserProfile interface
      ];

      for (const key of userProfileKeys) {
        if (key in updates && updates[key] !== undefined) {
          // Type assertion needed because updates[key] could be from the User part of ProfileUpdateData
          profileTableUpdates[key] = updates[key] as any;
        }
      }

      // 3. Execute update for auth metadata (if needed)
      if (Object.keys(userMetadataUpdates).length > 0) {
        console.log('[AuthContext] Updating auth user metadata with:', userMetadataUpdates);
        const { data: updatedUserData, error: userMetadataError } = await supabase.auth.updateUser({
           data: userMetadataUpdates // Supabase merges this with existing metadata
         });

         if (userMetadataError) {
            console.error(`[AuthContext] User metadata update error:`, userMetadataError);
            throw userMetadataError; // Rethrow or handle as appropriate
         }
         console.log(`[AuthContext] User metadata updated successfully:`, updatedUserData);

         // Update local user state to immediately reflect metadata changes
         // Note: onAuthStateChange might also trigger an update, but this ensures immediate UI consistency
         if (updatedUserData?.user) {
            setUser(prevUser => {
                if (!prevUser) return null;
                const newMeta = updatedUserData.user?.user_metadata;
                // Create a new user object reflecting the changes
                const updatedUserObject: User = {
                    ...prevUser,
                    // Update fields based on what was returned in updatedUserData
                    first_name: newMeta?.first_name ?? prevUser.first_name,
                    last_name: newMeta?.last_name ?? prevUser.last_name,
                    // Ensure other fields from updatedUserData.user are mapped if necessary
                    // For example, if email could change (unlikely via metadata):
                    // email: updatedUserData.user.email ?? prevUser.email,
                    updated_at: updatedUserData.user.updated_at ?? prevUser.updated_at,
                };
                return updatedUserObject;
            });
         }
      } else {
          console.log(`[AuthContext] No User fields to update in auth metadata.`);
      }

      // 4. Execute update for 'profiles' table (if needed)
      if (Object.keys(profileTableUpdates).length > 0) {
        console.log('[AuthContext] Updating profiles table with:', profileTableUpdates);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .update(profileTableUpdates) // Pass the correctly filtered object
          .eq('id', user.id) // Ensure this matches your profiles table primary key column name
          .select()
          .single();

        if (profileError) {
          console.error(`[AuthContext] Profile table update error:`, profileError);
          throw profileError;
        }
        console.log(`[AuthContext] Profile table updated successfully:`, profileData);
        // Ensure profileData matches UserProfile structure before setting
        if (profileData && typeof profileData === 'object' && 'user_id' in profileData) {
             setProfile(profileData as UserProfile); // Cast if confident in structure
        } else {
             console.warn('[AuthContext] Received unexpected data structure after profile update:', profileData);
             // Optionally refetch profile here if update response is unreliable
             // await fetchProfile(user.id);
        }
      } else {
         console.log(`[AuthContext] No UserProfile fields to update in 'profiles' table.`);
      }

    } catch (error) {
      // Catch errors from either update operation
      console.error('[AuthContext] Error during updateProfile:', error);
      throw error; // Rethrow the caught error so the caller can handle it
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