-- Migration script to fix legacy English lessons and tasks
-- 1. Set default English Level 'B' for all English track items if null
-- 2. Clear General Level for English track items to avoid confusion

BEGIN;

-- Update Lessons
UPDATE public.lessons
SET english_level = 'B'
WHERE track_type = 'english' AND english_level IS NULL;

UPDATE public.lessons
SET level = NULL
WHERE track_type = 'english';

-- Update Tasks
UPDATE public.tasks
SET english_level = 'B'
WHERE track_type = 'english' AND english_level IS NULL;

UPDATE public.tasks
SET level = NULL
WHERE track_type = 'english';

COMMIT;
