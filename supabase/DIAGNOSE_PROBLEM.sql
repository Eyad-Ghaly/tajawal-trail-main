-- ========================================
-- DIAGNOSTIC SCRIPT - Run this to find the problem
-- ========================================

-- Step 1: Check what date is stored in daily_checkin for today
SELECT 
    'Current Check-ins' as info,
    dc.id,
    dc.user_id,
    dc.date as checkin_date,
    dc.created_at,
    CURRENT_DATE as server_current_date,
    CURRENT_TIMESTAMP as server_current_timestamp,
    (dc.date = CURRENT_DATE) as is_today_utc,
    p.email
FROM public.daily_checkin dc
JOIN public.profiles p ON dc.user_id = p.id
WHERE dc.date >= CURRENT_DATE - INTERVAL '2 days'
ORDER BY dc.date DESC, dc.created_at DESC;

-- Step 2: Check if the function has the new signature
SELECT 
    'Function Signature' as info,
    routine_name,
    string_agg(
        COALESCE(parameter_name, 'return') || ' ' || 
        COALESCE(data_type, return_type), 
        ', ' ORDER BY ordinal_position
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

-- Step 3: Test the function with a future date to see if it works
-- This won't affect your data, just tests if the function accepts the date parameter
SELECT 
    'Function Test' as info,
    public.perform_daily_checkin(
        (SELECT id FROM auth.users LIMIT 1),
        '2099-12-31'::date
    ) as test_result;

-- Step 4: Show the exact problem
SELECT 
    'Problem Analysis' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.parameters 
            WHERE specific_name IN (
                SELECT specific_name FROM information_schema.routines 
                WHERE routine_name = 'perform_daily_checkin'
            )
            AND parameter_name = 'checkin_date'
        ) THEN 'Function HAS checkin_date parameter ✓'
        ELSE 'Function MISSING checkin_date parameter ✗ - YOU NEED TO RUN THE SQL UPDATE!'
    END as function_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.daily_checkin 
            WHERE date = CURRENT_DATE 
            AND user_id = (SELECT id FROM auth.users WHERE email = 'eiadmokhtar67@gmail.com')
        ) THEN 'Check-in record EXISTS for today (UTC) ✗'
        ELSE 'No check-in record for today (UTC) ✓'
    END as checkin_status;
