-- ==========================================
-- 107. FORCE REFRESH PROGRESS & VERIFY TRIGGERS
-- ==========================================

-- 1. VERIFY TRIGGERS EXIST
-- This query confirms that the automatic update logic is installed.
SELECT event_object_table, trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_user_lesson_change';

-- 2. FORCE REFRESH FOR EVERYONE
-- We call the function (which we defined in 04) for every single user ID.
-- This recalculates their percentages based on currently existing user_lessons/user_tasks.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.profiles LOOP
        PERFORM public.refresh_user_progress(r.id);
        RAISE NOTICE 'Refreshed progress for user: %', r.id;
    END LOOP;
END $$;

-- 3. CONFIRMATION
SELECT id, full_name, overall_progress, xp_total FROM public.profiles;
