-- ==========================================
-- FIX CHAT DISPLAY ISSUE
-- ==========================================
-- The frontend expects a 'public_profiles' view to display user names in chat.
-- This script creates that view and ensures it's accessible.

-- 1. Create the view
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  level
FROM public.profiles;

-- 2. Grant permissions
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- 3. Verify chat_messages policies
-- Admin policy
DROP POLICY IF EXISTS "Admins manage chat" ON chat_messages;
CREATE POLICY "Admins manage chat" 
ON chat_messages FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Reload cache
NOTIFY pgrst, 'reload config';

RAISE NOTICE 'Chat display fix applied successfully.';
