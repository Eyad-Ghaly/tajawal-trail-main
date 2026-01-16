-- ==========================================
-- 112. TEAM CONTENT VISIBILITY
-- ==========================================

-- 1. Drop existing permissive policies if they conflict
DROP POLICY IF EXISTS "Lessons viewable" ON public.lessons;
DROP POLICY IF EXISTS "Tasks viewable" ON public.tasks;
DROP POLICY IF EXISTS "Admins manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins manage tasks" ON public.tasks;

-- 2. Create STRICTER Select Policies for LESSONS

-- Super Admin: See ALL
CREATE POLICY "Super Admin sees all lessons"
ON public.lessons
FOR SELECT
USING (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role = 'admin' 
    and (team_id IS NULL) -- Assuming Super Admin has no team or specific role check if needed
  )
  OR
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role = 'admin' -- Global admin check
  )
);

-- Team Leader: See ONLY own team's lessons
CREATE POLICY "Team Leader sees own team lessons"
ON public.lessons
FOR SELECT
USING (
  team_id IN (
    SELECT id FROM public.teams WHERE leader_id = auth.uid()
  )
);

-- Learner: See Global (NULL team_id) OR Own Team's lessons
CREATE POLICY "Learners see global and team lessons"
ON public.lessons
FOR SELECT
USING (
  team_id IS NULL -- Global Content
  OR 
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) -- Team Content
);


-- 3. Create STRICTER Select Policies for TASKS

-- Super Admin: See ALL
CREATE POLICY "Super Admin sees all tasks"
ON public.tasks
FOR SELECT
USING (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role = 'admin' 
    and (team_id IS NULL)
  )
  OR
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role = 'admin'
  )
);

-- Team Leader: See ONLY own team's tasks
CREATE POLICY "Team Leader sees own team tasks"
ON public.tasks
FOR SELECT
USING (
  team_id IN (
    SELECT id FROM public.teams WHERE leader_id = auth.uid()
  )
);

-- Learner: See Global (NULL team_id) OR Own Team's tasks
CREATE POLICY "Learners see global and team tasks"
ON public.tasks
FOR SELECT
USING (
  team_id IS NULL -- Global Content
  OR 
  team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid()) -- Team Content
);

-- 4. Re-Apply Insert/Update/Delete Policies just to be safe (ensure no gaps)

-- Admins (Global) can manage everything
CREATE POLICY "Super Admin manages all lessons"
ON public.lessons    
FOR ALL
USING (
  exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

CREATE POLICY "Super Admin manages all tasks"
ON public.tasks
FOR ALL
USING (
  exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

-- (Team Leader policies were added in 110, they should still be valid as they are specific to leader_id match)
