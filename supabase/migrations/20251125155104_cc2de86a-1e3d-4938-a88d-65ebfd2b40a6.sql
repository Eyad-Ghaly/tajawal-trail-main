-- تعديل سياسة إرسال الرسائل للسماح بالإرسال في أي level classroom
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;

CREATE POLICY "Users can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (
    lesson_id IS NOT NULL 
    OR level_classroom IS NOT NULL
  )
);