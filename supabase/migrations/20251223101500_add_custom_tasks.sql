-- Create custom_tasks table
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

-- Enable RLS
alter table public.custom_tasks enable row level security;

-- Policies for custom_tasks
-- 1. Users can manage their own custom tasks
create policy "Users manage own custom tasks" on public.custom_tasks
  for all using (auth.uid() = user_id);

-- 2. Admins can manage everything
create policy "Admins manage everything on custom tasks" on public.custom_tasks
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Function to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
drop trigger if exists set_custom_tasks_updated_at on public.custom_tasks;
create trigger set_custom_tasks_updated_at
  before update on public.custom_tasks
  for each row execute procedure public.handle_updated_at();

-- Grant access to authenticated users
grant all on public.custom_tasks to authenticated;
