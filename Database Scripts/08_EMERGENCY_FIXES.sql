-- ==========================================
-- 08. EMERGENCY FIXES
-- ==========================================
-- 🚨 DANGER: Use only when things are broken.

-- 1. NUKE ALL HANDLERS ON AUTH.USERS
-- Useful if signup is failing due to broken triggers.
DO $$
DECLARE trig_record RECORD;
BEGIN
    FOR trig_record IN SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users' LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trig_record.trigger_name || ' ON auth.users';
    END LOOP;
END $$;

-- 2. RESET A USER'S PROGRESS
-- UPDATE public.profiles SET 
--   xp_total = 0, overall_progress = 0, 
--   data_progress = 0, english_progress = 0, soft_progress = 0, 
--   streak_days = 0 
-- WHERE email = 'user@example.com';

-- 3. FORCE RECALCULATE ALL PROGRESS
-- Run this to update the progress bars for ALL users based on their current history.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.refresh_user_progress(r.id);
  END LOOP;
END $$;

