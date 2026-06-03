-- ============================================================
-- Invoices table for single-company billing multiple clients
-- ============================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete set null,
  client_email text not null,
  amount_in_cents integer not null check (amount_in_cents >= 0),
  currency text default 'usd',
  description text,
  status text default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled')),
  stripe_payment_intent_id text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger invoices_updated_at
  before update on public.invoices
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- RLS Policies
-- ============================================================

alter table public.invoices enable row level security;

create policy "Sellers can CRUD own invoices"
  on public.invoices for all
  to authenticated
  using (seller_id = auth.uid());

create policy "Clients can view own invoices"
  on public.invoices for select
  to authenticated
  using (client_id = auth.uid());

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_invoices_seller_id on public.invoices(seller_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_stripe_pi on public.invoices(stripe_payment_intent_id);
