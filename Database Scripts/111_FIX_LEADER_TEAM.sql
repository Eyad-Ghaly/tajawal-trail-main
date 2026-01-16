-- Check if the user has a team
SELECT * FROM public.teams WHERE leader_id = (SELECT id FROM auth.users WHERE email = 'didaa@erc.com');

-- If no team exists, let's create one for testing
INSERT INTO public.teams (name, leader_id, code)
SELECT 
    'فريق القادة (تجريبي)', 
    id, 
    'LDR-101'
FROM auth.users 
WHERE email = 'didaa@erc.com'
AND NOT EXISTS (SELECT 1 FROM public.teams WHERE leader_id = auth.users.id);

-- Check again to confirm
SELECT * FROM public.teams WHERE leader_id = (SELECT id FROM auth.users WHERE email = 'didaa@erc.com');

-- Also, ensure the profile has status 'approved' and role 'team_leader'
UPDATE public.profiles
SET 
    status = 'approved',
    role = 'team_leader', 
    team_id = (SELECT id FROM public.teams WHERE leader_id = profiles.id) -- Self-link leader to their team (optional but good for consistency)
WHERE email = 'didaa@erc.com';
