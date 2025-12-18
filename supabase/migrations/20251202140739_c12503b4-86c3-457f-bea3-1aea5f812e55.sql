-- Create trigger to calculate streak when daily check-in is inserted
CREATE TRIGGER on_daily_checkin_calculate_streak
  AFTER INSERT ON public.daily_checkin
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_streak();