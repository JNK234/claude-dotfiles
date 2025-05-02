import { supabase } from '../lib/supabase';
import type { User, UserProfile, Subscription, UsageTracking, BillingHistory } from '../lib/supabase';

export class UserService {
  // User operations
  static async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      throw error;
    }

    return data;
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return data;
  }

  // Profile operations
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" error
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  }

  // Subscription operations
  static async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" error
      console.error('Error fetching subscription:', error);
      throw error;
    }

    return data;
  }

  static async updateSubscription(
    userId: string,
    updates: Partial<Subscription>
  ): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }

    return data;
  }

  // Usage tracking operations
  static async getUsage(userId: string, featureName: string): Promise<UsageTracking | null> {
    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_name', featureName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" error
      console.error('Error fetching usage:', error);
      throw error;
    }

    return data;
  }

  static async incrementUsage(
    userId: string,
    featureName: string,
    increment: number = 1
  ): Promise<UsageTracking> {
    const { data, error } = await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_feature_name: featureName,
      p_increment: increment,
    });

    if (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }

    return data;
  }

  // Billing operations
  static async getBillingHistory(userId: string): Promise<BillingHistory[]> {
    const { data, error } = await supabase
      .from('billing_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching billing history:', error);
      throw error;
    }

    return data;
  }

  static async createBillingRecord(record: Omit<BillingHistory, 'id' | 'created_at' | 'updated_at'>): Promise<BillingHistory> {
    const { data, error } = await supabase
      .from('billing_history')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Error creating billing record:', error);
      throw error;
    }

    return data;
  }

  // Wait for Supabase trigger to create user and profile
  static async waitForUserCreation(userId: string, maxAttempts: number = 3): Promise<User | null> {
    console.log(`Waiting for Supabase trigger to create user ${userId}...`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Try to get the user
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (!error && data) {
          console.log(`User ${userId} found after waiting.`);
          return data;
        }
        
        // Wait before next attempt
        console.log(`User not found, attempt ${attempt + 1}/${maxAttempts}. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error checking for user creation:`, error);
        // Continue to next attempt
      }
    }
    
    console.error(`User ${userId} not created after ${maxAttempts} attempts.`);
    return null;
  }

  // Combined operations
  static async getUserWithProfile(userId: string): Promise<{ user: User; profile: UserProfile } | null> {
    const user = await this.getUser(userId);
    let profile = await this.getProfile(userId);
    
    if (!user) {
      return null;
    }

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await this.createProfile(userId, {
        user_id: userId,
        profile_metadata: {}
      });
    }

    return { user, profile };
  }

  static async getUserWithSubscription(userId: string): Promise<{ user: User; subscription: Subscription } | null> {
    const [user, subscription] = await Promise.all([
      this.getUser(userId),
      this.getSubscription(userId),
    ]);

    if (!user || !subscription) {
      return null;
    }

    return { user, subscription };
  }
}