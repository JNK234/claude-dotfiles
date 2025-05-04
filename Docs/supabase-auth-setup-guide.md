# Supabase Authentication Setup Guide

This guide will walk you through setting up the Supabase authentication system for Medhastra AI.

## Prerequisites

1. A Supabase project - If you don't have one, create one at [supabase.com](https://supabase.com)
2. Access to the Supabase dashboard for your project

## Step 1: Run the Database Migration

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `/Users/jnk789/Developer/MedhastraAI/backend/migration/supabase_setup.sql`
5. Run the query

This will set up:

- The profiles table linked to Supabase auth users
- Row Level Security (RLS) policies for proper data access control
- Triggers to automatically create profiles for new users
- Helper views and functions for user management

## Step 2: Configure Authentication Settings

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure the following:

### Email Auth

1. Under Email Auth, make sure it's enabled
2. Set "Confirm email" to "Enabled" for secure sign-ups
3. Configure a site URL that matches your production URL

### OAuth Providers (Optional for Google login)

1. Go to External OAuth Providers
2. Enable Google
3. Set up OAuth credentials in Google Cloud Console
4. Add the redirect URL from Supabase to your Google OAuth configuration
5. Add your Google Client ID and Secret to Supabase

## Step 3: Configure Environment Variables

Update your frontend environment variables (`.env` or equivalent):

```
VITE_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
```

Update your backend environment variables:

```
SUPABASE_URL=https://YOUR_SUPABASE_PROJECT.supabase.co
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_SERVICE_KEY=your-service-role-key-from-supabase-dashboard
```

## Step 4: Test the Authentication Flow

1. Start your frontend and backend applications
2. Navigate to the sign-up page
3. Create a new account
4. Verify that:
   - You receive a verification email (if enabled)
   - You can log in after verification
   - Your profile data is properly stored and retrieved

## Troubleshooting

### Common Issues

1. **JWT Validation Errors**

   - Check that your `SUPABASE_URL` and `SUPABASE_JWT_AUDIENCE` are correctly set
   - Make sure your backend can access the JWKS endpoint at `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/.well-known/jwks.json`
2. **Profile Not Created**

   - Check the trigger function `handle_new_user()` is properly registered
   - Verify the SQL migration ran successfully
   - Look for errors in Supabase logs
3. **Authorization Issues**

   - Verify the RLS policies are correctly set up
   - Check that your API requests include the correct Authorization header
4. **CORS Issues**

   - Make sure your backend CORS settings allow requests from your frontend origin

## Using the Authentication System

### Frontend Authentication

The `AuthContext` in your frontend application provides:

```typescript
// Access authentication state
const { 
  user,            // Current user data
  profile,         // User profile data
  loading,         // Whether auth is currently loading
  isAuthenticated, // Whether user is authenticated
  signIn,          // Function to sign in with email/password
  signUp,          // Function to sign up with email/password
  signInWithGoogle, // Function to sign in with Google
  signOut,         // Function to sign out
  updateProfile    // Function to update profile
} = useAuth();
```

### Backend Authentication

In your backend, use the security middleware:

```python
from app.core.security import get_current_local_user

@router.get("/protected-endpoint")
async def protected_endpoint(
    current_user = Depends(get_current_local_user)
):
    # Access current_user.id, current_user.email, etc.
    return {"message": f"Hello, {current_user.name}"}
```

For lightweight auth checks where you only need the user ID:

```python
from app.core.security import get_auth_user_id

@router.get("/quick-check")
async def quick_check(
    user_id: str = Depends(get_auth_user_id)
):
    return {"user_id": user_id}
```

## Next Steps

After setting up the basic authentication system, consider:

1. Implementing role-based access control for different user types
2. Adding password reset functionality
3. Enabling additional OAuth providers
4. Setting up MFA for enhanced security
