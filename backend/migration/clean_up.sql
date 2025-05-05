-- Drop the trigger from auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the handle_new_user function first as it's called by the trigger above
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables using CASCADE
-- CASCADE will handle dependent objects like foreign keys, indexes, and table-specific triggers (like update_users_updated_at)
DROP TABLE IF EXISTS public.billing_history CASCADE;
DROP TABLE IF EXISTS public.usage_tracking CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- Depends on auth.users, CASCADE handles FK

-- Now drop the timestamp update function, as dependent triggers on tables are gone
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop custom enum types
DROP TYPE IF EXISTS public.subscription_status;
DROP TYPE IF EXISTS public.subscription_tier;
DROP TYPE IF EXISTS public.user_role;

-- Note: Extensions uuid-ossp and pgcrypto are generally safe to leave enabled.