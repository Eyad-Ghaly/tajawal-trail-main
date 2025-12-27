-- ==========================================
-- 07. DEBUG TOOLS
-- ==========================================
-- 🔧 TOOLS: Helpers for development and debugging.

-- 1. CHECK MY USER ID
-- Replace with your email to find your UUID
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';

-- 2. CHECK DAILY CHECKIN HISTORY
SELECT * FROM public.daily_checkin WHERE user_id = 'YOUR_UUID_HERE' ORDER BY date DESC;

-- 3. MANUALLY TRIGGER DAILY CHECKIN (LOCAL TIME)
-- Note: Requires a valid UUID and Date
-- SELECT public.perform_daily_checkin('YOUR_UUID_HERE', '2025-01-01');

-- 4. FORCE REFRESH PROGRESS FOR A USER
-- SELECT public.refresh_user_progress('YOUR_UUID_HERE');

-- 5. INSPECT RECENT LOGS/ERRORS (If you had a logging table, otherwise just a placeholder)
-- select * from log_table order by created_at desc limit 10;
