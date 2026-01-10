-- ==========================================
-- 108. DEBUG PENDING USERS
-- ==========================================

SELECT 
    id, 
    email, 
    full_name, 
    role, 
    status, 
    created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 10;
