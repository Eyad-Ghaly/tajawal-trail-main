-- Debug Script: Check Daily Check-in Status
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check your current user ID (replace with your actual email)
SELECT id, email, raw_user_meta_data->>'full_name' as name
FROM auth.users 
WHERE email = 'eiadmokhtar67@gmail.com';  -- Replace with your email

-- 2. Check all check-ins for your user (replace USER_ID with the ID from step 1)
SELECT 
    id,
    user_id,
    date,
    data_task,
    lang_task,
    soft_task,
    xp_generated,
    created_at,
    CURRENT_DATE as server_current_date,
    CURRENT_TIMESTAMP as server_current_timestamp
FROM public.daily_checkin
WHERE user_id = 'YOUR_USER_ID_HERE'  -- Replace with your user ID
ORDER BY date DESC
LIMIT 10;

-- 3. Check if the function exists with the new signature
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'perform_daily_checkin';

-- 4. Test the function manually with today's local date
-- Replace USER_ID and adjust the date to your local date
SELECT public.perform_daily_checkin(
    'YOUR_USER_ID_HERE'::uuid,
    '2025-12-24'::date  -- Use your current local date
);

-- 5. Delete today's check-in if you want to test again (OPTIONAL - BE CAREFUL)
-- DELETE FROM public.daily_checkin 
-- WHERE user_id = 'YOUR_USER_ID_HERE' 
-- AND date = '2025-12-24';  -- Use your current local date
