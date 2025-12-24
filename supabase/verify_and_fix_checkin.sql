-- Comprehensive Daily Check-in Verification and Fix Script
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Verify Function Signature
-- ============================================
SELECT 
    routine_name,
    string_agg(
        parameter_name || ' ' || data_type, 
        ', ' 
        ORDER BY ordinal_position
    ) as signature
FROM information_schema.parameters
WHERE specific_schema = 'public' 
AND routine_name = 'perform_daily_checkin'
GROUP BY routine_name;

-- ============================================
-- STEP 2: Check Your User ID
-- ============================================
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name' as name
FROM auth.users 
WHERE email = 'eiadmokhtar67@gmail.com';  -- Replace with your email if different

-- ============================================
-- STEP 3: Check Recent Check-in Records
-- ============================================
-- Replace 'YOUR_USER_ID' with the ID from Step 2
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
    CURRENT_TIMESTAMP AT TIME ZONE 'UTC' as server_utc_time,
    '2025-12-24'::date as your_local_date  -- Update this to your current local date
FROM public.daily_checkin
WHERE user_id = 'YOUR_USER_ID'  -- Replace with your user ID from Step 2
ORDER BY date DESC
LIMIT 10;

-- ============================================
-- STEP 4: Delete Today's Check-in (OPTIONAL - FOR TESTING)
-- ============================================
-- ⚠️ UNCOMMENT THE LINES BELOW ONLY IF YOU WANT TO DELETE TODAY'S CHECK-IN
-- This allows you to test the check-in again

-- DELETE FROM public.daily_checkin 
-- WHERE user_id = 'YOUR_USER_ID'  -- Replace with your user ID
-- AND date = '2025-12-24';  -- Replace with your current local date

-- ============================================
-- STEP 5: Recreate Function with Correct Signature
-- ============================================
CREATE OR REPLACE FUNCTION public.perform_daily_checkin(
    uid UUID, 
    checkin_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today_val DATE := checkin_date;
    existing_id UUID;
BEGIN
    -- Check if already checked in today
    SELECT id INTO existing_id 
    FROM public.daily_checkin 
    WHERE user_id = uid AND date = today_val;

    IF existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already checked in today');
    END IF;

    -- Perform insert (all 3 tasks at once for 5 XP)
    INSERT INTO public.daily_checkin (user_id, date, data_task, lang_task, soft_task, xp_generated)
    VALUES (uid, today_val, true, true, true, 5);

    -- Increment XP in profiles
    UPDATE public.profiles 
    SET xp_total = COALESCE(xp_total, 0) + 5 
    WHERE id = uid;

    RETURN jsonb_build_object('success', true, 'message', 'Check-in successful');
EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already checked in (unique violation)');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- ============================================
-- STEP 6: Grant Permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.perform_daily_checkin(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_daily_checkin(UUID) TO authenticated;

-- ============================================
-- STEP 7: Test the Function Manually
-- ============================================
-- Replace 'YOUR_USER_ID' and adjust the date to your current local date
-- SELECT public.perform_daily_checkin(
--     'YOUR_USER_ID'::uuid,
--     '2025-12-24'::date
-- );
