-- ==========================================
-- 03_SEED.sql (MASTER)
-- ==========================================
-- Description: Initial Badges, Storage buckets, and optional Admin setup.

-- 1. SEED BADGES
INSERT INTO public.badges (title, description, icon_path, xp_required)
VALUES
('بداية الطريق', 'أكملت أول درس', '/badges/start.png', 10),
('خبير البيانات', 'وصلت للمستوى المتوسط في البيانات', '/badges/data.png', 500),
('متحدث بطلاقة', 'وصلت للمستوى B في الإنجليزية', '/badges/english.png', 500),
('قائد الفريق', 'أنشأت فريقك الخاص', '/badges/leader.png', 0)
ON CONFLICT DO NOTHING;

-- 2. RESET FUNCTIONS (Use Carefully)
CREATE OR REPLACE FUNCTION public.reset_database_data()
RETURNS void AS $$
BEGIN
    TRUNCATE public.notifications CASCADE;
    TRUNCATE public.chat_messages CASCADE;
    TRUNCATE public.post_likes CASCADE;
    TRUNCATE public.post_comments CASCADE;
    TRUNCATE public.posts CASCADE;
    TRUNCATE public.user_tasks CASCADE;
    TRUNCATE public.user_lessons CASCADE;
    TRUNCATE public.custom_tasks CASCADE;
    TRUNCATE public.custom_lessons CASCADE;
    -- Do not truncate profiles/teams if you want to keep users.
    -- TRUNCATE public.teams CASCADE;
    -- TRUNCATE public.profiles CASCADE;
END;
$$ LANGUAGE plpgsql;

-- 3. INSTRUCTIONS
/*
To create your First Super Admin manually:
1. Sign up a user via the App.
2. Run this SQL:
   UPDATE public.profiles 
   SET role = 'admin', status = 'approved', team_id = NULL 
   WHERE email = 'YOUR_EMAIL@gmail.com';
*/
