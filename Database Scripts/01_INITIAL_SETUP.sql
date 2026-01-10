-- ==========================================
-- 01. INITIAL SETUP
-- ==========================================
-- ⚠️ WARNING: Run this ONLY on a fresh database.
-- It creates extensions, enums, and tables.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. ENUMS
do $$ begin
  create type user_level as enum ('Beginner', 'Intermediate', 'Advanced');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('admin', 'learner', 'team_leader');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('pending', 'submitted', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type proof_type as enum ('file', 'link', 'text');
exception when duplicate_object then null; end $$;

do $$ begin
  create type track_type_enum as enum ('data', 'english', 'soft', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type english_level_enum as enum ('A', 'B', 'C');
exception when duplicate_object then null; end $$;

-- 3. TABLES

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null,
  avatar_url text,
  level user_level default 'Beginner',
  english_level english_level_enum default 'B',
  role app_role default 'learner',
  xp_total integer default 0,
  overall_progress integer default 0,
  data_progress integer default 0,
  english_progress integer default 0,
  soft_progress integer default 0,
  streak_days integer default 0,
  join_date timestamp with time zone default timezone('utc'::text, now()),
  governorate text,
  membership_number text,
  email text,
  phone_number text,
  placement_test_url text,
  status text default 'pending',
  last_streak_date date,
  team_id uuid, -- Added for Teams structure
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- VIEW FOR CHAT DISPLAY
create or replace view public.public_profiles 
with (security_invoker = on) as
select 
  id,
  full_name,
  avatar_url,
  level,
  english_level,
  team_id
from public.profiles;

-- TEAMS
create table if not exists public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    leader_id UUID REFERENCES auth.users(id) NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Foreign Key to Profiles (circular dependency handling if created together, but okay in sequence)
-- Note: profiles.team_id references teams.id. Since profiles is created first, we can alter it here or keep reliance on alter set later.
-- For initial setup script, clean way is:
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);
EXCEPTION WHEN undefined_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

-- USER_ROLES
create table if not exists public.user_roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role app_role default 'learner',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, role)
);

-- BADGES
create table if not exists public.badges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  icon_path text,
  xp_required integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- USER_BADGES
create table if not exists public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now())
);

-- LESSONS
create table if not exists public.lessons (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  track_type track_type_enum not null, 
  level user_level,
  english_level english_level_enum,
  published boolean default false,
  order_index integer,
  video_link text,
  duration_minutes integer,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- TASKS
create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  track_type track_type_enum not null, 
  level user_level,
  english_level english_level_enum,
  xp integer default 10,
  published boolean default false,
  resource_link text,
  deadline timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- USER_TASKS
create table if not exists public.user_tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  status task_status default 'pending',
  proof_type proof_type,
  completion_proof text,
  admin_feedback text,
  xp_granted integer,
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, task_id)
);

-- USER_LESSONS
create table if not exists public.user_lessons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  watched boolean default false,
  watched_at timestamp with time zone,
  xp_granted integer,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, lesson_id)
);

-- CUSTOM_LESSONS
create table if not exists public.custom_lessons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  video_link text,
  track_type text default 'data' not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- CUSTOM_TASKS
create table if not exists public.custom_tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  track_type text default 'data' not null,
  xp_value integer default 10,
  completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ACTIVITIES
create table if not exists public.activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type text not null,
  description text not null,
  xp_earned integer default 0,
  related_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- DAILY_CHECKIN
create table if not exists public.daily_checkin (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default CURRENT_DATE,
  data_task boolean default false,
  lang_task boolean default false,
  soft_task boolean default false,
  xp_generated integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, date)
);

-- CHAT_MESSAGES
create table if not exists public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  image_url text,
  level_classroom user_level,
  lesson_id uuid references public.lessons(id) on delete set null,
  parent_message_id uuid references public.chat_messages(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info',
  read boolean default false,
  related_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- POSTS
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  image_url text,
  video_url text,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('chat-images', 'chat-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true) on conflict (id) do nothing;
