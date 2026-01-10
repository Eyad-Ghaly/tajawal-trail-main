-- ==========================================
-- 109. MANUAL APPROVE TEAM LEADER
-- ==========================================
-- Use this to manually approve a user if the Admin Panel is stuck.

UPDATE public.profiles
SET 
    status = 'approved',
    level = 'Intermediate', -- Default Level
    english_level = 'B'     -- Default Level
WHERE 
    email = 'didaa@erc.com'; -- The email you want to approve

-- Verify the change
SELECT email, role, status FROM public.profiles WHERE email = 'didaa@erc.com';
