-- ============================================================
-- INVOICE SERVICES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invoice_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  default_rate integer DEFAULT 0, -- in cents
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_services ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone authenticated can view invoice services"
  ON public.invoice_services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage invoice services"
  ON public.invoice_services FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER invoice_services_updated_at
  BEFORE UPDATE ON public.invoice_services
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Seed with some defaults
INSERT INTO public.invoice_services (name)
VALUES 
  ('Consulting'),
  ('Development'),
  ('Design'),
  ('Support')
ON CONFLICT DO NOTHING;

-- Reload schema
NOTIFY pgrst, 'reload schema';
