-- Update handle_new_user function to support level selection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'learner'::app_role),
    COALESCE((NEW.raw_user_meta_data->>'level')::user_level, 'Beginner'::user_level)
  );
  RETURN NEW;
END;
$$;