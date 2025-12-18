-- 1. Add track_type column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_lessons' AND column_name = 'track_type') THEN 
        ALTER TABLE custom_lessons ADD COLUMN track_type text DEFAULT 'data'; 
    END IF; 
END $$;

-- 2. Ensure RLS Policy exists
DROP POLICY IF EXISTS "Admins can insert custom lessons" ON custom_lessons;
CREATE POLICY "Admins can insert custom lessons"
ON custom_lessons
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. CRITICAL: Reload the PostgREST schema cache
-- This fixes the error: "Could not find the 'track_type' column... in the schema cache"
NOTIFY pgrst, 'reload config';
