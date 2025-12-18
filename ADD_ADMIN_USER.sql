-- SQL Script to manually add an admin user
-- Run this in the Supabase SQL Editor

DO $$
DECLARE
  new_user_id UUID := extensions.uuid_generate_v4();
  user_email TEXT := 'eiadmokhtar67@gmail.com';
  user_password TEXT := 'dida3/2/2001#';
BEGIN
  -- 1. Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      user_email,
      extensions.crypt(user_password, extensions.gen_salt('bf')),
      now(),
      NULL,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Eiad Mokhtar"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- 2. The trigger on_auth_user_created should handle profile creation automatically.
    -- However, we want to ensure the status is 'accepted' and role is 'admin'.
    
    -- Wait a bit for the trigger or just update/insert directly to be safe
    -- The trigger handle_new_user already sets role based on email.
    -- We just need to update the status.
    
    UPDATE public.profiles 
    SET status = 'accepted'
    WHERE id = new_user_id;

    RAISE NOTICE 'User created successfully with ID: %', new_user_id;
  ELSE
    RAISE NOTICE 'User with email % already exists.', user_email;
  END IF;
END $$;
