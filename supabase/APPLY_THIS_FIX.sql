-- Complete Fix for Daily Check-in Local Date Issue
-- Run this entire script in Supabase SQL Editor

-- Step 1: Drop and recreate the function with proper local date support
DROP FUNCTION IF EXISTS public.perform_daily_checkin(UUID);
DROP FUNCTION IF EXISTS public.perform_daily_checkin(UUID, DATE);

CREATE OR REPLACE FUNCTION public.perform_daily_checkin(uid UUID, checkin_date DATE DEFAULT CURRENT_DATE)
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

-- Step 2: Grant permissions
GRANT EXECUTE ON FUNCTION public.perform_daily_checkin(UUID, DATE) TO authenticated;

-- Step 3: Optional - Clean up old check-ins from today if needed
-- IMPORTANT: Only run this if you want to delete today's check-in to test again
-- Uncomment the lines below and replace YOUR_USER_ID with your actual user ID

-- DELETE FROM public.daily_checkin 
-- WHERE user_id = 'YOUR_USER_ID'::uuid 
-- AND date >= CURRENT_DATE - INTERVAL '1 day';

-- Step 4: Verify the function was created
SELECT 
    routine_name,
    routine_type,
    string_agg(parameter_name || ' ' || data_type, ', ') as parameters
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p 
    ON r.specific_name = p.specific_name
WHERE routine_schema = 'public' 
AND routine_name = 'perform_daily_checkin'
GROUP BY routine_name, routine_type;
