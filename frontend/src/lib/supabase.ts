import { createClient } from '@supabase/supabase-js';

// Database types
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  phone_number?: string;
  company_name?: string;
  job_title?: string;
  country?: string;
  timezone?: string;
  language?: string;
  avatar_url?: string;
  profile_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  subscription_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  feature_name: string;
  usage_count: number;
  usage_limit?: number;
  period_start: string;
  period_end: string;
  usage_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BillingHistory {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  invoice_id?: string;
  billing_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Database schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>;
      };
      usage_tracking: {
        Row: UsageTracking;
        Insert: Omit<UsageTracking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UsageTracking, 'id' | 'created_at' | 'updated_at'>>;
      };
      billing_history: {
        Row: BillingHistory;
        Insert: Omit<BillingHistory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BillingHistory, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for environment variables and provide fallbacks for development
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Authentication will not work properly. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Use empty strings as fallbacks to prevent crashes during development
const finalSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalSupabaseAnonKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient<Database>(finalSupabaseUrl, finalSupabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'medhastra-ai-auth',
    storage: window.localStorage,
  },
});