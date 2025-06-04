# Supabase Integration Guide

This document outlines the Supabase authentication and database integration that has been ported from the `render-dep` branch to the current `medhastra_v2` branch.

## Overview

The integration provides:
- **Secure JWT Authentication** with HS256 signature verification
- **Row Level Security (RLS)** for data protection
- **User Profiles and Management** 
- **Medical Case Database Integration**
- **Comprehensive Authentication Flow**

## Backend Changes

### 1. Enhanced Configuration (`backend/app/core/config.py`)

**New Environment Variables Required:**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-settings
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_SERVICE_KEY=your-service-role-key

# Database (should point to your Supabase PostgreSQL database)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Key Changes:**
- Added `SUPABASE_JWT_SECRET` for proper JWT verification
- Added `SUPABASE_JWT_ALGORITHMS` for HS256 support
- Enhanced CORS configuration with Supabase issuer validation
- Added async PostgreSQL database URL property

### 2. Supabase Client Integration (`backend/app/core/supabase_client.py`)

**New File Created:**
- Provides Supabase client using service role for backend operations
- Enables direct database queries and operations
- Used for user profile fetching and management

### 3. Enhanced Security (`backend/app/core/security.py`)

**Major Security Improvements:**
- **Proper JWT Verification** using `python-jose` with HS256 shared secret
- **Token Validation** with audience and issuer checking
- **Supabase User Profile Integration** 
- **Enhanced Error Handling** with detailed security messages

**New Functions:**
- `verify_jwt()` - Cryptographically verify JWT tokens
- `get_supabase_user()` - Fetch user with profile from Supabase
- `get_supabase_user_from_token()` - Get user from raw token
- `get_auth_user_id()` - Extract user ID without full profile fetch

### 4. Updated Dependencies (`backend/requirements.txt`)

**Added:**
```
supabase>=2.7.0  # Supabase Python client
```

### 5. Database Security Setup (`backend/supabase_rls_setup.sql`)

**New File Created:**
- **Row Level Security (RLS)** policies for all tables
- **User-specific data access** ensuring users only see their own data
- **Service role bypass** for administrative operations
- **Automatic profile creation** triggers
- **Comprehensive security policies** for all medical case tables

## Frontend Changes

### 1. Enhanced Supabase Types (`frontend/src/lib/supabase.ts`)

**Added Medical Case Database Types:**
- `Case` - Patient case management
- `StageResult` - Workflow stage results
- `Message` - Chat messages between doctor and AI
- `Report` - Generated PDF reports

**Updated Profile Types:**
- Changed `user_id` to `id` for consistency
- Enhanced database schema definitions

### 2. Enhanced Authentication Context (`frontend/src/contexts/AuthContext.tsx`)

**Improvements:**
- **Token Storage** for API authentication
- **Enhanced Error Handling** with detailed logging
- **Automatic Profile Creation** fallback
- **Comprehensive Session Management**

### 3. Fixed Service Imports

- Updated `CaseService.ts` to use Supabase types
- Fixed TypeScript compilation issues

## Required Supabase Setup

### 1. Database Tables

You need to create these tables in your Supabase database:

```sql
-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  website TEXT,
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cases table (medical cases)
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  case_text TEXT NOT NULL,
  current_stage TEXT NOT NULL DEFAULT 'initial',
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stage results table
CREATE TABLE public.stage_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}',
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Row Level Security

Run the provided `backend/supabase_rls_setup.sql` script in your Supabase SQL Editor to set up comprehensive RLS policies.

### 3. JWT Configuration

In your Supabase project settings:

1. **Project Settings** → **API** → **JWT Settings**
2. Copy the **JWT Secret** (this goes in `SUPABASE_JWT_SECRET`)
3. **Database** → **Settings** → **Connection String**
4. Copy the connection string (this goes in `DATABASE_URL`)

## Environment Variables

### Backend (`.env`)
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-settings
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_SERVICE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# LLM Configuration (updated to use Gemini by default)
LLM_PROVIDER=gemini
LLM_MODEL_NAME=gemini-2.5-pro-preview-03-25
GOOGLE_API_KEY=your-google-api-key
```

### Frontend (`.env`)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## Security Features

### 1. JWT Token Verification
- **Cryptographic verification** using shared secret
- **Audience and issuer validation**
- **Expiration checking**
- **Comprehensive error handling**

### 2. Row Level Security (RLS)
- **User isolation** - users can only access their own data
- **Case ownership** - stage results, messages, and reports tied to case ownership
- **Service role bypass** for administrative operations
- **Automatic profile creation** via database triggers

### 3. API Authentication
- **Token-based authentication** for all API endpoints
- **User context injection** in route handlers
- **Flexible authentication dependencies** (user ID only vs full profile)

## Usage Examples

### Backend Route Protection
```python
from app.core.security import get_supabase_user, get_auth_user_id

# Get full user with profile
@app.get("/protected-route")
async def protected_route(user: SupabaseUser = Depends(get_supabase_user)):
    return {"user_id": user.id, "email": user.email}

# Get just user ID for lightweight operations
@app.get("/user-specific")
async def user_specific(user_id: str = Depends(get_auth_user_id)):
    return {"user_id": user_id}
```

### Frontend Authentication
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, profile, signIn, signOut, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Welcome, {user.first_name}!</div>;
}
```

## Migration Notes

### From Current Implementation
1. **JWT Verification**: Upgraded from no verification to cryptographic verification
2. **User Profiles**: Added comprehensive profile management
3. **Database Integration**: Added direct Supabase database operations
4. **Security**: Implemented comprehensive RLS policies

### Backward Compatibility
- **Existing API endpoints** continue to work
- **User model** remains compatible
- **Legacy authentication functions** maintained for compatibility

## Testing the Integration

### 1. Backend Testing
```bash
cd backend
python -m py_compile app/core/config.py app/core/security.py app/core/supabase_client.py
```

### 2. Frontend Testing
```bash
cd frontend
npx tsc --noEmit
```

### 3. Authentication Flow Testing
1. **Sign up** a new user
2. **Verify** profile creation
3. **Test** protected API endpoints
4. **Verify** RLS policies work correctly

## Troubleshooting

### Common Issues

1. **JWT Verification Fails**
   - Check `SUPABASE_JWT_SECRET` is correctly set
   - Verify the secret matches Supabase project settings

2. **Profile Not Found**
   - Ensure RLS policies are properly set up
   - Check if profile creation trigger is working

3. **Database Connection Issues**
   - Verify `DATABASE_URL` format and credentials
   - Check Supabase project is not paused

4. **CORS Issues**
   - Ensure frontend URL is in `ALLOWED_CORS_ORIGINS`
   - Check Supabase project settings allow your domain

## Next Steps

1. **Deploy** the updated application
2. **Set up** environment variables in production
3. **Run** RLS setup script in Supabase
4. **Test** authentication flow end-to-end
5. **Monitor** security logs and user activity

This integration provides a robust, secure foundation for user authentication and data management in the Medhastra AI application. 