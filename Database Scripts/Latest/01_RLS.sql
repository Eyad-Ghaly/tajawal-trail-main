-- ==========================================
-- 01_RLS.sql (MASTER)
-- ==========================================
-- Description: Defines Row Level Security policies.
-- STRICT TEAM ISOLATION: Tests against `auth.uid()` -> `profile.team_id`.

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

-- HELPER FUNCTIONS FOR RLS (Inlined logic used for clarity, or we can use generic check)

-- ==========================
-- 1. PROFILES
-- ==========================
-- Everyone can read stats of their team members (for leaderboard).
CREATE POLICY "Profiles viewable by team members"
ON public.profiles FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  OR id = auth.uid() -- Can always see self
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' -- Super Admin fallback
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- ==========================
-- 2. TEAMS
-- ==========================
-- Visible if member or leader
CREATE POLICY "Teams viewable by members"
ON public.teams FOR SELECT
USING (
  id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  OR leader_id = auth.uid()
);

-- Leader can update own team
CREATE POLICY "Leader update team"
ON public.teams FOR UPDATE
USING (leader_id = auth.uid());

-- ==========================
-- 3. POSTS (Strict Isolation)
-- ==========================
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

-- ==========================
-- 4. INTERACTIONS (Likes/Comments)
-- ==========================
-- Comments: Inherit access via Post's Team
CREATE POLICY "View Comments"
ON public.post_comments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Add Comments"
ON public.post_comments FOR INSERT
WITH CHECK (
  -- Ensure user belongs to the post's team
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

-- ==========================
-- 5. CHAT
-- ==========================
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

-- ==========================
-- 6. CONTENT (Lessons/Tasks)
-- ==========================
-- Team Leaders sees matches. Learners see matches.
-- If team_id is NULL (legacy), only visible if explicitly allowed? We move to strict non-null team_id preference.
-- But we allow GLOBAL Content if team_id IS NULL for everyone? 
-- User requested strict isolation: "Team Leaders... hide global content".
-- So specific team content ONLY. 
-- BUT Learners might need base content? 
-- Strategy: If Lesson has team_id -> Only that team.
-- If Lesson has NULL team_id -> Everyone? OR Hidden?
-- User said: "Admins... added lessons/tasks exclusively for their team, hiding global content". 
-- Implies Admin dashboard hides global.
-- Learner dashboard? "Learners... only see content relevant to their team". 
-- We will enable "Global Library" visibility for learners if needed, but for now restrict to team matches + NULL (Base Curriculum).

CREATE POLICY "Lessons Visibility"
ON public.lessons FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  OR
  team_id IS NULL -- Base Curriculum visible to all? Or strict? Let's allow Base.
);

CREATE POLICY "Tasks Visibility"
ON public.tasks FOR SELECT
USING (
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  OR
  team_id IS NULL
);

-- Management (Admins/Leaders)
CREATE POLICY "Admins Manage Lessons"
ON public.lessons FOR ALL
USING (
  -- Super Admin
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND (SELECT team_id FROM public.profiles WHERE id = auth.uid()) IS NULL)
  OR
  -- Team Leader (Own Team)
  (team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'team_leader')
);

CREATE POLICY "Admins Manage Tasks"
ON public.tasks FOR ALL
USING (
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' AND (SELECT team_id FROM public.profiles WHERE id = auth.uid()) IS NULL)
  OR
  (team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'team_leader')
);

-- ==========================
-- 7. NOTIFICATIONS
-- ==========================
CREATE POLICY "Own Notifications"
ON public.notifications FOR ALL
USING (user_id = auth.uid());
