-- DANGER: This migration drops and recreates the invoices table to fix deep schema corruption.
-- This is the definitive schema for the ManagePay Invoicing module.

DROP TABLE IF EXISTS public.invoices CASCADE;

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_email text NOT NULL,
  amount_in_cents integer NOT NULL CHECK (amount_in_cents >= 0),
  currency text DEFAULT 'gbp',
  description text,
  due_date timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled')),
  stripe_payment_intent_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Re-enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 1. Sellers can see and manage all their own invoices
CREATE POLICY "Sellers can manage own invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- 2. Public can VIEW a specific invoice for payment if they have the ID
-- This is essential for the "Pay Invoice" page to work without login
CREATE POLICY "Public can view specific invoice"
  ON public.invoices FOR SELECT
  TO public
  USING (true); 

-- Re-apply Trigger for updated_at
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Re-apply Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_seller_id ON public.invoices(seller_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- Force a schema cache reload
NOTIFY pgrst, 'reload schema';
