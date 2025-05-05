# Authentication Testing Plan

This document outlines the steps to test the newly implemented Supabase authentication flow.

## Prerequisites

1. Supabase project set up with:
   - Auth enabled
   - Database migration (`supabase_user_profiles.sql`) applied
   - At least one test user created

2. Backend running with updated authentication:
   - JWT validation simplified
   - User synchronization through tokens
   - `get_current_local_user` dependency working

3. Frontend running with:
   - Updated `AuthContext`
   - Improved API service with token management

## Test Cases

### 1. User Signup

**Steps:**
1. Navigate to the signup page
2. Fill in email, password, first name, and last name
3. Submit the form
4. Check email for verification link
5. Click the verification link

**Expected Results:**
- User receives verification email
- Clicking link confirms email
- User is redirected to login
- Supabase console shows user created
- Profiles table has entry for user

### 2. User Login (Email/Password)

**Steps:**
1. Navigate to login page
2. Enter email and password for a confirmed user
3. Submit the form

**Expected Results:**
- User is logged in successfully
- Redirect to `/app` route
- Console logs show successful authentication
- Backend API requests include the JWT token
- Frontend shows authenticated user data (name, email)

### 3. Social Login (Google)

**Steps:**
1. Navigate to login page
2. Click "Continue with Google"
3. Complete Google OAuth flow

**Expected Results:**
- Google auth flow completes
- User is redirected back to app
- Console shows successful login
- Backend API requests include JWT token
- User profile synchronized to backend

### 4. Token Refresh

**Steps:**
1. Login as a user
2. Artificially expire token (can be simulated in code for testing)
3. Make an API request

**Expected Results:**
- ApiService detects 401 response
- Token refresh is attempted
- Request is retried with new token
- Console shows successful refresh

### 5. Session Persistence

**Steps:**
1. Login as a user
2. Close browser or tab
3. Reopen app in new tab

**Expected Results:**
- User session is restored
- No login prompt appears
- Authentication state is preserved
- API requests work without interruption

### 6. Logout

**Steps:**
1. Login as a user
2. Click logout button

**Expected Results:**
- User is logged out
- Session is cleared from Supabase
- LocalStorage token is removed
- User is redirected to login page
- Protected routes are inaccessible

### 7. Profile Management

**Steps:**
1. Login as a user
2. Navigate to profile page
3. Update profile information
4. Save changes

**Expected Results:**
- Profile updates are saved to Supabase
- Updated data shows immediately in UI
- User metadata is synchronized

### 8. Authorization & Access Control

**Steps:**
1. Login as regular user
2. Attempt to access admin-only routes or features
3. Login as admin user
4. Access the same routes/features

**Expected Results:**
- Regular user denied access to admin features
- Admin user granted access to admin features
- RLS policies enforced correctly
- Backend respects user roles

### 9. Error Handling

**Steps:**
1. Attempt to login with invalid credentials
2. Try to access protected route without authentication
3. Tamper with JWT token in local storage
4. Attempt to register with existing email

**Expected Results:**
- Meaningful error messages displayed
- Auth state remains consistent
- Security not compromised
- User experience smooth despite errors

## Troubleshooting Guide

### Common Issues:

1. **JWT Validation Failures**
   - Check Supabase URL and JWT audience settings
   - Ensure token is being correctly passed in headers
   - Verify backend security.py is using correct validation

2. **Missing User Profile**
   - Check Supabase trigger for profile creation
   - Look for errors in profile fetching or creation
   - Verify database tables and permissions

3. **Token Refresh Issues**
   - Test token expiration handling
   - Check for console errors during refresh
   - Verify ApiService refresh implementation

4. **CORS Errors**
   - Ensure backend CORS settings allow frontend origin
   - Check for protocol mismatches (http vs https)
   - Verify headers being sent with requests

5. **Role-Based Access Control**
   - Verify user roles in database
   - Check RLS policies implementation
   - Test permissions with different user types

## Deploy Check

Before final deployment, verify:

1. All environment variables are set correctly
2. Database migrations run successfully 
3. Auth hooks and triggers working
4. Session persistence testing in production environment
5. Email verification flow working with production URLs