import ApiService from './ApiService'; // Import the base ApiService

// Define TypeScript interfaces corresponding to backend Pydantic schemas

// Base interface for nested profile data
export interface UserProfileBase {
    phone_number?: string | null;
    company_name?: string | null;
    job_title?: string | null; // This is the 'title' field
    country?: string | null;
    timezone?: string | null;
    language?: string | null;
    avatar_url?: string | null;
    profile_metadata?: Record<string, any>;
    created_at?: string | null; // ISO date string
    updated_at?: string | null; // ISO date string
}

// Main response interface including nested profile
export interface UserProfileResponse {
  id: string; // UUID as string
  email: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
  role: string;
  is_onboarded: boolean;
  auth_provider: string;
  subscription_tier: string;
  created_at: string; // ISO date string
  profile?: UserProfileBase | null; // Nested profile object
}

export interface ProfileUpdate {
  name?: string;
  job_title?: string;
}

export interface UserStats {
  cases_processed: number;
  subscription_tier: string;
}


// Instantiate ApiService for user-related endpoints
const apiService = new ApiService();
const USER_ENDPOINT = '/users'; // Base endpoint for user routes

export class UserService {

  /**
   * Fetches the complete profile information for the currently authenticated user.
   * @returns {Promise<UserProfileResponse>} The user's profile data.
   */
  static async getUserProfile(): Promise<UserProfileResponse> {
    try {
      console.log('[UserService] Fetching user profile...');
      const profile = await apiService.get<UserProfileResponse>(`${USER_ENDPOINT}/me`);
      console.log('[UserService] Profile fetched successfully:', profile);
      return profile;
    } catch (error) {
      console.error('[UserService] Error fetching user profile:', error);
      // Consider more specific error handling or re-throwing
      throw new Error('Failed to fetch user profile.'); 
    }
  }

  /**
   * Updates the profile information for the currently authenticated user.
   * @param {ProfileUpdate} updates - The profile data to update (name, job_title).
   * @returns {Promise<UserProfileResponse>} The updated user's profile data.
   */
  static async updateUserProfile(updates: ProfileUpdate): Promise<UserProfileResponse> {
    try {
      console.log('[UserService] Updating user profile with:', updates);
      const updatedProfile = await apiService.put<UserProfileResponse>(`${USER_ENDPOINT}/me`, updates);
      console.log('[UserService] Profile updated successfully:', updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('[UserService] Error updating user profile:', error);
       // Check if error response has details
       const detail = (error as any)?.response?.data?.detail || 'Failed to update user profile.';
       throw new Error(detail);
    }
  }

  /**
   * Fetches statistics for the currently authenticated user.
   * @returns {Promise<UserStats>} The user's statistics.
   */
  static async getUserStats(): Promise<UserStats> {
    try {
      console.log('[UserService] Fetching user stats...');
      const stats = await apiService.get<UserStats>(`${USER_ENDPOINT}/me/stats`);
      console.log('[UserService] Stats fetched successfully:', stats);
      return stats;
    } catch (error) {
      console.error('[UserService] Error fetching user stats:', error);
      throw new Error('Failed to fetch user statistics.');
    }
  }

  // Note: Keep other Supabase-specific functions (like waitForUserCreation) 
  // if they are still needed elsewhere, e.g., during the auth flow.
  // Remove unused Supabase direct calls related to profile/user data fetching/updating
  // if they are fully replaced by the API calls above.
  // --- Example of keeping a Supabase specific function if needed ---
  // import { supabase } from '../lib/supabase'; 
  // import type { User } from '../lib/supabase'; // Assuming types are defined elsewhere
  /*
  static async waitForUserCreation(userId: string, maxAttempts: number = 3): Promise<User | null> {
    console.log(`Waiting for Supabase trigger to create user ${userId}...`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase
          .from('users') // Still might need direct check if trigger is slow
          .select('*')
          .eq('id', userId)
          .single();
        
        if (!error && data) {
          console.log(`User ${userId} found after waiting.`);
          return data as User; // Cast if necessary
        }
        
        console.log(`User not found, attempt ${attempt + 1}/${maxAttempts}. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error checking for user creation:`, error);
      }
    }
    
    console.error(`User ${userId} not created after ${maxAttempts} attempts.`);
    return null;
  }
  */
}

// Export an instance or use static methods directly
export default UserService;
