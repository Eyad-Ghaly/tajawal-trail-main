-- ==========================================
-- 06. ANALYTICS QUERIES
-- ==========================================
-- ✅ SAFE: purely SELECT statements.
-- Use these to monitor system usage.

-- 1. count users by governorate
select governorate, count(*) 
from public.profiles 
group by governorate 
order by count(*) desc;

-- 2. daily active users (checked in today)
select count(*) as active_today 
from public.daily_checkin 
where date = current_date;

-- 3. count users by level
select level, count(*) 
from public.profiles 
group by level;

-- 4. top 10 leaderboard
select full_name, xp_total, overall_progress 
from public.profiles 
order by xp_total desc 
limit 10;
