-- Add new columns to profiles for registration
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS governorate text,
ADD COLUMN IF NOT EXISTS membership_number text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS placement_test_url text;

-- Update handle_new_user function to include new fields and set status to pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, level, governorate, membership_number, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'learner'::app_role),
    COALESCE((NEW.raw_user_meta_data->>'level')::user_level, 'Beginner'::user_level),
    NEW.raw_user_meta_data->>'governorate',
    NEW.raw_user_meta_data->>'membership_number',
    'pending'
  );
  RETURN NEW;
END;
$$;

-- Create trigger on user_lessons for UPDATE to recalculate progress when unchecking lessons
DROP TRIGGER IF EXISTS on_user_lesson_update ON public.user_lessons;

CREATE TRIGGER on_user_lesson_update
  AFTER UPDATE ON public.user_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_progress();