-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notifications for all users when new lesson is added
CREATE OR REPLACE FUNCTION public.notify_new_lesson()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create notifications for published lessons
  IF NEW.published = true THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    SELECT 
      p.id,
      'درس جديد',
      'تم إضافة درس جديد: ' || NEW.title,
      'lesson',
      NEW.id
    FROM profiles p
    WHERE (NEW.level IS NULL OR p.level = NEW.level);
  END IF;
  RETURN NEW;
END;
$$;

-- Function to create notifications for all users when new task is added
CREATE OR REPLACE FUNCTION public.notify_new_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create notifications for published tasks
  IF NEW.published = true THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    SELECT 
      p.id,
      'مهمة جديدة',
      'تم إضافة مهمة جديدة: ' || NEW.title,
      'task',
      NEW.id
    FROM profiles p
    WHERE (NEW.level IS NULL OR p.level = NEW.level);
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_new_lesson_notify
  AFTER INSERT ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_lesson();

CREATE TRIGGER on_new_task_notify
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_task();