-- ============================================================
-- Fix recursive profile RLS introduced by role-aware policies
-- ============================================================

-- The admin helper is used from policies on public.profiles and other tables.
-- It must bypass profile RLS while doing the role lookup, otherwise Postgres can
-- recursively evaluate policies on public.profiles.
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = user_id
      AND profile.role = 'admin'
  );
$$;

ALTER FUNCTION public.is_admin(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Remove duplicate/fragile policies before installing the stable set.
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Profiles select own or admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Profiles insert own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles update own or admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- Tighten role-aware policies so updates/inserts cannot reassign ownership.
DROP POLICY IF EXISTS "Invoices role-based access" ON public.invoices;
CREATE POLICY "Invoices role-based access"
  ON public.invoices FOR ALL
  TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Clients role-based access" ON public.clients;
CREATE POLICY "Clients role-based access"
  ON public.clients FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage companies" ON public.companies;
CREATE POLICY "Only admins can manage companies"
  ON public.companies FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';
