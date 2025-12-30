-- ==========================================
-- 05. UPDATE ENGLISH LEVEL
-- ==========================================
-- Migration script to add 'english_level' to the system.

-- 1. Create Enum
do $$ begin
  create type english_level_enum as enum ('A', 'B', 'C');
exception when duplicate_object then null; end $$;

-- 2. Update Profiles
-- Add english_level column with default 'B'
alter table public.profiles 
add column if not exists english_level english_level_enum default 'B';

-- 3. Update Lessons
-- Add english_level column (nullable, as it only applies to English track)
alter table public.lessons 
add column if not exists english_level english_level_enum;

-- 4. Update Tasks
-- Add english_level column (nullable)
alter table public.tasks 
add column if not exists english_level english_level_enum;

-- 5. Force update existing profiles to have 'B' if null (safety check)
update public.profiles set english_level = 'B' where english_level is null;
