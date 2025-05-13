import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
// Removed ApiService import

// Removed ApiService instance

export class AuthService {
  static async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      throw error; // Re-throw to allow calling components to handle
    }

    return session;
  }

  static async refreshSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Error refreshing session:', error);
      // Depending on the error, might want to sign out the user
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

  /**
   * Requests a password reset email using Supabase auth.
   * @param email The user's email address.
   */
  static async resetPassword(email: string): Promise<void> {
    // Use Supabase built-in method
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // This URL should point to the page where the user can enter their new password
      // after clicking the link in the email. It corresponds to the route handled
      // by the inline ResetPassword component in App.tsx.
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error('Error requesting password reset via Supabase:', error);
      throw error; // Let the calling component handle the error display
    }
    console.info('Supabase password reset email request initiated successfully.');
  }

  // Removed resetPasswordWithToken method as Supabase handles the token verification implicitly

  /**
   * Updates the password for the currently logged-in user (via Supabase).
   * Use this for profile settings, not for forgotten password reset.
   * @param password The new password.
   */
  static async updatePassword(password: string): Promise<void> {
    // This uses Supabase directly, assuming it's for logged-in user updates
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('Error updating password (logged-in user):', error);
      throw error;
    }
     console.info('Password updated successfully for logged-in user.');
  }

  static async verifyEmail(token: string, email: string): Promise<void> {
    // This seems related to initial email confirmation, likely still uses Supabase
    const { error } = await supabase.auth.verifyOtp({
      token,
      type: 'email',
      email,
    });

    if (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
     console.info('Email verified successfully.');
  }
}