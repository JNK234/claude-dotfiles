import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export class AuthService {
  static async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      throw error;
    }

    return session;
  }

  static async refreshSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }

    return session;
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  static async updatePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  static async verifyEmail(token: string, email: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      token,
      type: 'email',
      email,
    });

    if (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  }
}