-- =====================================================
-- Supabase Row Level Security (RLS) Setup Script
-- =====================================================
-- This script sets up RLS policies for MedhastraAI application
-- Run this in your Supabase SQL Editor

-- Enable RLS on all tables
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table (if using local users table)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on cases table
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Enable RLS on stage_results table
ALTER TABLE stage_results ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_profiles table (if exists)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- =====================================================
-- USERS TABLE POLICIES (Local users table)
-- =====================================================

-- Policy: Users can view their own user record
CREATE POLICY "Users can view own user record" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can insert their own user record
CREATE POLICY "Users can insert own user record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own user record
CREATE POLICY "Users can update own user record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- CASES TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own cases
CREATE POLICY "Users can view own cases" ON cases
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own cases
CREATE POLICY "Users can insert own cases" ON cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cases
CREATE POLICY "Users can update own cases" ON cases
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own cases
CREATE POLICY "Users can delete own cases" ON cases
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STAGE_RESULTS TABLE POLICIES
-- =====================================================

-- Policy: Users can view stage results for their own cases
CREATE POLICY "Users can view own stage results" ON stage_results
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM cases WHERE id = stage_results.case_id));

-- Policy: Users can insert stage results for their own cases
CREATE POLICY "Users can insert own stage results" ON stage_results
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM cases WHERE id = stage_results.case_id));

-- Policy: Users can update stage results for their own cases
CREATE POLICY "Users can update own stage results" ON stage_results
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM cases WHERE id = stage_results.case_id));

-- Policy: Users can delete stage results for their own cases
CREATE POLICY "Users can delete own stage results" ON stage_results
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM cases WHERE id = stage_results.case_id));

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- Policy: Users can view messages for their own cases
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM cases WHERE id = messages.case_id));

-- Policy: Users can insert messages for their own cases
CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM cases WHERE id = messages.case_id));

-- Policy: Users can update messages for their own cases
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM cases WHERE id = messages.case_id));

-- Policy: Users can delete messages for their own cases
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM cases WHERE id = messages.case_id));

-- =====================================================
-- REPORTS TABLE POLICIES
-- =====================================================

-- Policy: Users can view reports for their own cases
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM cases WHERE id = reports.case_id));

-- Policy: Users can insert reports for their own cases
CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM cases WHERE id = reports.case_id));

-- Policy: Users can update reports for their own cases
CREATE POLICY "Users can update own reports" ON reports
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM cases WHERE id = reports.case_id));

-- Policy: Users can delete reports for their own cases
CREATE POLICY "Users can delete own reports" ON reports
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM cases WHERE id = reports.case_id));

-- =====================================================
-- USER_PROFILES TABLE POLICIES (if exists)
-- =====================================================

-- Policy: Users can view their own user profile
CREATE POLICY "Users can view own user profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own user profile
CREATE POLICY "Users can insert own user profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own user profile
CREATE POLICY "Users can update own user profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own user profile
CREATE POLICY "Users can delete own user profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SERVICE ROLE BYPASS (for backend operations)
-- =====================================================

-- Grant service role access to bypass RLS for administrative operations
-- This allows your backend service role to perform operations without RLS restrictions

-- Note: Be careful with service role access in production
-- Only use service role for specific administrative tasks

-- Example: Allow service role to read all profiles (useful for user lookup)
CREATE POLICY "Service role can access profiles" ON profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Example: Allow service role to access all users
CREATE POLICY "Service role can access users" ON users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- ADDITIONAL FUNCTIONS (Optional)
-- =====================================================

-- Function to check if user owns a case (useful for complex policies)
CREATE OR REPLACE FUNCTION user_owns_case(case_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cases 
    WHERE id = case_uuid 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role from JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role', 
    'user'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR AUTO-CREATING USER PROFILES
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PROFILE TABLE SCHEMA (Optional - for reference)
-- =====================================================

-- CREATE TABLE public.profiles (
--   id UUID REFERENCES auth.users(id) PRIMARY KEY,
--   full_name TEXT,
--   username TEXT UNIQUE,
--   avatar_url TEXT,
--   website TEXT,
--   is_onboarded BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =====================================================
-- STORAGE POLICIES (if using Supabase Storage)
-- =====================================================

-- Example storage policies for user avatars
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload their own avatar" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'avatars' 
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can update their own avatar" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'avatars' 
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );

-- =====================================================
-- CLEANUP COMMANDS (if needed)
-- =====================================================

-- -- Drop all policies (use with caution!)
-- -- DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
-- -- DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
-- -- ... (repeat for all policies)

-- -- Disable RLS (use with caution!)
-- -- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- -- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- -- ... (repeat for all tables) 