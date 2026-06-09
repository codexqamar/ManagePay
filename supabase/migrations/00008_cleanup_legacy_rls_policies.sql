-- ============================================================
-- Clean up legacy policies left behind by earlier remote changes
-- ============================================================

DROP POLICY IF EXISTS "Users can CRUD own clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public read access to stripe details" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own stripe details" ON public.profiles;

-- These functions are used by triggers/RLS policies and should not be callable
-- as public RPC endpoints.
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
