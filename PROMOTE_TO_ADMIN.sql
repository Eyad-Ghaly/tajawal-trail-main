-- ==========================================
-- ADMIN PROMOTION SCRIPT
-- ==========================================
-- This script ensures the user 'eiadmokhtar67@gmail.com' 
-- has full admin privileges in both profiles and user_roles tables.

DO $$
DECLARE
  target_email TEXT := 'eiadmokhtar67@gmail.com';
  user_uuid UUID;
BEGIN
  -- 1. Get the user ID from auth.users
  SELECT id INTO user_uuid FROM auth.users WHERE email = target_email;

  IF user_uuid IS NOT NULL THEN
    -- 2. Update or Insert into profiles
    INSERT INTO public.profiles (id, full_name, role, status)
    VALUES (user_uuid, 'Admin User', 'admin', 'accepted')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', status = 'accepted';

    -- 3. Update or Insert into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_uuid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING; -- Assuming unique constraint on user_id, role

    -- If no conflict but we want to ensure they have the role
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = user_uuid AND role = 'admin') THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (user_uuid, 'admin');
    END IF;

    RAISE NOTICE 'User % has been promoted to Admin successfully.', target_email;
  ELSE
    RAISE WARNING 'User with email % was not found in auth.users. Please sign up first or use the addition script.', target_email;
  END IF;
END $$;
