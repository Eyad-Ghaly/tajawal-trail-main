-- Refined Progress Sync Function (Includes Custom Lessons & Tasks)
CREATE OR REPLACE FUNCTION public.refresh_user_progress(uid UUID)
RETURNS void AS $$
DECLARE
    -- Regular Lessons
    total_reg_data INTEGER := 0;
    comp_reg_data INTEGER := 0;
    total_reg_eng INTEGER := 0;
    comp_reg_eng INTEGER := 0;
    total_reg_soft INTEGER := 0;
    comp_reg_soft INTEGER := 0;
    -- Custom Lessons
    total_cust_data INTEGER := 0;
    comp_cust_data INTEGER := 0;
    total_cust_eng INTEGER := 0;
    comp_cust_eng INTEGER := 0;
    total_cust_soft INTEGER := 0;
    comp_cust_soft INTEGER := 0;
    -- Tasks
    total_reg_tasks INTEGER := 0;
    comp_reg_tasks INTEGER := 0;
    total_cust_tasks INTEGER := 0;
    comp_cust_tasks INTEGER := 0;
    
    user_lvl user_level;
    d_prog NUMERIC := 0;
    e_prog NUMERIC := 0;
    s_prog NUMERIC := 0;
    t_prog NUMERIC := 0;
    o_prog NUMERIC := 0;
BEGIN
    -- Get user level
    SELECT level INTO user_lvl FROM public.profiles WHERE id = uid;
    IF user_lvl IS NULL THEN user_lvl := 'Beginner'; END IF;

    -- 1. TRACK PROGRESS (Lessons)
    -- Data
    SELECT count(*) INTO total_reg_data FROM public.lessons WHERE track_type = 'data' AND published = true;
    SELECT count(*) INTO comp_reg_data FROM public.user_lessons ul JOIN public.lessons l ON ul.lesson_id = l.id 
    WHERE ul.user_id = uid AND l.track_type = 'data' AND ul.watched = true;
    SELECT count(*) INTO total_cust_data FROM public.custom_lessons WHERE user_id = uid AND track_type = 'data';
    SELECT count(*) INTO comp_cust_data FROM public.custom_lessons WHERE user_id = uid AND track_type = 'data' AND completed = true;
    
    IF (total_reg_data + total_cust_data) > 0 THEN 
        d_prog := ((comp_reg_data + comp_cust_data)::NUMERIC / (total_reg_data + total_cust_data)::NUMERIC) * 100; 
    END IF;

    -- English
    SELECT count(*) INTO total_reg_eng FROM public.lessons WHERE track_type = 'english' AND published = true;
    SELECT count(*) INTO comp_reg_eng FROM public.user_lessons ul JOIN public.lessons l ON ul.lesson_id = l.id 
    WHERE ul.user_id = uid AND l.track_type = 'english' AND ul.watched = true;
    SELECT count(*) INTO total_cust_eng FROM public.custom_lessons WHERE user_id = uid AND track_type = 'english';
    SELECT count(*) INTO comp_cust_eng FROM public.custom_lessons WHERE user_id = uid AND track_type = 'english' AND completed = true;
    
    IF (total_reg_eng + total_cust_eng) > 0 THEN 
        e_prog := ((comp_reg_eng + comp_cust_eng)::NUMERIC / (total_reg_eng + total_cust_eng)::NUMERIC) * 100; 
    END IF;

    -- Soft Skills
    SELECT count(*) INTO total_reg_soft FROM public.lessons WHERE track_type = 'soft' AND published = true;
    SELECT count(*) INTO comp_reg_soft FROM public.user_lessons ul JOIN public.lessons l ON ul.lesson_id = l.id 
    WHERE ul.user_id = uid AND l.track_type = 'soft' AND ul.watched = true;
    SELECT count(*) INTO total_cust_soft FROM public.custom_lessons WHERE user_id = uid AND track_type = 'soft';
    SELECT count(*) INTO comp_cust_soft FROM public.custom_lessons WHERE user_id = uid AND track_type = 'soft' AND completed = true;
    
    IF (total_reg_soft + total_cust_soft) > 0 THEN 
        s_prog := ((comp_reg_soft + comp_cust_soft)::NUMERIC / (total_reg_soft + total_cust_soft)::NUMERIC) * 100; 
    END IF;

    -- 2. TASK PROGRESS
    -- Regular tasks
    SELECT count(*) INTO total_reg_tasks FROM public.tasks WHERE published = true AND (level IS NULL OR level = user_lvl);
    SELECT count(*) INTO comp_reg_tasks FROM public.user_tasks ut JOIN public.tasks t ON ut.task_id = t.id
    WHERE ut.user_id = uid AND ut.status = 'approved' AND (t.level IS NULL OR t.level = user_lvl);
    -- Custom tasks
    SELECT count(*) INTO total_cust_tasks FROM public.custom_tasks WHERE user_id = uid;
    SELECT count(*) INTO comp_cust_tasks FROM public.custom_tasks WHERE user_id = uid AND completed = true;
    
    IF (total_reg_tasks + total_cust_tasks) > 0 THEN 
        t_prog := ((comp_reg_tasks + comp_cust_tasks)::NUMERIC / (total_reg_tasks + total_cust_tasks)::NUMERIC) * 100; 
    END IF;

    -- 3. OVERALL CALCULATION
    o_prog := ((d_prog + e_prog + s_prog) / 3.0 * 0.5) + (t_prog * 0.5);

    -- 4. UPDATE PROFILE
    UPDATE public.profiles
    SET 
        data_progress = ROUND(d_prog)::INTEGER,
        english_progress = ROUND(e_prog)::INTEGER,
        soft_progress = ROUND(s_prog)::INTEGER,
        overall_progress = ROUND(o_prog)::INTEGER,
        updated_at = now()
    WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master triggers
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

-- Re-apply all triggers
DROP TRIGGER IF EXISTS on_user_lesson_change ON public.user_lessons;
CREATE TRIGGER on_user_lesson_change AFTER INSERT OR UPDATE OR DELETE ON public.user_lessons FOR EACH ROW EXECUTE FUNCTION public.handle_progress_update();

DROP TRIGGER IF EXISTS on_user_task_change ON public.user_tasks;
CREATE TRIGGER on_user_task_change AFTER INSERT OR UPDATE OR DELETE ON public.user_tasks FOR EACH ROW EXECUTE FUNCTION public.handle_progress_update();

DROP TRIGGER IF EXISTS on_custom_lesson_change ON public.custom_lessons;
CREATE TRIGGER on_custom_lesson_change AFTER INSERT OR UPDATE OR DELETE ON public.custom_lessons FOR EACH ROW EXECUTE FUNCTION public.handle_progress_update();

DROP TRIGGER IF EXISTS on_custom_task_change ON public.custom_tasks;
CREATE TRIGGER on_custom_task_change AFTER INSERT OR UPDATE OR DELETE ON public.custom_tasks FOR EACH ROW EXECUTE FUNCTION public.handle_progress_update();
