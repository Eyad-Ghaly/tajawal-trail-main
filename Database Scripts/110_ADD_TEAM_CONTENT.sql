-- ==========================================
-- 110. ADD TEAM CONTENT SUPPORT
-- ==========================================

-- 1. Add team_id to lessons and tasks
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- 2. RLS Policies for Team Leaders (LESSONS)

-- Allow Team Leader to INSERT if they are the leader of the team
CREATE POLICY "Team Leaders can insert team lessons"
ON public.lessons
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT leader_id FROM public.teams WHERE id = team_id
  )
);

-- Allow Team Leader to UPDATE if they are the leader
CREATE POLICY "Team Leaders can update team lessons"
ON public.lessons
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT leader_id FROM public.teams WHERE id = team_id
  )
);

-- Allow Team Leader to DELETE if they are the leader
CREATE POLICY "Team Leaders can delete team lessons"
ON public.lessons
FOR DELETE
USING (
  auth.uid() IN (
    SELECT leader_id FROM public.teams WHERE id = team_id
  )
);

-- 3. RLS Policies for Team Leaders (TASKS)

-- Allow Team Leader to INSERT if they are the leader of the team
CREATE POLICY "Team Leaders can insert team tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT leader_id FROM public.teams WHERE id = team_id
  )
);

-- Allow Team Leader to UPDATE if they are the leader
CREATE POLICY "Team Leaders can update team tasks"
ON public.tasks
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT leader_id FROM public.teams WHERE id = team_id
  )
);

-- Allow Team Leader to DELETE if they are the leader
CREATE POLICY "Team Leaders can delete team tasks"
ON public.tasks
FOR DELETE
USING (
  auth.uid() IN (
    SELECT leader_id FROM public.teams WHERE id = team_id
  )
);

-- 4. Enable RLS on Tables if not already (Just in case)
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
