-- Safer shared creator lookup via RPC (replaces broad public profile-read policy)

-- Remove broad public profile-read policy to reduce user enumeration surface
DROP POLICY IF EXISTS "Public can read shared creators" ON profiles;

-- Remove anonymous direct table read; authenticated access remains controlled by existing app policies
REVOKE SELECT ON profiles FROM anon;

-- Expose only creator full_name for an existing share token
CREATE OR REPLACE FUNCTION public.get_shared_creator_meta(p_share_token text)
RETURNS TABLE (full_name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NULLIF(TRIM(p.full_name), '') AS full_name
  FROM memorization_sets ms
  JOIN profiles p ON p.id = ms.user_id
  WHERE ms.share_token = p_share_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_creator_meta(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_creator_meta(text) TO anon, authenticated;

-- Ensure PostgREST sees newly created function without waiting for periodic cache refresh
NOTIFY pgrst, 'reload schema';
