-- ==========================================
-- MASTER RESCUE SCRIPT (Tajawal Trail)
-- ==========================================
-- Run this in the SQL Editor to fix Admin login and Sign-up errors.

-- 1. FIX THE TRIGGER (RE-DESIGNED FOR ROBUSTNESS)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_admin boolean;
  meta_level text;
begin
  is_admin := (lower(new.email) = 'eiadmokhtar67@gmail.com');
  meta_level := new.raw_user_meta_data->>'level';

  -- 1. Create/Update Profile
  insert into public.profiles (
    id, 
    full_name, 
    avatar_url, 
    role, 
    level, 
    governorate, 
    membership_number, 
    status
  )
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', 'User'), 
    new.raw_user_meta_data->>'avatar_url', 
    case when is_admin then 'admin'::app_role else 'learner'::app_role end,
    case 
      when meta_level is null or meta_level = '' then 'Beginner'::user_level 
      else meta_level::user_level 
    end,
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'membership_number',
    case when is_admin then 'approved' else 'pending' end
  )
  on conflict (id) do update 
  set role = excluded.role,
      status = excluded.status,
      full_name = excluded.full_name,
      level = excluded.level,
      governorate = excluded.governorate,
      membership_number = excluded.membership_number;

  -- 2. Create Role Entry
  if is_admin then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::app_role)
    on conflict (user_id, role) do nothing;
  end if;

  return new;
exception when others then
  -- This ensures the user is still created even if the profile sync fails
  -- but usually we want it to fail so we can debug. 
  -- We'll raise a warning instead of a hard crash if needed, 
  -- but for now, let's let it crash with a clear message.
  raise exception 'Database error in handle_new_user trigger: %', sqlerrm;
end;
$$ language plpgsql security definer;

-- 2. RESET ADMIN CREDENTIALS & CONFIRMATION
DO $$
DECLARE
  target_email TEXT := 'eiadmokhtar67@gmail.com';
  target_id UUID;
BEGIN
  -- 1. Check if user exists
  SELECT id INTO target_id FROM auth.users WHERE email = target_email;

  IF target_id IS NOT NULL THEN
    -- 2. Reset Password to: dida3/2/2001#
    -- 3. Confirm Email
    UPDATE auth.users 
    SET 
      encrypted_password = extensions.crypt('dida3/2/2001#', extensions.gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}',
      raw_user_meta_data = '{"full_name":"Eiad Mokhtar Admin"}'
    WHERE id = target_id;

    -- 4. Re-ensure Profile & Roles
    INSERT INTO public.profiles (id, full_name, role, status)
    VALUES (target_id, 'Eiad Mokhtar Admin', 'admin', 'approved')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'approved';

    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_id, 'admin')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Admin user % has been reset and confirmed.', target_email;
  ELSE
    RAISE NOTICE 'User % not found. Please sign up first or run the full setup.', target_email;
  END IF;
END $$;

-- 3. ENSURE GRANTS
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

RAISE NOTICE 'Rescue operation complete. Please try logging in again.';
