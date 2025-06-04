-- =====================================================
-- Supabase Row Level Security (RLS) Setup Script
-- =====================================================
-- This script sets up RLS policies for MedhastraAI application
-- Run this AFTER running supabase_schema_migration.sql

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- =====================================================
-- USERS TABLE POLICIES (Local users table)
-- =====================================================

-- Policy: Users can view their own user record
CREATE POLICY "Users can view own user record" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can insert their own user record
CREATE POLICY "Users can insert own user record" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own user record
CREATE POLICY "Users can update own user record" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- USER_PROFILES TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own user profile
CREATE POLICY "Users can view own user profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own user profile
CREATE POLICY "Users can insert own user profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own user profile
CREATE POLICY "Users can update own user profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own user profile
CREATE POLICY "Users can delete own user profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CASES TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own cases
CREATE POLICY "Users can view own cases" ON public.cases
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own cases
CREATE POLICY "Users can insert own cases" ON public.cases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cases
CREATE POLICY "Users can update own cases" ON public.cases
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own cases
CREATE POLICY "Users can delete own cases" ON public.cases
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STAGE_RESULTS TABLE POLICIES
-- =====================================================

-- Policy: Users can view stage results for their own cases
CREATE POLICY "Users can view own stage results" ON public.stage_results
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = stage_results.case_id)
    );

-- Policy: Users can insert stage results for their own cases
CREATE POLICY "Users can insert own stage results" ON public.stage_results
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = stage_results.case_id)
    );

-- Policy: Users can update stage results for their own cases
CREATE POLICY "Users can update own stage results" ON public.stage_results
    FOR UPDATE USING (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = stage_results.case_id)
    );

-- Policy: Users can delete stage results for their own cases
CREATE POLICY "Users can delete own stage results" ON public.stage_results
    FOR DELETE USING (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = stage_results.case_id)
    );

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- Policy: Users can view messages for their own cases
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = messages.case_id)
    );

-- Policy: Users can insert messages for their own cases
CREATE POLICY "Users can insert own messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = messages.case_id)
    );

-- Policy: Users can update messages for their own cases
CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = messages.case_id)
    );

-- Policy: Users can delete messages for their own cases
CREATE POLICY "Users can delete own messages" ON public.messages
    FOR DELETE USING (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = messages.case_id)
    );

-- =====================================================
-- REPORTS TABLE POLICIES
-- =====================================================

-- Policy: Users can view reports for their own cases
CREATE POLICY "Users can view own reports" ON public.reports
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = reports.case_id)
    );

-- Policy: Users can insert reports for their own cases
CREATE POLICY "Users can insert own reports" ON public.reports
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = reports.case_id)
    );

-- Policy: Users can update reports for their own cases
CREATE POLICY "Users can update own reports" ON public.reports
    FOR UPDATE USING (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = reports.case_id)
    );

-- Policy: Users can delete reports for their own cases
CREATE POLICY "Users can delete own reports" ON public.reports
    FOR DELETE USING (
        auth.uid() = (SELECT user_id FROM public.cases WHERE id = reports.case_id)
    );

-- =====================================================
-- SERVICE ROLE BYPASS (for backend operations)
-- =====================================================

-- Grant service role access to bypass RLS for administrative operations
-- This allows your backend service role to perform operations without RLS restrictions

-- Service role can access all profiles
CREATE POLICY "Service role can access profiles" ON public.profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Service role can access all users
CREATE POLICY "Service role can access users" ON public.users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Service role can access all user profiles
CREATE POLICY "Service role can access user profiles" ON public.user_profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Service role can access all cases
CREATE POLICY "Service role can access cases" ON public.cases
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Service role can access all stage results
CREATE POLICY "Service role can access stage results" ON public.stage_results
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Service role can access all messages
CREATE POLICY "Service role can access messages" ON public.messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Service role can access all reports
CREATE POLICY "Service role can access reports" ON public.reports
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to check if user owns a case
CREATE OR REPLACE FUNCTION public.user_owns_case(case_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.cases 
        WHERE id = case_uuid 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'users', 'user_profiles', 'cases', 'stage_results', 'messages', 'reports')
ORDER BY tablename;

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- TROUBLESHOOTING QUERIES
-- =====================================================

-- Test current user context
-- SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- Test profile access (should only return current user's profile)
-- SELECT * FROM public.profiles WHERE id = auth.uid();

-- Test case access (should only return current user's cases)
-- SELECT id, case_text, user_id FROM public.cases WHERE user_id = auth.uid();

-- =====================================================
-- NOTES
-- =====================================================

-- 1. Run this script as a superuser (postgres role) in Supabase SQL Editor
-- 2. Test with different users to ensure policies work correctly
-- 3. Monitor performance impact of complex RLS policies
-- 4. Consider using indexes on columns used in RLS policies (already added in schema)
-- 5. Be careful with service role access in production
-- 6. Regularly audit RLS policies for security 