-- ==========================================
-- 02. ADD MISSING COLUMNS
-- ==========================================
-- ⚠️ WARNING: Use this if you already have tables but are missing columns.
-- This script is idempotent (safe to run multiple times).

do $$ 
begin
  -- Example: Adding email and phone_number to profiles if they don't exist
  alter table public.profiles add column if not exists email text;
  alter table public.profiles add column if not exists phone_number text;
  
  -- Add other column migrations here as needed in the future
  -- alter table public.some_table add column if not exists some_column text;
exception
  when others then null;
end $$;
