-- First, clean up existing tables and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Drop existing tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.stage_results CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create updated_at timestamp handler function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for updated_at on profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_first_name TEXT;
  meta_last_name TEXT;
BEGIN
  -- Extract metadata
  meta_first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
  meta_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');

  -- Insert into profiles
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (new.id, meta_first_name, meta_last_name);

  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create cases table
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  case_text TEXT NOT NULL,
  current_stage VARCHAR NOT NULL DEFAULT 'initial',
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Create policies for cases
CREATE POLICY "Users can view own cases" 
  ON public.cases 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cases" 
  ON public.cases 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cases" 
  ON public.cases 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cases" 
  ON public.cases 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on cases
CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create stage_results table
CREATE TABLE IF NOT EXISTS public.stage_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  stage_name VARCHAR NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on stage_results
ALTER TABLE public.stage_results ENABLE ROW LEVEL SECURITY;

-- Create policies for stage_results
CREATE POLICY "Users can view own stage results" 
  ON public.stage_results 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.cases WHERE id = stage_results.case_id));

CREATE POLICY "Users can insert own stage results" 
  ON public.stage_results 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.cases WHERE id = stage_results.case_id));

CREATE POLICY "Users can update own stage results" 
  ON public.stage_results 
  FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM public.cases WHERE id = stage_results.case_id));

-- Add trigger for updated_at on stage_results
CREATE TRIGGER stage_results_updated_at
  BEFORE UPDATE ON public.stage_results
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view own messages" 
  ON public.messages 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.cases WHERE id = messages.case_id));

CREATE POLICY "Users can insert own messages" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.cases WHERE id = messages.case_id));

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_path VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reports
CREATE POLICY "Users can view own reports" 
  ON public.reports 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.cases WHERE id = reports.case_id));

CREATE POLICY "Users can insert own reports" 
  ON public.reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.cases WHERE id = reports.case_id));