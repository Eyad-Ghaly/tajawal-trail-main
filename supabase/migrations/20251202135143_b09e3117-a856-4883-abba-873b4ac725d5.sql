-- Add level column to lessons table
ALTER TABLE public.lessons 
ADD COLUMN level public.user_level NULL;

-- Add level column to tasks table as well
ALTER TABLE public.tasks 
ADD COLUMN level public.user_level NULL;