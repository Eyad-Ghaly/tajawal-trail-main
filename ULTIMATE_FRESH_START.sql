-- ==========================================
-- ULTIMATE FRESH START (Tajawal Trail)
-- ==========================================
-- Use this script for a BRAND NEW Supabase project.
-- This script sets up EVERYTHING correctly from scratch.

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

do $$ begin
  create type track_type_enum as enum ('data', 'english', 'soft', 'custom');
exception when duplicate_object then null; end $$;

-- 3. TABLES

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null,
  avatar_url text,
  level user_level default 'Beginner',
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
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- VIEW FOR CHAT DISPLAY (Critical for user names in chat)
create or replace view public.public_profiles as
select 
  id,
  full_name,
  avatar_url,
  level
from public.profiles;

-- USER_ROLES (Critical for Admin Page access)
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

-- 3. STORAGE SETUP
-- Create buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

-- Set up RLS for storage.objects
-- Note: We assume RLS is enabled on storage.objects by default in Supabase
-- If not, you might need: alter table storage.objects enable row level security;

-- Avatars Policies
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Chat Images Policies
drop policy if exists "Chat images are publicly accessible" on storage.objects;
create policy "Chat images are publicly accessible" on storage.objects for select using (bucket_id = 'chat-images');

drop policy if exists "Authenticated users can upload chat images" on storage.objects;
create policy "Authenticated users can upload chat images" on storage.objects for insert with check (bucket_id = 'chat-images' and auth.role() = 'authenticated');

-- 4. RLS POLICIES (PUBLIC TABLES)
do $$ begin
  -- General SELECT for view
  grant select on public.public_profiles to authenticated;
  grant select on public.public_profiles to anon;

  -- Table Grants for Authenticated Users
  grant all on public.profiles to authenticated;
  grant all on public.user_roles to authenticated;
  grant all on public.lessons to authenticated;
  grant all on public.tasks to authenticated;
  grant all on public.user_lessons to authenticated;
  grant all on public.user_tasks to authenticated;
  grant all on public.custom_lessons to authenticated;
  grant all on public.notifications to authenticated;
  grant all on public.daily_checkin to authenticated;
  grant all on public.chat_messages to authenticated;
  grant all on public.activities to authenticated;
  grant all on public.badges to authenticated;
  grant all on public.user_badges to authenticated;

  -- Profile policies
  drop policy if exists "Public profiles viewable" on profiles;
  create policy "Public profiles viewable" on profiles for select using (true);
  
  -- Allow Admins to UPDATE any profile (Fix for 'Approve' button)
  drop policy if exists "Admins can update any profile" on profiles;
  create policy "Admins can update any profile" on profiles for update using (
    auth.uid() = id OR exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

  -- Allow Admins to DELETE any profile
  drop policy if exists "Admins can delete any profile" on profiles;
  create policy "Admins can delete any profile" on profiles for delete using (
    auth.uid() = id OR exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

  drop policy if exists "Users insert own" on profiles;
  create policy "Users insert own" on profiles for insert with check (auth.uid() = id);

  -- Lessons/Tasks
  drop policy if exists "Lessons viewable" on lessons;
  create policy "Lessons viewable" on lessons for select using (true);
  
  drop policy if exists "Admins manage lessons" on lessons;
  create policy "Admins manage lessons" on lessons for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

  drop policy if exists "Tasks viewable" on tasks;
  create policy "Tasks viewable" on tasks for select using (true);

  drop policy if exists "Admins manage tasks" on tasks;
  create policy "Admins manage tasks" on tasks for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

  -- Chat Message Policies
  drop policy if exists "Chat messages all" on chat_messages;
  create policy "Chat messages all" on chat_messages for select using (true);

  drop policy if exists "Users insert chat" on chat_messages;
  create policy "Users insert chat" on chat_messages for insert with check (auth.uid() = user_id);

  -- User Roles Policies
  drop policy if exists "Admins manage roles" on user_roles;
  create policy "Admins manage roles" on user_roles for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
  
  drop policy if exists "Users view own roles" on user_roles;
  create policy "Users view own roles" on user_roles for select using (auth.uid() = user_id);

  -- User Lessons Policies
  drop policy if exists "Users manage own lessons" on user_lessons;
  create policy "Users manage own lessons" on user_lessons for all using (auth.uid() = user_id);

  -- User Tasks Policies
  drop policy if exists "Users manage own tasks" on user_tasks;
  create policy "Users manage own tasks" on user_tasks for all using (auth.uid() = user_id);
  
  drop policy if exists "Admins view all user tasks" on user_tasks;
  create policy "Admins view all user tasks" on user_tasks for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

  -- User Badges Policies
  drop policy if exists "Users view own badges" on user_badges;
  create policy "Users view own badges" on user_badges for select using (auth.uid() = user_id);

  -- Activities Policies
  drop policy if exists "Users view own activities" on activities;
  create policy "Users view own activities" on activities for select using (auth.uid() = user_id);
  
  drop policy if exists "Users insert own activities" on activities;
  create policy "Users insert own activities" on activities for insert with check (auth.uid() = user_id);

  -- Daily Checkin Policies
  drop policy if exists "Users manage own checkins" on daily_checkin;
  create policy "Users manage own checkins" on daily_checkin for all using (auth.uid() = user_id);

  -- Notifications Policies
  drop policy if exists "Users manage own notifications" on notifications;
  create policy "Users manage own notifications" on notifications for all using (auth.uid() = user_id);

  -- Custom Lessons Policies
  drop policy if exists "Users manage own custom lessons" on custom_lessons;
  create policy "Users manage own custom lessons" on custom_lessons for all using (auth.uid() = user_id);
  
  drop policy if exists "Admins manage everything on custom lessons" on custom_lessons;
  create policy "Admins manage everything on custom lessons" on custom_lessons for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

end $$;

-- 6. FUNCTIONS & TRIGGERS

-- DANGER ZONE: Clean up ALL existing triggers on auth.users to prevent conflicts
DO $$
DECLARE
    trig_record RECORD;
BEGIN
    FOR trig_record IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
          AND event_object_table = 'users'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trig_record.trigger_name || ' ON auth.users';
    END LOOP;
END $$;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_admin boolean;
begin
  is_admin := (lower(new.email) = 'eiadmokhtar67@gmail.com');
  
  insert into public.profiles (
    id, 
    full_name, 
    role, 
    status, 
    level, 
    avatar_url,
    governorate,
    membership_number,
    xp_total,
    overall_progress,
    data_progress,
    english_progress,
    soft_progress,
    streak_days
  )
  values (
    new.id, 
    -- Fallback to name from metadata, or email username if missing
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    case when is_admin then 'admin'::app_role else 'learner'::app_role end,
    case when is_admin then 'approved' else 'pending' end,
    'Beginner',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'membership_number',
    new.email,
    new.raw_user_meta_data->>'phone_number',
    0, 0, 0, 0, 0, 0
  )
  on conflict (id) do update 
  set role = excluded.role,
      status = excluded.status,
      full_name = excluded.full_name;

  -- 2. Create Role Entry for Admin Check (Required for Frontend)
  if is_admin then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::app_role)
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger to notify all users when a new lesson is added
create or replace function public.notify_new_lesson()
returns trigger as $$
begin
  insert into public.notifications (user_id, title, message, type, related_id)
  select id, 'درس جديد متاح! 📚', 'تم إضافة درس جديد: ' || new.title, 'lesson', new.id
  from public.profiles
  where status = 'approved';
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_lesson_created on public.lessons;
create trigger on_lesson_created
  after insert on public.lessons
  for each row execute procedure public.notify_new_lesson();

-- Trigger to notify all users when a new task is added
create or replace function public.notify_new_task()
returns trigger as $$
begin
  insert into public.notifications (user_id, title, message, type, related_id)
  select id, 'مهمة جديدة بانتظارك! 🎯', 'تم إضافة مهمة جديدة: ' || new.title, 'task', new.id
  from public.profiles
  where status = 'approved';
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_task_created on public.tasks;
create trigger on_task_created
  after insert on public.tasks
  for each row execute procedure public.notify_new_task();

-- Re-create the sign-up trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to auto-confirm email when user is approved
create or replace function public.confirm_user_email()
returns trigger as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    update auth.users
    set email_confirmed_at = now(),
        updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_approved on public.profiles;
create trigger on_user_approved
  after update on public.profiles
  for each row execute procedure public.confirm_user_email();

-- 7. RECOVER ORPHAN USERS (Fixes missing profiles automatically)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT * FROM auth.users u 
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  LOOP
    INSERT INTO public.profiles (
      id, full_name, role, status, level, 
      xp_total, overall_progress, data_progress, english_progress, soft_progress, streak_days,
      avatar_url, governorate, membership_number
    )
    VALUES (
      r.id,
      COALESCE(r.raw_user_meta_data->>'full_name', r.raw_user_meta_data->>'name', split_part(r.email, '@', 1)),
      'learner', 'pending', 'Beginner',
      0, 0, 0, 0, 0, 0,
      r.raw_user_meta_data->>'avatar_url',
      r.raw_user_meta_data->>'governorate',
      r.raw_user_meta_data->>'membership_number'
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- 7. INITIAL ADMIN USER SETUP
DO $$
DECLARE
  new_user_uuid UUID := extensions.uuid_generate_v4();
  user_email TEXT := 'eiadmokhtar67@gmail.com';
  user_password TEXT := 'dida3/2/2001#';
  target_id UUID;
BEGIN
  -- 1. Check if user exists
  SELECT id INTO target_id FROM auth.users WHERE email = user_email;

  IF target_id IS NULL THEN
    -- Create new admin
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000', new_user_uuid, 'authenticated', 'authenticated', 
      user_email, extensions.crypt(user_password, extensions.gen_salt('bf')), now(), 
      now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Eiad Mokhtar Admin"}',
      now(), now(), '', '', '', ''
    );
    target_id := new_user_uuid;
    RAISE NOTICE 'Admin user created successfully.';
  ELSE
    -- Force confirm and reset existing admin
    UPDATE auth.users 
    SET 
      encrypted_password = extensions.crypt(user_password, extensions.gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}',
      raw_user_meta_data = '{"full_name":"Eiad Mokhtar Admin"}'
    WHERE id = target_id;
    RAISE NOTICE 'Admin user credentials forced and confirmed.';
  END IF;

  -- 2. Re-ensure Profile & Roles
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (target_id, 'Eiad Mokhtar Admin', 'admin', 'approved')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'approved', full_name = 'Eiad Mokhtar Admin';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_id, 'admin')
  ON CONFLICT DO NOTHING;
END $$;

-- 8. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload config';
