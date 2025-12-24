-- ========================================
-- COMPLETE FIX - Run this ENTIRE script
-- ========================================

-- Step 1: Drop old function versions
DROP FUNCTION IF EXISTS public.perform_daily_checkin(UUID);
DROP FUNCTION IF EXISTS public.perform_daily_checkin(UUID, DATE);

-- Step 2: Create new function with date parameter
CREATE FUNCTION public.perform_daily_checkin(uid UUID, checkin_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today_val DATE := checkin_date;
    existing_id UUID;
BEGIN
    -- Check if already checked in for this specific date
    SELECT id INTO existing_id 
    FROM public.daily_checkin 
    WHERE user_id = uid AND date = today_val;

    IF existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already checked in today');
    END IF;

    -- Perform insert
    INSERT INTO public.daily_checkin (user_id, date, data_task, lang_task, soft_task, xp_generated)
    VALUES (uid, today_val, true, true, true, 5);

    -- Increment XP
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

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.perform_daily_checkin(UUID, DATE) TO authenticated;

-- Step 4: Verify it worked
SELECT 
    'Verification' as step,
    routine_name,
    string_agg(
        COALESCE(parameter_name, 'return') || ': ' || 
        COALESCE(data_type, return_type), 
        ', '
    ) as signature
FROM (
    SELECT 
        r.routine_name,
        p.parameter_name,
        p.data_type,
        p.ordinal_position,
        r.data_type as return_type
    FROM information_schema.routines r
    LEFT JOIN information_schema.parameters p 
        ON r.specific_name = p.specific_name
    WHERE r.routine_schema = 'public' 
    AND r.routine_name = 'perform_daily_checkin'
) sub
GROUP BY routine_name;

-- ========================================
-- OPTIONAL: Delete old check-in records
-- ========================================
-- Uncomment the lines below ONLY if you want to delete 
-- the check-in record from today to test again

-- DELETE FROM public.daily_checkin 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')
-- AND date >= CURRENT_DATE - INTERVAL '1 day';
