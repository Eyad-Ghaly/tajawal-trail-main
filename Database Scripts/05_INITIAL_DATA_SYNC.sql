-- ==========================================
-- 05. INITIAL DATA SYNC
-- ==========================================
-- ⚠️ WARNING: Run this after migration to ensure consistency.

-- 1. RECOVER ORPHAN USERS
-- Checks for users in auth.users who miss a profile in public.profiles and creates one.
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

-- 2. ENSURE ADMIN EXISTANCE
-- Ensures the main admin email is set as admin
DO $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = 'eiadmokhtar67@gmail.com';
  
  IF target_id IS NOT NULL THEN
    -- Update Profile
    UPDATE public.profiles SET role = 'admin', status = 'approved' WHERE id = target_id;
    -- Ensure User Roles
    INSERT INTO public.user_roles (user_id, role) VALUES (target_id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3. RELOAD CONFIG
NOTIFY pgrst, 'reload config';
