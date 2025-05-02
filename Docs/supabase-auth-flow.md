# Supabase Authentication Flow

This document describes the authentication flow for Medhastra AI using Supabase.

## Architecture Overview

Medhastra AI uses Supabase for authentication and user data storage. The application leverages Supabase's trigger system to automatically synchronize user data between the auth and public schemas.

```
┌──────────────────┐      ┌────────────────┐      ┌─────────────────┐
│  Supabase Auth   │      │  Supabase DB   │      │  Frontend App   │
│  (auth.users)    │──┬──►│  (public.users)│◄────►│  (React)        │
└──────────────────┘  │   └────────────────┘      └─────────────────┘
                      │
                      │   ┌────────────────┐
                      └──►│  DB Trigger    │
                          │ handle_new_user│
                          └────────────────┘
```

## Database Structure

The database consists of the following tables:

1. **auth.users**: Managed by Supabase Auth, contains authentication data
2. **public.users**: Contains application-specific user data
3. **public.user_profiles**: Contains additional user profile data
4. **public.subscriptions**: Tracks user subscription status
5. **public.usage_tracking**: Tracks feature usage
6. **public.billing_history**: Records billing transactions

## Automatic Synchronization

The key to this architecture is the automatic synchronization handled by the `handle_new_user()` database function and `on_auth_user_created` trigger. 

When a user signs up through Supabase Auth:

1. A record is created in `auth.users`
2. The `on_auth_user_created` trigger fires
3. The `handle_new_user()` function automatically:
   - Creates a record in `public.users`
   - Creates a record in `public.user_profiles`
   - Creates an initial free subscription in `public.subscriptions`

This trigger-based approach ensures that user data is always synchronized across the auth and public schemas.

## Authentication Flow

1. **User Sign Up**:
   - User enters email, password, name
   - Frontend calls `supabase.auth.signUp()`
   - Supabase creates record in `auth.users`
   - Trigger creates records in `public` schema tables
   - User is sent email verification

2. **Email Verification**:
   - User clicks verification link
   - Supabase marks user as verified
   - Frontend redirects to login

3. **User Login**:
   - User enters email and password
   - Frontend calls `supabase.auth.signInWithPassword()`
   - Supabase returns JWT token
   - Frontend stores token in localStorage
   - Frontend calls `getUser()` to retrieve user data from `public.users`
   - Frontend sets authentication state based on response

4. **Session Recovery**:
   - On page load, frontend calls `supabase.auth.getSession()`
   - If session exists, frontend calls `getUser()` to load user data
   - Authentication state is set based on response

## Frontend Implementation

### AuthContext.tsx

The `AuthContext.tsx` component manages authentication state. Key functions:

- `fetchAndSetUser()`: Loads user data from Supabase public schema tables
- `signIn()`: Handles user login 
- `signUp()`: Handles new user registration
- `signOut()`: Handles user logout

The component relies on the Supabase trigger to handle user creation automatically.

### UserService.ts

The `UserService.ts` class provides methods for interacting with user data:

- `getUser()`: Fetches user data from public.users
- `getProfile()`: Fetches profile data from public.user_profiles
- `updateUser()`: Updates user data
- `updateProfile()`: Updates profile data
- `waitForUserCreation()`: Helper method to wait for trigger to complete

## Troubleshooting

If you encounter issues with user data not appearing in the public schema:

1. Verify that the DB trigger is correctly installed:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. Check for errors in the Supabase logs.

3. Manually run the `handle_new_user()` function for a specific user:

```sql
SELECT handle_new_user(auth.users.*) FROM auth.users WHERE id = 'user_id';
```

## Security Considerations

1. Row Level Security (RLS) policies are in place to restrict access to user data.
2. Users can only view and modify their own data.
3. JWT tokens are validated before allowing access to sensitive operations.

## Migration from Previous Implementation

The previous implementation attempted to manually create user records in the backend. This has been replaced with a more robust trigger-based approach that leverages Supabase's built-in capabilities.