-- Create application tables for Medhastra

-- =====================================
-- CASES TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_text TEXT NOT NULL,
  current_stage VARCHAR NOT NULL DEFAULT 'initial',
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own cases
CREATE POLICY "Users can view own cases" 
  ON public.cases 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own cases
CREATE POLICY "Users can insert own cases" 
  ON public.cases 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cases
CREATE POLICY "Users can update own cases" 
  ON public.cases 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own cases
CREATE POLICY "Users can delete own cases" 
  ON public.cases 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS cases_updated_at ON public.cases;
CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================
-- STAGE RESULTS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS public.stage_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  stage_name VARCHAR NOT NULL,
  result JSONB NOT NULL DEFAULT '{}',
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.stage_results ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view stage results for their own cases
CREATE POLICY "Users can view own stage results" 
  ON public.stage_results 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.cases WHERE id = case_id));

-- Users can insert stage results for their own cases
CREATE POLICY "Users can insert own stage results" 
  ON public.stage_results 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.cases WHERE id = case_id));

-- Users can update stage results for their own cases
CREATE POLICY "Users can update own stage results" 
  ON public.stage_results 
  FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM public.cases WHERE id = case_id));

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS stage_results_updated_at ON public.stage_results;
CREATE TRIGGER stage_results_updated_at
  BEFORE UPDATE ON public.stage_results
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================
-- MESSAGES TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view messages for their own cases
CREATE POLICY "Users can view own messages" 
  ON public.messages 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.cases WHERE id = case_id));

-- Users can insert messages for their own cases
CREATE POLICY "Users can insert own messages" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.cases WHERE id = case_id));

-- =====================================
-- REPORTS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_path VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view reports for their own cases
CREATE POLICY "Users can view own reports" 
  ON public.reports 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.cases WHERE id = case_id));

-- Users can insert reports for their own cases
CREATE POLICY "Users can insert own reports" 
  ON public.reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.cases WHERE id = case_id));