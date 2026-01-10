-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    leader_id UUID REFERENCES auth.users(id) NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add team_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 1. Create Default Team for Super Admin (Migration)
DO $$
DECLARE
    super_admin_id UUID;
    default_team_id UUID;
BEGIN
    -- Get Super Admin ID (using the known admin email)
    SELECT id INTO super_admin_id FROM auth.users WHERE email = 'eiadmokhtar67@gmail.com' LIMIT 1;

    IF super_admin_id IS NOT NULL THEN
        -- Create default team if it doesn't exist
        INSERT INTO public.teams (name, leader_id, code)
        VALUES ('Global Team', super_admin_id, 'MAIN2026')
        ON CONFLICT (code) DO NOTHING
        RETURNING id INTO default_team_id;

        -- If team already existed and we didn't insert (conflict), get its ID
        IF default_team_id IS NULL THEN
            SELECT id INTO default_team_id FROM public.teams WHERE code = 'MAIN2026';
        END IF;

        -- Migrate all existing profiles to this team if they don't have one
        UPDATE public.profiles
        SET team_id = default_team_id
        WHERE team_id IS NULL;
        
        RAISE NOTICE 'Migration completed: Users assigned to Team ID %', default_team_id;
    ELSE
        RAISE NOTICE 'Super Admin not found. Skipping migration.';
    END IF;
END $$;

-- RLS Policies for Teams

-- Everyone can view teams (needed to validate code during signup)
DROP POLICY IF EXISTS "Public teams are viewable" ON public.teams;
CREATE POLICY "Public teams are viewable" ON public.teams
    FOR SELECT USING (true);

-- Only leaders can update their own team
DROP POLICY IF EXISTS "Leaders can update own team" ON public.teams;
CREATE POLICY "Leaders can update own team" ON public.teams
    FOR UPDATE USING (auth.uid() = leader_id);

-- Leaders can insert their own team
DROP POLICY IF EXISTS "Leaders can insert own team" ON public.teams;
CREATE POLICY "Leaders can insert own team" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() = leader_id);

-- RLS Policies for Profiles (Update)

-- Create policy for Team Leaders to view their team members
DROP POLICY IF EXISTS "Team leaders can view their members" ON public.profiles;
CREATE POLICY "Team leaders can view their members" ON public.profiles
    FOR SELECT
    USING (
        -- User is the leader of the team that the profile belongs to
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE teams.id = profiles.team_id 
            AND teams.leader_id = auth.uid()
        )
    );

-- Ensure users can see their own profile (usually exists, but good to verify/add)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Ensure Super Admin can see everyone (usually handled by service role or specific admin policy, updating here if needed)
-- Assuming exisiting policies handle admin visibility, but adding a specific one just in case
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );
