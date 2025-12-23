-- Create posts table
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  image_url text,
  video_url text,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.posts enable row level security;

-- RLS Policies for posts
-- 1. Everyone can view posts
create policy "Posts are viewable by everyone" on public.posts
  for select using (true);

-- 2. Only admins can insert/update/delete posts
create policy "Admins can manage posts" on public.posts
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Create storage bucket for post media if it doesn't exist
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

-- Storage policies for post-media
-- 1. Public read access
create policy "Post media is publicly accessible" on storage.objects
  for select using (bucket_id = 'post-media');

-- 2. Admin write access
create policy "Admins can upload post media" on storage.objects
  for insert with check (
    bucket_id = 'post-media' 
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update post media" on storage.objects
  for update using (
    bucket_id = 'post-media' 
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete post media" on storage.objects
  for delete using (
    bucket_id = 'post-media' 
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
