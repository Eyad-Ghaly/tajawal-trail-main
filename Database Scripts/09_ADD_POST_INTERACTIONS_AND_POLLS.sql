-- ==========================================
-- 09. ADD POST INTERACTIONS AND POLLS
-- ==========================================

-- 1. MODIFY POSTS TABLE
alter table public.posts 
add column if not exists type text default 'text' check (type in ('text', 'poll'));

-- 2. CREATE NEW TABLES

-- POLL OPTIONS
create table if not exists public.poll_options (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  option_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- POLL VOTES
create table if not exists public.poll_votes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  option_id uuid references public.poll_options(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(post_id, user_id)
);

-- POST LIKES
create table if not exists public.post_likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(post_id, user_id)
);

-- POST COMMENTS
create table if not exists public.post_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. ENABLE RLS
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

-- 4. SECURITY POLICIES

-- Poll Options
create policy "Poll options viewable by everyone" on public.poll_options for select using (true);
create policy "Admins can manage poll options" on public.poll_options for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Poll Votes
create policy "Poll votes viewable by everyone" on public.poll_votes for select using (true);
create policy "Users can vote" on public.poll_votes for insert with check (auth.uid() = user_id);
create policy "Users can remove their vote" on public.poll_votes for delete using (auth.uid() = user_id);

-- Post Likes
create policy "Post likes viewable by everyone" on public.post_likes for select using (true);
create policy "Users can like posts" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike posts" on public.post_likes for delete using (auth.uid() = user_id);

-- Post Comments
create policy "Post comments viewable by everyone" on public.post_comments for select using (true);
create policy "Users can add comments" on public.post_comments for insert with check (auth.uid() = user_id);
create policy "Users can update own comments" on public.post_comments for update using (auth.uid() = user_id);
create policy "Users can delete own comments" on public.post_comments for delete using (auth.uid() = user_id);
create policy "Admins can delete any comment" on public.post_comments for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
