-- ==========================================
-- 113. STRICT TEAM ISOLATION OVERHAUL
-- ==========================================

-- 1. ADD TEAM_ID TO ALL SOCIAL TABLES
DO $$ BEGIN
    -- Posts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'team_id') THEN
        ALTER TABLE public.posts ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;

    -- Chat Messages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'team_id') THEN
        ALTER TABLE public.chat_messages ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;

    -- Notifications (Optional, but good for filtering team-wide announcements)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'team_id') THEN
        ALTER TABLE public.notifications ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. DATA MIGRATION: BACKFILL TEAM_ID
-- We assume content belongs to the team the author is CURRENTLY in.
-- If author has no team, we might need a "System Default Team" or leave it NULL (Global).
-- For strictness, we'll try to assign to author's team.

UPDATE public.posts
SET team_id = (SELECT team_id FROM public.profiles WHERE id = posts.user_id)
WHERE team_id IS NULL;

UPDATE public.chat_messages
SET team_id = (SELECT team_id FROM public.profiles WHERE id = chat_messages.user_id)
WHERE team_id IS NULL;

-- 3. STRICT RLS POLICIES

-- Helper to check "Is Super Admin"
-- (Logic: Role is admin AND team is null OR specific email if needed)
-- For simplicity, we assume Super Admin can bypass everything OR we enforce they act within a "Dev Team".
-- User request: "Super Admin has their own team (Developer Team)".
-- So Super Admin should ALSO follow the Team rules, just like everyone else. Everyone is isolated.

-- >>>> POSTS POLICY <<<<
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Admins can manage posts" ON public.posts;

CREATE POLICY "Team Members View Posts"
ON public.posts FOR SELECT
USING (
    team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
    OR 
    (team_id IS NULL AND (SELECT team_id FROM public.profiles WHERE id = auth.uid()) IS NULL)
);

CREATE POLICY "Team Members Create Posts"
ON public.posts FOR INSERT
WITH CHECK (
    team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Authors and Team Admins Manage Posts"
ON public.posts FOR ALL
USING (
    auth.uid() = user_id -- Author
    OR
    EXISTS ( -- Team Leader of this team
        SELECT 1 FROM public.teams 
        WHERE id = posts.team_id 
        AND leader_id = auth.uid()
    )
);

-- >>>> CHAT POLICY <<<<
DROP POLICY IF EXISTS "Chat messages all" ON public.chat_messages;
DROP POLICY IF EXISTS "Users insert chat" ON public.chat_messages;

CREATE POLICY "Team Members View Chat"
ON public.chat_messages FOR SELECT
USING (
    team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Team Members Insert Chat"
ON public.chat_messages FOR INSERT
WITH CHECK (
    team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
);

-- >>>> NOTIFICATIONS POLICY <<<<
-- Notifications are usually personal (user_id), but if we broadcast to team, we check team_id
-- Existing RLS is "Users manage own notifications" (user_id check). This is usually fine.
-- We'll leave it as personal only for now to avoid complexity, unless "Team Announcements" are needed.


-- >>>> UPDATE EXISTING LESSONS/TASKS POLICIES (Re-enforce strictness) <<<<
-- We did this in 112, but let's ensure "Super Admin" implies "Developer Team" logic if desired.
-- Actually, the user said "Super Admin has a team".
-- So, if Super Admin creates a lesson, it should have THEIR `team_id`.
-- The viewing logic in 112 allowed Super Admin to see ALL.
-- If the user wants Super Admin to be JUST another admin (but with Dev powers), they can see all or just theirs.
-- "Super admin ... sees only their team's content" was implied for "Admin", but Super Admin usually needs to debug everything.
-- We will keep Super Admin seeing ALL for safety, but Team Leaders seeing ONLY theirs.

-- (Code from 112 is still valid for Lessons/Tasks isolation)

-- 4. ENSURE INTEGRITY
-- Make team_id NOT NULL for strictness?
-- Problem: If a user leaves a team, what happens to their posts?
-- DELETE CASCADE on team_id means if team deletes, content deletes.
-- If user moves team, old posts stay with old team (logic: defined by 'team_id' column, not dynamic user lookup).
-- This is correct behavior for multi-tenant.

-- 5. FUNCTION TO AUTO-ASSIGN TEAM ON INSERT
-- If frontend forgets to send team_id, we can trigger it.
CREATE OR REPLACE FUNCTION public.set_content_team_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.team_id IS NULL THEN
        NEW.team_id := (SELECT team_id FROM public.profiles WHERE id = auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_created_set_team ON public.posts;
CREATE TRIGGER on_post_created_set_team 
BEFORE INSERT ON public.posts 
FOR EACH ROW EXECUTE FUNCTION public.set_content_team_id();

DROP TRIGGER IF EXISTS on_chat_created_set_team ON public.chat_messages;
CREATE TRIGGER on_chat_created_set_team 
BEFORE INSERT ON public.chat_messages 
FOR EACH ROW EXECUTE FUNCTION public.set_content_team_id();

DROP TRIGGER IF EXISTS on_lesson_created_set_team ON public.lessons;
CREATE TRIGGER on_lesson_created_set_team 
BEFORE INSERT ON public.lessons 
FOR EACH ROW EXECUTE FUNCTION public.set_content_team_id();

DROP TRIGGER IF EXISTS on_task_created_set_team ON public.tasks;
CREATE TRIGGER on_task_created_set_team 
BEFORE INSERT ON public.tasks 
FOR EACH ROW EXECUTE FUNCTION public.set_content_team_id();
