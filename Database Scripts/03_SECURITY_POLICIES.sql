-- ==========================================
-- 03. SECURITY POLICIES (RLS)
-- ==========================================
-- ✅ SAFE: Can be run multiple times.
-- Enables RLS and sets up policies for tables and storage.

-- 1. ENABLE RLS
alter table profiles enable row level security;
alter table user_roles disable row level security; -- DISABLE to prevent recursion loop with profiles
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table lessons enable row level security;
alter table tasks enable row level security;
alter table user_tasks enable row level security;
alter table user_lessons enable row level security;
alter table custom_lessons enable row level security;
alter table custom_tasks enable row level security;
alter table activities enable row level security;
alter table daily_checkin enable row level security;
alter table chat_messages enable row level security;
alter table notifications enable row level security;
alter table posts enable row level security;
alter table teams enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;

-- 2. STORAGE POLICIES
-- Avatars
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Chat Images
drop policy if exists "Chat images are publicly accessible" on storage.objects;
create policy "Chat images are publicly accessible" on storage.objects for select using (bucket_id = 'chat-images');

drop policy if exists "Authenticated users can upload chat images" on storage.objects;
create policy "Authenticated users can upload chat images" on storage.objects for insert with check (bucket_id = 'chat-images' and auth.role() = 'authenticated');

-- Post Media
drop policy if exists "Post media is publicly accessible" on storage.objects;
create policy "Post media is publicly accessible" on storage.objects for select using (bucket_id = 'post-media');

drop policy if exists "Admins can upload post media" on storage.objects;
create policy "Admins can upload post media" on storage.objects for insert with check (
  bucket_id = 'post-media' 
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can update post media" on storage.objects;
create policy "Admins can update post media" on storage.objects for update using (
  bucket_id = 'post-media' 
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can delete post media" on storage.objects;
create policy "Admins can delete post media" on storage.objects for delete using (
  bucket_id = 'post-media' 
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 3. TABLE POLICIES

do $$ begin
  -- General Grants
  grant select on public.public_profiles to authenticated;
  grant select on public.public_profiles to anon;
  grant all on public.profiles to authenticated;
  grant all on public.user_roles to authenticated;
  grant all on public.lessons to authenticated;
  grant all on public.tasks to authenticated;
  grant all on public.user_lessons to authenticated;
  grant all on public.user_tasks to authenticated;
  grant all on public.custom_lessons to authenticated;
  grant all on public.custom_tasks to authenticated;
  grant all on public.notifications to authenticated;
  grant all on public.daily_checkin to authenticated;
  grant all on public.chat_messages to authenticated;
  grant all on public.activities to authenticated;
  grant all on public.badges to authenticated;
  grant all on public.user_badges to authenticated;

  -- Profile policies
  -- Profile policies
  drop policy if exists "Public profiles viewable" on profiles;
  create policy "Public profiles viewable" on profiles for select using (true);
  
  drop policy if exists "Admins can update any profile" on profiles;
  create policy "Admins can update any profile" on profiles for update using (
    auth.uid() = id OR exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

  drop policy if exists "Users insert own" on profiles;
  create policy "Users insert own" on profiles for insert with check (auth.uid() = id);

  drop policy if exists "Admins can delete any profile" on profiles;
  create policy "Admins can delete any profile" on profiles for delete using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

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

  -- User Lessons/Tasks Policies
  drop policy if exists "Users manage own lessons" on user_lessons;
  create policy "Users manage own lessons" on user_lessons for all using (auth.uid() = user_id);

  drop policy if exists "Users manage own tasks" on user_tasks;
  create policy "Users manage own tasks" on user_tasks for all using (auth.uid() = user_id);
  
  drop policy if exists "Admins view all user tasks" on user_tasks;
  create policy "Admins view all user tasks" on user_tasks for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

  -- Badges & Activities
  drop policy if exists "Users view own badges" on user_badges;
  create policy "Users view own badges" on user_badges for select using (auth.uid() = user_id);

  drop policy if exists "Users view own activities" on activities;
  create policy "Users view own activities" on activities for select using (auth.uid() = user_id);
  
  drop policy if exists "Users insert own activities" on activities;
  create policy "Users insert own activities" on activities for insert with check (auth.uid() = user_id);

  -- Daily Checkin
  drop policy if exists "Users manage own checkins" on daily_checkin;
  create policy "Users manage own checkins" on daily_checkin for all using (auth.uid() = user_id);

  -- Notifications
  drop policy if exists "Users manage own notifications" on notifications;
  create policy "Users manage own notifications" on notifications for all using (auth.uid() = user_id);

  -- Custom Content
  drop policy if exists "Users manage own custom lessons" on custom_lessons;
  create policy "Users manage own custom lessons" on custom_lessons for all using (auth.uid() = user_id);
  
  drop policy if exists "Admins manage everything on custom lessons" on custom_lessons;
  create policy "Admins manage everything on custom lessons" on custom_lessons for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

  drop policy if exists "Users manage own custom tasks" on custom_tasks;
  create policy "Users manage own custom tasks" on custom_tasks for all using (auth.uid() = user_id);

  drop policy if exists "Admins manage everything on custom tasks" on custom_tasks;
  create policy "Admins manage everything on custom tasks" on custom_tasks for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

  -- Posts
  drop policy if exists "Posts are viewable by everyone" on posts;
  create policy "Posts are viewable by everyone" on posts for select using (true);

  drop policy if exists "Admins can manage posts" on posts;
  create policy "Admins can manage posts" on posts for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
end $$;

-- 4. NEW TABLES POLICIES (Teams, Polls, etc.)
do $$ begin
  -- TEAMS
  -- Everyone can view teams (needed to validate code)
  drop policy if exists "Public teams are viewable" on public.teams;
  create policy "Public teams are viewable" on public.teams for select using (true);

  -- Leaders can update own team
  drop policy if exists "Leaders can update own team" on public.teams;
  create policy "Leaders can update own team" on public.teams for update using (auth.uid() = leader_id);

  -- Leaders can insert own team
  drop policy if exists "Leaders can insert own team" on public.teams;
  create policy "Leaders can insert own team" on public.teams for insert with check (auth.uid() = leader_id);

  -- POLL OPTIONS
  drop policy if exists "Poll options viewable by everyone" on public.poll_options;
  create policy "Poll options viewable by everyone" on public.poll_options for select using (true);
  
  drop policy if exists "Admins manage poll options" on public.poll_options;
  create policy "Admins manage poll options" on public.poll_options for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

  -- POLL VOTES
  drop policy if exists "Poll votes viewable by everyone" on public.poll_votes;
  create policy "Poll votes viewable by everyone" on public.poll_votes for select using (true);
  
  drop policy if exists "Users can vote" on public.poll_votes;
  create policy "Users can vote" on public.poll_votes for insert with check (auth.uid() = user_id);
  
  drop policy if exists "Users can remove their vote" on public.poll_votes;
  create policy "Users can remove their vote" on public.poll_votes for delete using (auth.uid() = user_id);

  -- POST LIKES
  drop policy if exists "Post likes viewable by everyone" on public.post_likes;
  create policy "Post likes viewable by everyone" on public.post_likes for select using (true);
  
  drop policy if exists "Users can like posts" on public.post_likes;
  create policy "Users can like posts" on public.post_likes for insert with check (auth.uid() = user_id);
  
  drop policy if exists "Users can unlike posts" on public.post_likes;
  create policy "Users can unlike posts" on public.post_likes for delete using (auth.uid() = user_id);

  -- POST COMMENTS
  drop policy if exists "Post comments viewable by everyone" on public.post_comments;
  create policy "Post comments viewable by everyone" on public.post_comments for select using (true);
  
  drop policy if exists "Users can add comments" on public.post_comments;
  create policy "Users can add comments" on public.post_comments for insert with check (auth.uid() = user_id);
  
  drop policy if exists "Users can update own comments" on public.post_comments;
  create policy "Users can update own comments" on public.post_comments for update using (auth.uid() = user_id);
  
  drop policy if exists "Users can delete own comments" on public.post_comments;
  create policy "Users can delete own comments" on public.post_comments for delete using (auth.uid() = user_id);
  
  drop policy if exists "Admins can delete any comment" on public.post_comments;
  create policy "Admins can delete any comment" on public.post_comments for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

end $$;
