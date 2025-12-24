-- Fix Daily Check-in to use Local Date
-- Run this in your Supabase SQL Editor

-- Update the perform_daily_checkin function to accept local date parameter
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

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION public.perform_daily_checkin(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_daily_checkin(UUID) TO authenticated;
