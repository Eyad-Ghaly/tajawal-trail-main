-- ==========================================
-- 01_RLS.sql (MASTER) - REVISED STRICT
-- ==========================================

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
CREATE POLICY "Profiles viewable by team members"
ON public.profiles FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  OR id = auth.uid()
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- 2. TEAMS
CREATE POLICY "Teams viewable by members"
ON public.teams FOR SELECT
USING (
  id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  OR leader_id = auth.uid()
);

CREATE POLICY "Leader update team"
ON public.teams FOR UPDATE
USING (leader_id = auth.uid());

-- 3. POSTS (Strict)
CREATE POLICY "Team View Posts"
ON public.posts FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Team Create Posts"
ON public.posts FOR INSERT
WITH CHECK (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Author/Admin Manage Posts"
ON public.posts FOR ALL
USING (
  user_id = auth.uid() OR
  (SELECT team_id FROM public.profiles WHERE id = auth.uid()) = team_id AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'team_leader')
);

-- 4. INTERACTIONS
-- Comments
CREATE POLICY "View Comments"
ON public.post_comments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Add Comments"
ON public.post_comments FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
);

-- Likes
CREATE POLICY "View Likes"
ON public.post_likes FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Add Likes"
ON public.post_likes FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
);

-- 5. CHAT
CREATE POLICY "Team View Chat"
ON public.chat_messages FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Team Send Chat"
ON public.chat_messages FOR INSERT
WITH CHECK (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

-- 6. CONTENT (Lessons/Tasks) - STRICT UPDATE
-- Removed "OR team_id IS NULL" for learners/leaders. 
-- Only "Super Admin" (with no team?) sees NULL? Or just Strict Match.
-- User: "Admins... for their team... hiding global content". 

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

-- Management (Admins/Leaders)
CREATE POLICY "Admins Manage Lessons"
ON public.lessons FOR ALL
USING (
  -- Team Leader (Own Team)
  (team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'team_leader'))
  OR
  -- Super Admin (Global - if needed, but strictly enforcing team match above covers it if Super Admin HAS a team)
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND team_id IS NULL) -- Only Super Admin manages global
);

CREATE POLICY "Admins Manage Tasks"
ON public.tasks FOR ALL
USING (
  (team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'team_leader'))
  OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND team_id IS NULL)
);

-- 7. NOTIFICATIONS
CREATE POLICY "Own Notifications"
ON public.notifications FOR ALL
USING (user_id = auth.uid());
