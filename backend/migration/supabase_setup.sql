-- Supabase Complete Auth and Database Setup
-- Run this script in the Supabase SQL Editor to set up all necessary tables and functions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Removed enum type user_role

-- =====================================
-- PROFILES TABLE AND RLS (Simplified)
-- =====================================

-- Create simplified profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT, -- Optional: Keep if you plan to use avatars
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile only
CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Removed Admin and Service role policies for simplification

-- =====================================
-- TIMESTAMPS HANDLING
-- =====================================

-- Add a function to manage "updated_at"
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================
-- USER CREATION TRIGGER (Simplified)
-- =====================================

-- Create a simplified trigger function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_first_name TEXT;
  meta_last_name TEXT;
BEGIN
  -- Log the trigger activation and basic info
  RAISE NOTICE '[handle_new_user] Simplified trigger fired for user ID: %', new.id;
  RAISE NOTICE '[handle_new_user] Raw metadata: %', new.raw_user_meta_data;

  -- Extract only essential metadata (first_name, last_name)
  -- Use COALESCE to provide empty string defaults if metadata is missing
  meta_first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
  meta_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');

  RAISE NOTICE '[handle_new_user] Extracted first_name: %', meta_first_name;
  RAISE NOTICE '[handle_new_user] Extracted last_name: %', meta_last_name;

  -- Attempt the simplified insert
  RAISE NOTICE '[handle_new_user] Attempting simplified INSERT into public.profiles...';
  BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (new.id, meta_first_name, meta_last_name);

    RAISE NOTICE '[handle_new_user] Simplified INSERT successful for user ID: %', new.id;

  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE '[handle_new_user] EXCEPTION: Unique constraint violation (profile likely already exists) for user ID: %. SQLSTATE: %, SQLERRM: %', new.id, SQLSTATE, SQLERRM;
      -- Do not re-raise, allow the transaction to succeed if profile exists
    WHEN others THEN
      RAISE NOTICE '[handle_new_user] EXCEPTION during simplified INSERT for user ID: %. SQLSTATE: %, SQLERRM: %', new.id, SQLSTATE, SQLERRM;
      -- Re-raise other errors to make them visible
      RAISE;
  END;

  RETURN new; -- Important: Always return the new user record
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Set search_path if needed, but might be okay with simplified function
-- ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================
-- HELPER VIEWS (Removed for simplification)
-- =====================================

-- =====================================
-- USER PROFILE MANAGEMENT FUNCTIONS (Removed for simplification)
-- =====================================
