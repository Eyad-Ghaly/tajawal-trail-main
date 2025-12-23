-- Function to refresh progress stats for a specific user
CREATE OR REPLACE FUNCTION public.refresh_user_progress(uid UUID)
RETURNS void AS $$
DECLARE
    total_data_lessons INTEGER;
    completed_data_lessons INTEGER;
    total_english_lessons INTEGER;
    completed_english_lessons INTEGER;
    total_soft_lessons INTEGER;
    completed_soft_lessons INTEGER;
    user_lvl user_level;
    total_relevant_tasks INTEGER;
    completed_tasks INTEGER;
    d_progress INTEGER := 0;
    e_progress INTEGER := 0;
    s_progress INTEGER := 0;
    t_progress INTEGER := 0;
    o_progress INTEGER := 0;
BEGIN
    -- Get user level
    SELECT level INTO user_lvl FROM public.profiles WHERE id = uid;

    -- Lesson Stats
    SELECT count(*) INTO total_data_lessons FROM public.lessons WHERE track_type = 'data' AND published = true;
    SELECT count(*) INTO completed_data_lessons FROM public.user_lessons ul JOIN public.lessons l ON ul.lesson_id = l.id 
    WHERE ul.user_id = uid AND l.track_type = 'data' AND ul.watched = true;
    
    SELECT count(*) INTO total_english_lessons FROM public.lessons WHERE track_type = 'english' AND published = true;
    SELECT count(*) INTO completed_english_lessons FROM public.user_lessons ul JOIN public.lessons l ON ul.lesson_id = l.id 
    WHERE ul.user_id = uid AND l.track_type = 'english' AND ul.watched = true;

    SELECT count(*) INTO total_soft_lessons FROM public.lessons WHERE track_type = 'soft' AND published = true;
    SELECT count(*) INTO completed_soft_lessons FROM public.user_lessons ul JOIN public.lessons l ON ul.lesson_id = l.id 
    WHERE ul.user_id = uid AND l.track_type = 'soft' AND ul.watched = true;

    IF total_data_lessons > 0 THEN d_progress := (completed_data_lessons * 100) / total_data_lessons; END IF;
    IF total_english_lessons > 0 THEN e_progress := (completed_english_lessons * 100) / total_english_lessons; END IF;
    IF total_soft_lessons > 0 THEN s_progress := (completed_soft_lessons * 100) / total_soft_lessons; END IF;

    -- Task Stats
    SELECT count(*) INTO total_relevant_tasks FROM public.tasks WHERE published = true AND (level IS NULL OR level = user_lvl);
    SELECT count(*) INTO completed_tasks FROM public.user_tasks ut JOIN public.tasks t ON ut.task_id = t.id
    WHERE ut.user_id = uid AND ut.status = 'approved' AND (t.level IS NULL OR t.level = user_lvl);

    IF total_relevant_tasks > 0 THEN t_progress := (completed_tasks * 100) / total_relevant_tasks; END IF;

    -- Overall calculation: (avg(tracks) * 0.5) + (tasks * 0.5)
    o_progress := (((d_progress + e_progress + s_progress) / 3.0) * 0.5 + (t_progress * 0.5));

    -- Update Profile
    UPDATE public.profiles
    SET 
        data_progress = d_progress,
        english_progress = e_progress,
        soft_progress = s_progress,
        overall_progress = o_progress,
        updated_at = now()
    WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to auto-refresh progress
CREATE OR REPLACE FUNCTION public.handle_progress_update()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.refresh_user_progress(OLD.user_id);
        RETURN OLD;
    ELSE
        PERFORM public.refresh_user_progress(NEW.user_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to user_lessons
DROP TRIGGER IF EXISTS on_user_lesson_change ON public.user_lessons;
CREATE TRIGGER on_user_lesson_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_lessons
FOR EACH ROW EXECUTE FUNCTION public.handle_progress_update();

-- Apply to user_tasks
DROP TRIGGER IF EXISTS on_user_task_change ON public.user_tasks;
CREATE TRIGGER on_user_task_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_progress_update();

-- Initial sync for all users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.profiles LOOP
        PERFORM public.refresh_user_progress(r.id);
    END LOOP;
END;
$$;
