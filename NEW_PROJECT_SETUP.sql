-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Enums (Removed track_type enum to allow dynamic tracks)
create type user_level as enum ('Beginner', 'Intermediate', 'Advanced');
create type app_role as enum ('admin', 'learner');
-- track_type enum removed to allow any text value
create type task_status as enum ('pending', 'submitted', 'approved', 'rejected');
create type proof_type as enum ('file', 'link', 'text');

-- 2. Create Tables

-- PROFILES
create table public.profiles (
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

-- USER_ROLES (Matches user's existing table)
create table public.user_roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role app_role default 'learner',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- BADGES
create table public.badges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  icon_path text,
  xp_required integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- USER_BADGES
create table public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now())
);

-- LESSONS
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  track_type text not null, -- Changed from Enum to Text
  level user_level,
  published boolean default false,
  order_index integer,
  video_link text,
  duration_minutes integer,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- TASKS
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  track_type text not null, -- Changed from Enum to Text
  level user_level,
  xp integer default 10,
  published boolean default false,
  resource_link text,
  deadline timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- USER_TASKS
create table public.user_tasks (
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
create table public.user_lessons (
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
create table public.custom_lessons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  video_link text,
  track_type text default 'data' not null, -- Changed from Enum to Text
  completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ACTIVITIES
create table public.activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type text not null,
  description text not null,
  xp_earned integer default 0,
  related_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- DAILY_CHECKIN
create table public.daily_checkin (
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
create table public.chat_messages (
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
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info',
  read boolean default false,
  related_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable RLS
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

-- 4. Create Policies (Admin access to all)

-- Profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile." on profiles for insert with check (auth.uid() = id);

-- Badges
create policy "Badges viewable by everyone" on badges for select using (true);
create policy "Admins insert badges" on badges for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- User Badges
create policy "User badges viewable by everyone" on user_badges for select using (true);
create policy "Admins grant badges" on user_badges for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Lessons
create policy "Lessons are viewable by everyone." on lessons for select using (true);
create policy "Admins can insert lessons." on lessons for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update lessons." on lessons for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can delete lessons." on lessons for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Tasks
create policy "Tasks are viewable by everyone." on tasks for select using (true);
create policy "Admins can insert tasks." on tasks for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update tasks." on tasks for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- User Tasks
create policy "Users can view own tasks." on user_tasks for select using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Users can insert own tasks." on user_tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks." on user_tasks for update using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- User Lessons
create policy "Users can view own lessons." on user_lessons for select using (auth.uid() = user_id);
create policy "Users can insert own lessons." on user_lessons for insert with check (auth.uid() = user_id);
create policy "Users can update own lessons." on user_lessons for update using (auth.uid() = user_id);

-- Custom Lessons
create policy "Users can view own custom lessons." on custom_lessons for select using (auth.uid() = user_id);
create policy "Admins can insert custom lessons." on custom_lessons for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can delete custom lessons." on custom_lessons for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Users can update own custom lessons." on custom_lessons for update using (auth.uid() = user_id);

-- Activities
create policy "Users view own activities" on activities for select using (auth.uid() = user_id);
create policy "Users insert own activities" on activities for insert with check (auth.uid() = user_id);

-- Daily Checkin
create policy "Users view own checkins" on daily_checkin for select using (auth.uid() = user_id);
create policy "Users insert own checkins" on daily_checkin for insert with check (auth.uid() = user_id);
create policy "Users update own checkins" on daily_checkin for update using (auth.uid() = user_id);

-- Chat Messages
create policy "Chat messages viewable by all" on chat_messages for select using (true);
create policy "Users insert chat messages" on chat_messages for insert with check (auth.uid() = user_id);

-- Notifications
create policy "Users view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on notifications for update using (auth.uid() = user_id);

-- User Roles
create policy "Users view own roles" on user_roles for select using (auth.uid() = user_id);
create policy "Admins manage roles" on user_roles for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 5. Trigger for New User Profile Creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 
    case when new.email = 'eiadmokhtar67@gmail.com' then 'admin'::app_role else 'learner'::app_role end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
