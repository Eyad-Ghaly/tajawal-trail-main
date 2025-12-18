-- ==========================================
-- MASTER DATABASE SETUP (Tajawal Trail)
-- ==========================================
-- This script is the definitive setup for the project.
-- It includes:
-- 1. All necessary extensions and enums.
-- 2. Full table schema with custom track support.
-- 3. Public profiles view for chat display.
-- 4. Corrected handle_new_user trigger (populates profiles and user_roles).
-- 5. Row Level Security policies.
-- 6. Initial admin user creation.
-- ==========================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. ENUMS
do $$ begin
  create type user_level as enum ('Beginner', 'Intermediate', 'Advanced');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('admin', 'learner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('pending', 'submitted', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type proof_type as enum ('file', 'link', 'text');
exception when duplicate_object then null; end $$;

-- 3. TABLES

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null,
  avatar_url text,
  level user_level,
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
  placement_test_url text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- CHAT DISPLAY VIEW
create or replace view public.public_profiles as
select 
  id,
  full_name,
  avatar_url,
  level
from public.profiles;

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
  track_type text not null, 
  level user_level,
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
  track_type text not null,
  level user_level,
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

-- 4. ENABLE RLS
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table lessons enable row level security;
alter table tasks enable row level security;
alter table user_tasks enable row level security;
alter table user_lessons enable row level security;
alter table custom_lessons enable row level security;
alter table activities enable row level security;
alter table daily_checkin enable row level security;
alter table chat_messages enable row level security;
alter table notifications enable row level security;

-- 5. RLS POLICIES
do $$ begin
  -- General SELECT for view
  grant select on public.public_profiles to authenticated;
  grant select on public.public_profiles to anon;

  -- Profile policies
  drop policy if exists "Public profiles viewable" on profiles;
  create policy "Public profiles viewable" on profiles for select using (true);
  
  drop policy if exists "Users update own" on profiles;
  create policy "Users update own" on profiles for update using (auth.uid() = id);

  -- Lessons/Tasks
  drop policy if exists "Lessons viewable" on lessons;
  create policy "Lessons viewable" on lessons for select using (true);
  
  drop policy if exists "Admins manage lessons" on lessons;
  create policy "Admins manage lessons" on lessons for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

  -- Chat Message Policies
  drop policy if exists "Chat messages all" on chat_messages;
  create policy "Chat messages all" on chat_messages for select using (true);

  drop policy if exists "Users insert chat" on chat_messages;
  create policy "Users insert chat" on chat_messages for insert with check (auth.uid() = user_id);

  -- User Roles Policies
  drop policy if exists "Admins manage roles" on user_roles;
  create policy "Admins manage roles" on user_roles for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

end $$;

-- 6. FUNCTIONS & TRIGGERS
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_admin boolean;
begin
  is_admin := (new.email = 'eiadmokhtar67@gmail.com');

  -- Insert into profiles
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 
    case when is_admin then 'admin'::app_role else 'learner'::app_role end
  )
  on conflict (id) do update 
  set role = excluded.role;

  -- Also insert into user_roles if admin
  if is_admin then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::app_role)
    on conflict do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. INITIAL ADMIN USER SETUP
DO $$
DECLARE
  new_user_id UUID := extensions.uuid_generate_v4();
  user_email TEXT := 'eiadmokhtar67@gmail.com';
  user_password TEXT := 'dida3/2/2001#';
BEGIN
  -- 1. Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
      user_email, extensions.crypt(user_password, extensions.gen_salt('bf')), now(), 
      now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Eiad Mokhtar"}',
      now(), now(), '', '', '', ''
    );

    -- Ensure profile status is 'accepted'
    UPDATE public.profiles 
    SET status = 'accepted', role = 'admin'
    WHERE id = new_user_id;

    -- Ensure role in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Admin user created and promoted.';
  ELSE
    -- Re-ensure rights for existing user
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
    
    UPDATE public.profiles SET role = 'admin', status = 'accepted' WHERE id = new_user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (new_user_id, 'admin'::app_role) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Existing admin user permissions verified.';
  END IF;
END $$;

-- 8. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload config';
