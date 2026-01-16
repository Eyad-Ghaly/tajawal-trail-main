-- ==========================================
-- 114_FIX_LEADER_ACCESS_AND_STRICT_CONTENT.sql
-- ==========================================

-- 1. DROP EXISTING POLICIES FOR LESSONS/TASKS RE-CREATION
DROP POLICY IF EXISTS "Lessons Visibility" ON public.lessons;
DROP POLICY IF EXISTS "Tasks Visibility" ON public.tasks;
DROP POLICY IF EXISTS "Admins Manage Lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins Manage Tasks" ON public.tasks;

-- 2. RE-CREATE RLS FOR STRICT TEAM ISOLATION (No Global Content)
CREATE POLICY "Lessons Visibility"
ON public.lessons FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Tasks Visibility"
ON public.tasks FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

-- 3. ALLOW TEAM LEADERS TO MANAGE THEIR CONTENT
CREATE POLICY "Admins Manage Lessons"
ON public.lessons FOR ALL
USING (
  -- Team Leader/Admin (Own Team)
  (team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'team_leader'))
  OR
  -- Super Admin (Global content management only)
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND team_id IS NULL)
);

CREATE POLICY "Admins Manage Tasks"
ON public.tasks FOR ALL
USING (
  (team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'team_leader'))
  OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND team_id IS NULL)
);

-- 4. ENSURE USER ROLES ARE UPDATED IF NEEDED (Optional Fix)
-- Ensure 'team_leader' is a valid role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'team_leader';

-- 5. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload config';
