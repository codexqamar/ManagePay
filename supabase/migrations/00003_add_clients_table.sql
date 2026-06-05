-- ============================================================
-- Clients table for saved invoice recipients
-- ============================================================

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text not null,
  company_name text,
  phone text,
  address text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger clients_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- RLS Policies
-- ============================================================

alter table public.clients enable row level security;

create policy "Users can CRUD own clients"
  on public.clients for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_clients_user_id on public.clients(user_id);
create index if not exists idx_clients_email on public.clients(email);
create index if not exists idx_clients_is_active on public.clients(is_active);
