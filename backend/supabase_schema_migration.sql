-- =====================================================
-- MedhastraAI Supabase Schema Migration Script
-- =====================================================
-- This script creates all necessary tables in Supabase PostgreSQL
-- Run this in your Supabase SQL Editor

-- =====================================================
-- EXTENSIONS
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (for Supabase Auth integration)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    username TEXT,
    avatar_url TEXT,
    website TEXT,
    is_onboarded BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'doctor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USERS TABLE (Local user management)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    hashed_password TEXT, -- Can be null for external auth
    is_active BOOLEAN DEFAULT TRUE,
    role TEXT DEFAULT 'doctor',
    is_onboarded BOOLEAN DEFAULT FALSE,
    auth_provider TEXT DEFAULT 'supabase',
    subscription_tier TEXT DEFAULT 'free' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER_PROFILES TABLE (Extended user information)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    phone_number TEXT,
    company_name TEXT,
    job_title TEXT,
    country TEXT,
    timezone TEXT,
    language TEXT,
    avatar_url TEXT,
    profile_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CASES TABLE (Patient cases)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    case_text TEXT NOT NULL,
    current_stage TEXT NOT NULL DEFAULT 'initial',
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STAGE_RESULTS TABLE (Diagnosis workflow results)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stage_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    stage_name TEXT NOT NULL,
    result JSONB NOT NULL DEFAULT '{}',
    is_approved BOOLEAN DEFAULT FALSE,
    token_usage INTEGER,
    cost_usd DECIMAL(10,4),
    provider TEXT,
    model_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MESSAGES TABLE (Chat messages)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REPORTS TABLE (Generated reports)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    report_type TEXT DEFAULT 'pdf',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Cases indexes
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON public.cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON public.cases(updated_at DESC);

-- Stage results indexes
CREATE INDEX IF NOT EXISTS idx_stage_results_case_id ON public.stage_results(case_id);
CREATE INDEX IF NOT EXISTS idx_stage_results_stage_name ON public.stage_results(stage_name);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_case_id ON public.messages(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_case_id ON public.reports(case_id);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at 
    BEFORE UPDATE ON public.cases 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stage_results_updated_at 
    BEFORE UPDATE ON public.stage_results 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUTOMATIC PROFILE CREATION
-- =====================================================

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'doctor')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'users', 'user_profiles', 'cases', 'stage_results', 'messages', 'reports')
ORDER BY table_name;

-- Check indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('cases', 'stage_results', 'messages', 'reports', 'user_profiles')
ORDER BY tablename, indexname; 