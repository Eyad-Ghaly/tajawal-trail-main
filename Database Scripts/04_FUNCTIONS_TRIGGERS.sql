-- ==========================================
-- 04. FUNCTIONS & TRIGGERS
-- ==========================================
-- ✅ SAFE: Can be run multiple times. Defined as 'create or replace'.

-- DANGER: Cleanup old triggers to avoid duplicates
DO $$
DECLARE trig_record RECORD;
BEGIN
    FOR trig_record IN SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users' LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trig_record.trigger_name || ' ON auth.users';
    END LOOP;
END $$;

-- 1. HANDLE NEW USER
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_admin boolean;
begin
  is_admin := (lower(new.email) = 'eiadmokhtar67@gmail.com');
  
  insert into public.profiles (
    id, full_name, role, status, level, english_level, avatar_url, governorate, membership_number, email, phone_number,
    xp_total, overall_progress, data_progress, english_progress, soft_progress, streak_days
  )
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    case when is_admin then 'admin'::app_role else 'learner'::app_role end,
    case when is_admin then 'approved' else 'pending' end,
    'Beginner',
    'B',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'membership_number',
    new.email,
    new.raw_user_meta_data->>'phone_number',
    0, 0, 0, 0, 0, 0
  )
  on conflict (id) do update set role = excluded.role, status = excluded.status, full_name = excluded.full_name;

  if is_admin then
    insert into public.user_roles (user_id, role) values (new.id, 'admin'::app_role) on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 2. NOTIFICATIONS
create or replace function public.notify_new_lesson() returns trigger as $$
begin
  insert into public.notifications (user_id, title, message, type, related_id)
  select id, 'درس جديد متاح! 📚', 'تم إضافة درس جديد: ' || new.title, 'lesson', new.id
  from public.profiles where status = 'approved';
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_lesson_created on public.lessons;
create trigger on_lesson_created after insert on public.lessons for each row execute procedure public.notify_new_lesson();

create or replace function public.notify_new_task() returns trigger as $$
begin
  insert into public.notifications (user_id, title, message, type, related_id)
  select id, 'مهمة جديدة بانتظارك! 🎯', 'تم إضافة مهمة جديدة: ' || new.title, 'task', new.id
  from public.profiles where status = 'approved';
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_task_created on public.tasks;
create trigger on_task_created after insert on public.tasks for each row execute procedure public.notify_new_task();

-- 3. AUTO CONFIRM EMAIL
create or replace function public.confirm_user_email() returns trigger as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    update auth.users set email_confirmed_at = now(), updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_approved on public.profiles;
create trigger on_user_approved after update on public.profiles for each row execute procedure public.confirm_user_email();

-- 4. STREAK LOGIC
create or replace function public.handle_streak_update() returns trigger as $$
declare
  is_all_done boolean;
  current_streak integer;
  last_date date;
begin
  is_all_done := (new.data_task = true AND new.lang_task = true AND new.soft_task = true);
  
  select streak_days, last_streak_date into current_streak, last_date from public.profiles where id = new.user_id;
  if current_streak is null then current_streak := 0; end if;

  -- 1. LAZY RESET: If last streak was older than yesterday, reset to 0 immediately on any activity
  IF last_date IS NOT NULL AND last_date < (new.date - 1) THEN
     update public.profiles set streak_days = 0 where id = new.user_id;
     current_streak := 0; -- Local update for logic below
  END IF;

  -- 2. HANDLE COMPLETION
  if is_all_done then
    if last_date = new.date then
      -- Already counted for today
      return new;
    elsif last_date = (new.date - 1) then
       -- Seamless continuation
      update public.profiles set streak_days = current_streak + 1, last_streak_date = new.date where id = new.user_id;
    else
      -- Start fresh (was 0 due to reset above, or just a gap)
      update public.profiles set streak_days = 1, last_streak_date = new.date where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_daily_checkin_update on public.daily_checkin;
create trigger on_daily_checkin_update after insert or update on public.daily_checkin for each row execute procedure public.handle_streak_update();

-- 5. DAILY CHECKIN FUNCTION
-- 5. DAILY CHECKIN FUNCTION
DROP FUNCTION IF EXISTS public.perform_daily_checkin(UUID, DATE);
DROP FUNCTION IF EXISTS public.perform_daily_checkin(UUID, TEXT, DATE);

CREATE OR REPLACE FUNCTION public.perform_daily_checkin(uid UUID, target_track TEXT, checkin_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    today_val DATE := checkin_date;
    existing_record public.daily_checkin;
    is_done BOOLEAN;
BEGIN
    SELECT * INTO existing_record FROM public.daily_checkin WHERE user_id = uid AND date = today_val;

    IF existing_record IS NOT NULL THEN
        -- Check specific column based on track
        CASE target_track
            WHEN 'data' THEN is_done := existing_record.data_task;
            WHEN 'lang' THEN is_done := existing_record.lang_task;
            WHEN 'soft' THEN is_done := existing_record.soft_task;
            ELSE RETURN jsonb_build_object('success', false, 'message', 'Invalid track type');
        END CASE;

        IF is_done THEN
            RETURN jsonb_build_object('success', false, 'message', 'This track is already completed for today');
        ELSE
            -- Update specific column
            IF target_track = 'data' THEN
                 UPDATE public.daily_checkin SET data_task = true, xp_generated = xp_generated + 5 WHERE id = existing_record.id;
            ELSIF target_track = 'lang' THEN
                 UPDATE public.daily_checkin SET lang_task = true, xp_generated = xp_generated + 5 WHERE id = existing_record.id;
            ELSIF target_track = 'soft' THEN
                 UPDATE public.daily_checkin SET soft_task = true, xp_generated = xp_generated + 5 WHERE id = existing_record.id;
            END IF;
            
            -- Increment Profile XP
            UPDATE public.profiles SET xp_total = COALESCE(xp_total, 0) + 5 WHERE id = uid;
            
            RETURN jsonb_build_object('success', true, 'message', 'Track checked in successfully');
        END IF;
    ELSE
        -- Insert new row with specific task = true
        IF target_track = 'data' THEN
            INSERT INTO public.daily_checkin (user_id, date, data_task, xp_generated) VALUES (uid, today_val, true, 5);
        ELSIF target_track = 'lang' THEN
             INSERT INTO public.daily_checkin (user_id, date, lang_task, xp_generated) VALUES (uid, today_val, true, 5);
        ELSIF target_track = 'soft' THEN
             INSERT INTO public.daily_checkin (user_id, date, soft_task, xp_generated) VALUES (uid, today_val, true, 5);
        ELSE
             RETURN jsonb_build_object('success', false, 'message', 'Invalid track type');
        END IF;

        -- Increment Profile XP
        UPDATE public.profiles SET xp_total = COALESCE(xp_total, 0) + 5 WHERE id = uid;
        
        RETURN jsonb_build_object('success', true, 'message', 'First track checked in successfully');
    END IF;

EXCEPTION 
    WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.perform_daily_checkin(UUID, TEXT, DATE) TO authenticated;

-- 6. PROGRESS SYNC
CREATE OR REPLACE FUNCTION public.refresh_user_progress(uid UUID) RETURNS void AS $$
DECLARE
    -- Totals
    total_data_lessons INTEGER := 0;
    total_eng_lessons INTEGER := 0;
    total_soft_lessons INTEGER := 0;
    
    total_data_tasks INTEGER := 0;
    total_eng_tasks INTEGER := 0;
    total_soft_tasks INTEGER := 0;

    -- Completed
    comp_data_lessons INTEGER := 0;
    comp_eng_lessons INTEGER := 0;
    comp_soft_lessons INTEGER := 0;

    comp_data_tasks INTEGER := 0;
    comp_eng_tasks INTEGER := 0;
    comp_soft_tasks INTEGER := 0;
    
    -- Percentages
    data_pct NUMERIC := 0;
    eng_pct NUMERIC := 0;
    soft_pct NUMERIC := 0;
    overall_pct NUMERIC := 0;
BEGIN
    -- Get Totals (Published only)
    SELECT count(*) INTO total_data_lessons FROM public.lessons WHERE track_type = 'data' AND published = true;
    SELECT count(*) INTO total_eng_lessons FROM public.lessons WHERE track_type = 'english' AND published = true;
    SELECT count(*) INTO total_soft_lessons FROM public.lessons WHERE track_type = 'soft' AND published = true;
    
    SELECT count(*) INTO total_data_tasks FROM public.tasks WHERE track_type = 'data' AND published = true;
    SELECT count(*) INTO total_eng_tasks FROM public.tasks WHERE track_type = 'english' AND published = true;
    SELECT count(*) INTO total_soft_tasks FROM public.tasks WHERE track_type = 'soft' AND published = true;

    -- Get Completed (Watched lessons / Approved tasks)
    SELECT count(*) INTO comp_data_lessons 
    FROM public.user_lessons ul 
    JOIN public.lessons l ON ul.lesson_id = l.id 
    WHERE ul.user_id = uid AND l.track_type = 'data' AND ul.watched = true;

    SELECT count(*) INTO comp_eng_lessons 
    FROM public.user_lessons ul 
    JOIN public.lessons l ON ul.lesson_id = l.id 
    WHERE ul.user_id = uid AND l.track_type = 'english' AND ul.watched = true;
    
    SELECT count(*) INTO comp_soft_lessons 
    FROM public.user_lessons ul 
    JOIN public.lessons l ON ul.lesson_id = l.id 
    WHERE ul.user_id = uid AND l.track_type = 'soft' AND ul.watched = true;

    SELECT count(*) INTO comp_data_tasks
    FROM public.user_tasks ut
    JOIN public.tasks t ON ut.task_id = t.id
    WHERE ut.user_id = uid AND t.track_type = 'data' AND ut.status = 'approved';

    SELECT count(*) INTO comp_eng_tasks
    FROM public.user_tasks ut
    JOIN public.tasks t ON ut.task_id = t.id
    WHERE ut.user_id = uid AND t.track_type = 'english' AND ut.status = 'approved';
    
    SELECT count(*) INTO comp_soft_tasks
    FROM public.user_tasks ut
    JOIN public.tasks t ON ut.task_id = t.id
    WHERE ut.user_id = uid AND t.track_type = 'soft' AND ut.status = 'approved';

    -- Calculate Percentages (Avoid Division by Zero)
    IF (total_data_lessons + total_data_tasks) > 0 THEN
        data_pct := ((comp_data_lessons + comp_data_tasks)::NUMERIC / (total_data_lessons + total_data_tasks)::NUMERIC) * 100;
    END IF;

    IF (total_eng_lessons + total_eng_tasks) > 0 THEN
        eng_pct := ((comp_eng_lessons + comp_eng_tasks)::NUMERIC / (total_eng_lessons + total_eng_tasks)::NUMERIC) * 100;
    END IF;

    IF (total_soft_lessons + total_soft_tasks) > 0 THEN
        soft_pct := ((comp_soft_lessons + comp_soft_tasks)::NUMERIC / (total_soft_lessons + total_soft_tasks)::NUMERIC) * 100;
    END IF;

    -- Overall Average
    overall_pct := (data_pct + eng_pct + soft_pct) / 3;

    -- Update Profile
    UPDATE public.profiles
    SET 
        data_progress = round(data_pct),
        english_progress = round(eng_pct),
        soft_progress = round(soft_pct),
        overall_progress = round(overall_pct),
        updated_at = now()
    WHERE id = uid;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master trigger
CREATE OR REPLACE FUNCTION public.handle_progress_update() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN PERFORM public.refresh_user_progress(OLD.user_id); RETURN OLD;
    ELSE PERFORM public.refresh_user_progress(NEW.user_id); RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for progress
DROP TRIGGER IF EXISTS on_user_lesson_change ON public.user_lessons;
CREATE TRIGGER on_user_lesson_change AFTER INSERT OR UPDATE OR DELETE ON public.user_lessons FOR EACH ROW EXECUTE FUNCTION public.handle_progress_update();

DROP TRIGGER IF EXISTS on_user_task_change ON public.user_tasks;
CREATE TRIGGER on_user_task_change AFTER INSERT OR UPDATE OR DELETE ON public.user_tasks FOR EACH ROW EXECUTE FUNCTION public.handle_progress_update();

DROP TRIGGER IF EXISTS on_custom_lesson_change ON public.custom_lessons;
CREATE TRIGGER on_custom_lesson_change AFTER INSERT OR UPDATE OR DELETE ON public.custom_lessons FOR EACH ROW EXECUTE FUNCTION public.handle_progress_update();

DROP TRIGGER IF EXISTS on_custom_task_change ON public.custom_tasks;
CREATE TRIGGER on_custom_task_change AFTER INSERT OR UPDATE OR DELETE ON public.custom_tasks FOR EACH ROW EXECUTE FUNCTION public.handle_progress_update();
