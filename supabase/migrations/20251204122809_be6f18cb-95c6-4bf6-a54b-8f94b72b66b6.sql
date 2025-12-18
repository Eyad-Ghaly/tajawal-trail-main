-- Create custom_lessons table for admin-assigned lessons per user
CREATE TABLE public.custom_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_link TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own custom lessons"
ON public.custom_lessons FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom lessons"
ON public.custom_lessons FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all custom lessons"
ON public.custom_lessons FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all custom lessons"
ON public.custom_lessons FOR ALL
USING (is_admin(auth.uid()));

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can upload any avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update any avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND is_admin(auth.uid()));

-- Update timestamp trigger
CREATE TRIGGER update_custom_lessons_updated_at
BEFORE UPDATE ON public.custom_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();