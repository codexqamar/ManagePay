-- ============================================================
-- 1. ROLES SYSTEM
-- ============================================================

-- Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Update handle_new_user to set admin for specific email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    CASE 
      WHEN new.email = 'admin@stratonally.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles (if any) to have a role
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@stratonally.com';

-- Helper used by RLS policies. SECURITY DEFINER prevents recursive profile
-- policy evaluation when checking whether the current user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================
-- 2. COMPANIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  address text,
  phone text,
  website text,
  logo_url text,
  payment_base_url text,
  tax_id text,
  stripe_account_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Re-enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Companies Policies
CREATE POLICY "Anyone authenticated can view active companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage companies"
  ON public.companies FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 3. UPDATING RLS FOR INVOICES & CLIENTS
-- ============================================================

-- Drop existing restrictive policies to replace them with role-aware ones
DROP POLICY IF EXISTS "Sellers can manage own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;

-- Invoices Policies
CREATE POLICY "Invoices role-based access"
  ON public.invoices FOR ALL
  TO authenticated
  USING (
    seller_id = auth.uid() OR public.is_admin()
  );

-- Clients Policies
CREATE POLICY "Clients role-based access"
  ON public.clients FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_admin()
  );

-- Profiles Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Trigger for companies updated_at
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Reload schema
NOTIFY pgrst, 'reload schema';
