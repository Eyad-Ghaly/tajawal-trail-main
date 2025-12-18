-- Allow users to update their own daily check-ins
CREATE POLICY "Users can update own check-ins"
ON public.daily_checkin
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);