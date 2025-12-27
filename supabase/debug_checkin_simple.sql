-- ==========================================
-- DEBUG CHECKIN - Simple Troubleshooting
-- ==========================================
-- استخدم هذا الملف لو عندك مشكلة في الـ Daily Check-in
-- شغّل الخطوات واحدة واحدة

-- ==========================================
-- الخطوة 1: اعرف الـ User ID بتاعك
-- ==========================================
-- انسخ الـ ID من النتيجة واستخدمه في الخطوات التالية
SELECT 
    au.id as user_id,
    au.email,
    p.full_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'eiadmokhtar67@gmail.com';  -- غير الإيميل لو مش ده بتاعك


-- ==========================================
-- الخطوة 2: شوف آخر Check-ins عملتها
-- ==========================================
-- استبدل 'YOUR_USER_ID_HERE' بالـ ID من الخطوة 1
-- مثال: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

SELECT 
    date as "التاريخ",
    xp_generated as "النقاط",
    created_at as "وقت الإنشاء"
FROM public.daily_checkin
WHERE user_id = 'YOUR_USER_ID_HERE'  -- ⚠️ استبدل ده بالـ ID بتاعك
ORDER BY date DESC
LIMIT 5;


-- ==========================================
-- الخطوة 3: احذف Check-in اليوم (لو عايز تجرب تاني)
-- ==========================================
-- ⚠️ استخدم بحذر! ده هيحذف check-in اليوم عشان تقدر تعمل واحد جديد

-- DELETE FROM public.daily_checkin 
-- WHERE user_id = 'YOUR_USER_ID_HERE'  -- ⚠️ استبدل ده بالـ ID بتاعك
-- AND date = '2025-12-24';  -- ⚠️ غير التاريخ للتاريخ المحلي بتاعك


-- ==========================================
-- الخطوة 4: جرب الـ Check-in يدوياً
-- ==========================================
-- ده هيعمل check-in جديد بالتاريخ المحلي بتاعك

-- SELECT public.perform_daily_checkin(
--     'YOUR_USER_ID_HERE'::uuid,  -- ⚠️ استبدل ده بالـ ID بتاعك
--     '2025-12-24'::date  -- ⚠️ غير ده للتاريخ المحلي بتاعك
-- );


-- ==========================================
-- الخطوة 5: تحقق إن الـ Function شغالة صح
-- ==========================================
-- المفروض يطلع: perform_daily_checkin | uid uuid, checkin_date date

SELECT 
    routine_name as "اسم الـ Function",
    string_agg(
        parameter_name || ' ' || data_type, 
        ', ' 
        ORDER BY ordinal_position
    ) as "Parameters"
FROM information_schema.parameters
WHERE specific_schema = 'public' 
AND routine_name = 'perform_daily_checkin'
GROUP BY routine_name;


-- ==========================================
-- نصائح مهمة
-- ==========================================
-- 1. لازم تستبدل 'YOUR_USER_ID_HERE' بالـ ID الحقيقي من الخطوة 1
-- 2. لازم تغير التاريخ للتاريخ المحلي بتاعك (مش UTC)
-- 3. لو عايز تحذف check-in، شيل الـ -- من قدام الـ DELETE
-- 4. لو عايز تجرب الـ function يدوياً، شيل الـ -- من قدام الـ SELECT
-- ==========================================
