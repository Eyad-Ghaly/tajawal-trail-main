-- Add last_streak_date to profiles to track when the last "full checkin" happened
alter table public.profiles 
add column if not exists last_streak_date date;

-- Function to handle streak calculation
create or replace function public.handle_streak_update()
returns trigger as $$
declare
  is_all_done boolean;
  current_streak integer;
  last_date date;
begin
  -- Check if all 3 tasks are done for the updated/inserted row
  is_all_done := (new.data_task = true AND new.lang_task = true AND new.soft_task = true);
  
  -- Only proceed if all tasks are done
  if is_all_done then
    -- Get current streak info
    select streak_days, last_streak_date 
    into current_streak, last_date
    from public.profiles
    where id = new.user_id;

    -- Handle case where streak_days is null
    if current_streak is null then current_streak := 0; end if;

    -- LOGIC:
    -- 1. If last_streak_date is Today (new.date), do nothing multple times today.
    -- 2. If last_streak_date is Yesterday (new.date - 1), Increment.
    -- 3. Otherwise (gap or first time), Reset to 1.
    
    if last_date = new.date then
      -- Already counted for today, do nothing
      return new;
    elsif last_date = (new.date - 1) then
      -- Streak continues!
      update public.profiles
      set streak_days = current_streak + 1,
          last_streak_date = new.date
      where id = new.user_id;
    else
      -- Streak broken or new started
      update public.profiles
      set streak_days = 1,
          last_streak_date = new.date
      where id = new.user_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to watch for changes in daily_checkin
-- We use AFTER INSERT OR UPDATE to catch both cases
drop trigger if exists on_daily_checkin_update on public.daily_checkin;
create trigger on_daily_checkin_update
  after insert or update on public.daily_checkin
  for each row execute procedure public.handle_streak_update();
