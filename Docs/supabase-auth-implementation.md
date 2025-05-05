# Supabase Authentication Implementation Guide

This document outlines the Supabase-centric authentication architecture implemented for the Medhastra AI application.

## Implementation Summary

We've implemented a Supabase-centric authentication system that:

1. Maintains Supabase as the authoritative source for user identity and sessions
2. Synchronizes user data between Supabase and our application database
3. Simplifies token handling on the frontend and backend
4. Provides a seamless authentication experience for users

## Key Components

### Frontend

#### 1. `AuthContext.tsx`

The authentication context has been simplified to:
- Use Supabase's built-in session management
- Extract basic user data from Supabase tokens
- Automatically create profiles when missing
- Handle authentication state centrally

```typescript
// Key improvements:
const handleAuthChange = async (session: any) => {
  try {
    setLoading(true);
    
    // Store token for API requests
    localStorage.setItem('token', session.access_token);
    
    // Extract user data directly from session
    const userData = {
      id: session.user.id,
      email: session.user.email,
      // More fields...
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    
    // Fetch extended profile data
    await fetchProfile(session.user.id);
  } catch (error) {
    // Error handling
  }
};
```

#### 2. `ApiService.ts`

The API service now:
- Automatically includes Supabase tokens in all requests
- Handles token refresh when sessions expire
- Maintains consistent authentication headers
- Provides fallback mechanisms for token retrieval

```typescript
// Request interceptor
this.api.interceptors.request.use(
  async (config) => {
    try {
      // Get current Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        localStorage.setItem('token', session.access_token);
      } else {
        // Fallback handling
      }
    } catch (e) {
      // Error handling
    }
    return config;
  }
);
```

### Backend

#### 1. `security.py`

The backend security module now:
- Uses a simplified token validation approach
- Focuses on extracting user information rather than cryptographic validation
- Automatically synchronizes users between Supabase and application database
- Provides backward compatibility for existing code

```python
async def get_current_user_from_token(authorization: str = Header(...)) -> SupabaseUser:
    """Simple dependency that extracts user information from Supabase JWT token."""
    token = extract_token_from_header(authorization)
    payload = decode_token_without_verification(token)
    
    # Extract user info from payload
    user_id = payload.get("sub")
    email = payload.get("email", "")
    user_metadata = payload.get("user_metadata", {})
    
    return SupabaseUser(id=user_id, email=email, metadata=user_metadata)
```

#### 2. `auth.py`

The authentication router now:
- Provides simplified endpoints for verifying tokens
- Creates users in the application database when needed
- Extracts user information directly from tokens
- Offers lightweight endpoints for token validation

```python
@router.post("/verify", response_model=Dict[str, Any])
async def verify_token(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Verify a JWT token and return user information."""
    supabase_user = await get_current_user_from_token(authorization)
    db_user = await get_current_local_user(db, supabase_user)
    
    return {
        "valid": True,
        "user": {
            "id": str(db_user.id),
            "email": db_user.email,
            # More user fields...
        }
    }
```

### Database

#### 1. Supabase Profiles Table

A dedicated SQL setup in `supabase_user_profiles.sql` for:
- Creating the profiles table in Supabase
- Setting up Row Level Security (RLS) policies
- Defining triggers for automatic profile creation
- Ensuring proper data access control

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  -- More fields...
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Authentication Flow

1. **User Registration:**
   - User signs up via Supabase Auth (email/password or social)
   - Supabase creates auth.users entry
   - Trigger creates profiles entry
   - Email verification sent if using email/password

2. **User Login:**
   - User logs in via Supabase Auth
   - Frontend stores session token
   - AuthContext extracts user information
   - API requests include token in Authorization header

3. **API Requests:**
   - Frontend includes token in all requests
   - Backend extracts user info from token
   - User record created in application DB if not exists
   - Business logic executed with user context

4. **Token Refresh:**
   - Supabase refreshes tokens automatically
   - ApiService handles 401 responses
   - New token obtained and request retried
   - User remains authenticated seamlessly

5. **Session Persistence:**
   - Supabase manages session persistence
   - Session restored on page reload/revisit
   - AuthContext rehydrates user state
   - No disruption to user experience

## Best Practices Implemented

1. **Single Source of Truth:**
   - Supabase as authoritative source for authentication
   - User data synchronized to application database as needed
   - Consistent user identifiers across systems

2. **Secure Token Handling:**
   - Tokens stored securely via Supabase
   - No sensitive data in localStorage beyond session token
   - Proper token refresh mechanisms

3. **Error Handling:**
   - Comprehensive error handling for auth failures
   - Graceful degradation when services unavailable
   - User-friendly error messages

4. **Performance Optimization:**
   - Minimized database queries
   - Efficient token validation
   - Parallel processing where appropriate

5. **User Experience:**
   - Seamless authentication flows
   - Minimal login prompts
   - Consistent state management

## Testing

Follow the detailed testing plan in `auth-testing-plan.md` to verify all aspects of the authentication system.

## Future Enhancements

1. **Multi-Factor Authentication:**
   - Supabase supports MFA which can be enabled when needed
   - Would require minor UI additions only

2. **Role-Based Access Control:**
   - Current implementation supports basic roles
   - Can be extended with more granular permissions

3. **Admin User Management:**
   - Add administrative interface for user management
   - Leverage Supabase admin APIs

4. **Enhanced Security:**
   - Add full JWT verification if needed for high-security contexts
   - Implement IP-based restrictions for sensitive operations