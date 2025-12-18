-- Add track_type to custom_lessons
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_lessons' AND column_name = 'track_type') THEN 
        ALTER TABLE custom_lessons ADD COLUMN track_type track_type DEFAULT 'data'; 
    END IF; 
END $$;

-- Drop existing policy if it exists to recreate it correctly
DROP POLICY IF EXISTS "Admins can insert custom lessons" ON custom_lessons;

-- Create policy for admins to insert custom lessons
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
