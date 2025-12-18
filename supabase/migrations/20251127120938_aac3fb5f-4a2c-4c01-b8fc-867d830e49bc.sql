-- Function to calculate track progress based on completed lessons
CREATE OR REPLACE FUNCTION public.calculate_track_progress(p_user_id uuid, p_track_type track_type)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_lessons integer;
  completed_lessons integer;
  progress_value numeric;
BEGIN
  -- Count total published lessons for this track
  SELECT COUNT(*) INTO total_lessons
  FROM lessons
  WHERE track_type = p_track_type AND published = true;
  
  -- Count completed lessons for this user and track
  SELECT COUNT(*) INTO completed_lessons
  FROM user_lessons ul
  INNER JOIN lessons l ON ul.lesson_id = l.id
  WHERE ul.user_id = p_user_id 
    AND ul.watched = true 
    AND l.track_type = p_track_type
    AND l.published = true;
  
  -- Calculate progress percentage
  IF total_lessons > 0 THEN
    progress_value := (completed_lessons::numeric / total_lessons::numeric) * 100;
  ELSE
    progress_value := 0;
  END IF;
  
  RETURN ROUND(progress_value, 2);
END;
$$;

-- Function to update user progress for all tracks
CREATE OR REPLACE FUNCTION public.update_user_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  data_prog numeric;
  english_prog numeric;
  soft_prog numeric;
  overall_prog numeric;
BEGIN
  -- Calculate progress for each track
  data_prog := calculate_track_progress(NEW.user_id, 'data');
  english_prog := calculate_track_progress(NEW.user_id, 'english');
  soft_prog := calculate_track_progress(NEW.user_id, 'soft');
  
  -- Calculate overall progress as average
  overall_prog := (data_prog + english_prog + soft_prog) / 3;
  
  -- Update user profile
  UPDATE profiles
  SET 
    data_progress = data_prog,
    english_progress = english_prog,
    soft_progress = soft_prog,
    overall_progress = ROUND(overall_prog, 2),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger on user_lessons to update progress when lesson is marked as watched
CREATE TRIGGER update_progress_on_lesson_completion
AFTER INSERT OR UPDATE ON user_lessons
FOR EACH ROW
WHEN (NEW.watched = true)
EXECUTE FUNCTION update_user_progress();

-- Function to calculate streak days
CREATE OR REPLACE FUNCTION public.calculate_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  last_checkin_date date;
  current_streak integer;
BEGIN
  -- Get the last check-in date before today
  SELECT date INTO last_checkin_date
  FROM daily_checkin
  WHERE user_id = NEW.user_id 
    AND date < NEW.date
  ORDER BY date DESC
  LIMIT 1;
  
  -- Get current streak
  SELECT COALESCE(streak_days, 0) INTO current_streak
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Update streak
  IF last_checkin_date IS NULL THEN
    -- First check-in
    current_streak := 1;
  ELSIF last_checkin_date = NEW.date - INTERVAL '1 day' THEN
    -- Consecutive day
    current_streak := current_streak + 1;
  ELSIF last_checkin_date < NEW.date - INTERVAL '1 day' THEN
    -- Streak broken, restart
    current_streak := 1;
  END IF;
  
  -- Update profile
  UPDATE profiles
  SET 
    streak_days = current_streak,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger on daily_checkin to update streak
CREATE TRIGGER update_streak_on_checkin
AFTER INSERT ON daily_checkin
FOR EACH ROW
EXECUTE FUNCTION calculate_streak();