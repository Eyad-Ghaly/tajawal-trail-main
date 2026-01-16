-- ==========================================
-- 01_RLS.sql (MASTER) - STRICT TEAM ISOLATION
-- ==========================================
-- Description: Defines Row Level Security policies. 
-- STRICT MODE: Users (including Admins) only see data within their 'team_id'.

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES
DROP POLICY IF EXISTS "Profiles viewable by team members" ON public.profiles;
CREATE POLICY "Profiles viewable by team members"
ON public.profiles FOR SELECT
USING (
  (team_id IS NOT NULL AND team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
  OR id = auth.uid()
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins update team members" ON public.profiles;
CREATE POLICY "Admins update team members"
ON public.profiles FOR UPDATE
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'team_leader')
);

-- 2. TEAMS
DROP POLICY IF EXISTS "Teams viewable by members" ON public.teams;
CREATE POLICY "Teams viewable by members"
ON public.teams FOR SELECT
USING (
  id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  OR leader_id = auth.uid()
);

DROP POLICY IF EXISTS "Leader update team" ON public.teams;
CREATE POLICY "Leader update team"
ON public.teams FOR UPDATE
USING (leader_id = auth.uid());

-- 3. POSTS
DROP POLICY IF EXISTS "Team View Posts" ON public.posts;
CREATE POLICY "Team View Posts"
ON public.posts FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Team Create Posts" ON public.posts;
CREATE POLICY "Team Create Posts"
ON public.posts FOR INSERT
WITH CHECK (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Author/Admin Manage Posts" ON public.posts;
CREATE POLICY "Author/Admin Manage Posts"
ON public.posts FOR ALL
USING (
  user_id = auth.uid() OR
  (
    team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) 
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'team_leader')
  )
);

-- 4. INTERACTIONS (Comments/Likes)
DROP POLICY IF EXISTS "View Comments" ON public.post_comments;
CREATE POLICY "View Comments"
ON public.post_comments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
);

DROP POLICY IF EXISTS "Add Comments" ON public.post_comments;
CREATE POLICY "Add Comments"
ON public.post_comments FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
);

DROP POLICY IF EXISTS "View Likes" ON public.post_likes;
CREATE POLICY "View Likes"
ON public.post_likes FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
);

DROP POLICY IF EXISTS "Add Likes" ON public.post_likes;
CREATE POLICY "Add Likes"
ON public.post_likes FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
);

-- 5. CHAT
DROP POLICY IF EXISTS "Team View Chat" ON public.chat_messages;
CREATE POLICY "Team View Chat"
ON public.chat_messages FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Team Send Chat" ON public.chat_messages;
CREATE POLICY "Team Send Chat"
ON public.chat_messages FOR INSERT
WITH CHECK (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

-- 6. CONTENT (Lessons/Tasks)
DROP POLICY IF EXISTS "Lessons Visibility" ON public.lessons;
CREATE POLICY "Lessons Visibility"
ON public.lessons FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Tasks Visibility" ON public.tasks;
CREATE POLICY "Tasks Visibility"
ON public.tasks FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins Manage Lessons" ON public.lessons;
CREATE POLICY "Admins Manage Lessons"
ON public.lessons FOR ALL
USING (
  (team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'team_leader'))
  OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND team_id IS NULL)
);

DROP POLICY IF EXISTS "Admins Manage Tasks" ON public.tasks;
CREATE POLICY "Admins Manage Tasks"
ON public.tasks FOR ALL
USING (
  (team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'team_leader'))
  OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND team_id IS NULL)
);

-- 7. NOTIFICATIONS
DROP POLICY IF EXISTS "Own Notifications" ON public.notifications;
CREATE POLICY "Own Notifications"
ON public.notifications FOR ALL
USING (user_id = auth.uid());
