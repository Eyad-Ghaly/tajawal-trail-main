-- Create chat_messages table for lessons and level classrooms
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  level_classroom user_level,
  parent_message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  CONSTRAINT message_belongs_to_lesson_or_classroom CHECK (
    (lesson_id IS NOT NULL AND level_classroom IS NULL) OR
    (lesson_id IS NULL AND level_classroom IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their level classroom or any lesson
CREATE POLICY "Users can view messages in their level or lessons"
ON public.chat_messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    lesson_id IS NOT NULL OR
    level_classroom = (SELECT level FROM public.profiles WHERE id = auth.uid())
  )
);

-- Users can insert messages in their level classroom or any lesson
CREATE POLICY "Users can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    lesson_id IS NOT NULL OR
    level_classroom = (SELECT level FROM public.profiles WHERE id = auth.uid())
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can delete any message
CREATE POLICY "Admins can delete any message"
ON public.chat_messages
FOR DELETE
USING (is_admin(auth.uid()));

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;