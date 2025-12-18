-- Drop the old trigger and function to recreate them
DROP TRIGGER IF EXISTS update_progress_on_lesson_completion ON user_lessons;
DROP FUNCTION IF EXISTS update_user_progress();
DROP FUNCTION IF EXISTS calculate_track_progress(uuid, track_type);

-- New function to calculate track progress including both lessons and tasks
CREATE OR REPLACE FUNCTION public.calculate_track_progress(p_user_id uuid, p_track_type track_type)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_lessons integer;
  completed_lessons integer;
  total_tasks integer;
  completed_tasks integer;
  total_items integer;
  completed_items integer;
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
  
  -- Count total published tasks for this track
  SELECT COUNT(*) INTO total_tasks
  FROM tasks
  WHERE track_type = p_track_type AND published = true;
  
  -- Count approved tasks for this user and track
  SELECT COUNT(*) INTO completed_tasks
  FROM user_tasks ut
  INNER JOIN tasks t ON ut.task_id = t.id
  WHERE ut.user_id = p_user_id 
    AND ut.status = 'approved'
    AND t.track_type = p_track_type
    AND t.published = true;
  
  -- Calculate total items and completed items
  total_items := total_lessons + total_tasks;
  completed_items := completed_lessons + completed_tasks;
  
  -- Calculate progress percentage
  IF total_items > 0 THEN
    progress_value := (completed_items::numeric / total_items::numeric) * 100;
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

-- Trigger on user_tasks to update progress when task is approved
CREATE TRIGGER update_progress_on_task_approval
AFTER INSERT OR UPDATE ON user_tasks
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION update_user_progress();