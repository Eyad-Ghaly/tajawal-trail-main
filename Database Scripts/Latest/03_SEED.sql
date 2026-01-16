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

-- 3. FORCE ROLES (Run this to fix your accounts)

-- A. Fix Super Admin (You)
-- Sets role to 'admin' and ensures NO team (Global view)
UPDATE public.profiles 
SET role = 'admin', status = 'approved', team_id = NULL 
WHERE email ILIKE 'eiadmokhtar67@gmail.com';

-- B. Fix Team Leader (dida@erc.com)
-- Sets role to 'team_leader', approves them, and ensures they have a team.
DO $$
DECLARE
  dida_id uuid;
  dida_team_id uuid;
BEGIN
  -- Get Dida's ID (Case Insensitive)
  SELECT id INTO dida_id FROM public.profiles WHERE email ILIKE 'dida@erc.com';

  IF dida_id IS NOT NULL THEN
    -- 1. Update Profile Role
    UPDATE public.profiles SET role = 'team_leader', status = 'approved' WHERE id = dida_id;

    -- 2. Check or Create Team
    SELECT id INTO dida_team_id FROM public.teams WHERE leader_id = dida_id LIMIT 1;
    
    IF dida_team_id IS NULL THEN
        -- Create new team for Dida
        INSERT INTO public.teams (name, leader_id, code)
        VALUES ('فريق Dida', dida_id, 'DIDA2025')
        RETURNING id INTO dida_team_id;
    END IF;

    -- 3. Link Dida to their Team
    UPDATE public.profiles SET team_id = dida_team_id WHERE id = dida_id;
  END IF;
END $$;
