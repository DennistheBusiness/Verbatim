-- =====================================================
-- Delete test users and all associated data
-- Run in Supabase SQL Editor (requires service role)
-- Cascades: auth.users → profiles → memorization_sets
--                                  → chunks
--                                  → set_tags
--                                  → tags
-- NOTE: Audio files in Storage bucket 'audio-recordings'
--       are NOT auto-deleted — remove manually if needed.
-- =====================================================

-- Preview what will be deleted before running the DELETE block below
SELECT
  u.id,
  u.email,
  u.created_at,
  COUNT(DISTINCT ms.id) AS sets,
  COUNT(DISTINCT c.id)  AS chunks,
  COUNT(DISTINCT t.id)  AS tags
FROM auth.users u
LEFT JOIN public.profiles       p  ON p.id = u.id
LEFT JOIN public.memorization_sets ms ON ms.user_id = p.id
LEFT JOIN public.chunks         c  ON c.set_id = ms.id
LEFT JOIN public.tags           t  ON t.user_id = p.id
WHERE u.email IN ('User@test.com2', 'User@test.com3')
GROUP BY u.id, u.email, u.created_at;

-- =====================================================
-- DELETE (uncomment after reviewing the preview above)
-- =====================================================

-- DELETE FROM auth.users
-- WHERE email IN ('User@test.com2', 'User@test.com3');
